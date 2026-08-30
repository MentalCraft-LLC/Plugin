/**
 * gmail core — bounded SMTP send atom owned by this extension.
 *
 * - GmailConfig: host/port/secure/user/pass, stored only in a local 0600 file.
 * - sendEmail: a minimal SMTP client (EHLO → STARTTLS when needed → AUTH LOGIN
 *   → MAIL FROM → RCPT TO → DATA → QUIT) built on node:net/tls with no
 *   third-party dependency. Credentials never enter tool parameters, chat,
 *   logs or evidence.
 * - The transport is injectable so the command sequence is testable without a
 *   real server.
 */

import { existsSync, lstatSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { atomicWriteSecret } from "../../secret/write.ts";
import { connect, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";

export const GMAIL_PROTOCOL = "holar.gmail.v1";
export const GMAIL_TOOL = "gmail";

export interface GmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export function configPath(): string {
  if (process.env.GMAIL_CONFIG_PATH) return process.env.GMAIL_CONFIG_PATH;
  return join(homedir(), ".pi", "agent", "gmail", "config.json");
}

const MAILBOX = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/;

function validMailbox(value: string): boolean {
  return value.length <= 254 && MAILBOX.test(value);
}

function normalizeConfig(value: unknown): GmailConfig {
  const c = value && typeof value === "object" ? value as Partial<GmailConfig> : {};
  const host = typeof c.host === "string" ? c.host.trim() : "";
  const user = typeof c.user === "string" ? c.user.trim() : "";
  const port = c.port === undefined ? 465 : c.port;
  if (
    host.length < 3 || host.length > 253 || /[\s\r\n]/.test(host)
    || !validMailbox(user)
    || typeof c.pass !== "string" || !c.pass || c.pass.length > 16_000
    || !Number.isInteger(port) || Number(port) < 1 || Number(port) > 65_535
    || (c.secure !== undefined && typeof c.secure !== "boolean")
  ) {
    throw new Error("gmail config is invalid (host, port, secure, user and pass required)");
  }
  return { host, port: Number(port), secure: c.secure !== false, user, pass: c.pass };
}

export function loadConfig(path = configPath()): GmailConfig {
  if (!existsSync(path)) throw new Error("gmail config missing: run gmail_bootstrap to configure SMTP credentials");
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64_000) throw new Error("gmail config must be a bounded regular file");
  if ((stat.mode & 0o077) !== 0) throw new Error("gmail config permissions must be 0600");
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error("gmail config is not valid JSON");
  }
  return normalizeConfig(value);
}

/** Write SMTP credentials to the local 0600 secret config. The caller (a
 * local dialog tool) must never return the values in a tool result. */
export function writeConfig(config: GmailConfig, path = configPath()): void {
  const normalized = normalizeConfig(config);
  if (existsSync(path)) {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64_000) throw new Error("gmail config must be a bounded regular file");
  }
  atomicWriteSecret(path, `${JSON.stringify(normalized, null, 2)}\n`);
}

/** Base64 helpers for SMTP AUTH LOGIN. */
export function b64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

/** RFC 2047 UTF-8 subject encoding. */
export function encodeSubject(subject: string): string {
  return /^[\x20-\x7e]+$/.test(subject) ? subject : `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

/** Build a safe SMTP DATA payload (headers + normalized, dot-stuffed body). */
export function buildMessage(from: string, to: string, subject: string, body: string): string {
  if (!validMailbox(from) || !validMailbox(to)) throw new Error("SMTP mailbox is invalid");
  if (subject.length > 500 || /[\r\n\0]/.test(subject)) throw new Error("SMTP subject is invalid");
  if (body.length > 1_000_000 || Buffer.byteLength(body, "utf8") > 1_000_000 || body.includes("\0")) throw new Error("SMTP body is invalid");
  const normalizedBody = body.replace(/\r\n|\r|\n/g, "\r\n").replace(/(^|\r\n)\./g, "$1..");
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    normalizedBody,
  ];
  return lines.join("\r\n");
}

export type Transport = {
  write(data: string): void;
  once(event: "data" | "end" | "error", cb: (chunk?: unknown) => void): void;
  removeAllListeners(event?: string): void;
  destroy(): void;
  upgrade?(): void; // STARTTLS upgrade hook (test transports no-op)
};

function realTransport(host: string, port: number, secure: boolean): Transport {
  let sock: Socket | TLSSocket = secure
    ? tlsConnect({ host, port })
    : connect({ host, port });
  const transport: Transport = {
    write: (data) => sock.write(data),
    once: (event, cb) => sock.once(event as never, cb as never),
    removeAllListeners: () => sock.removeAllListeners(),
    destroy: () => sock.destroy(),
    upgrade: () => {
      const plain = sock as Socket;
      sock = tlsConnect({ socket: plain, servername: host });
    },
  };
  return transport;
}

type SmtpReply = { code: number; lines: string[] };
type ReplyWaiter = { resolve(reply: SmtpReply): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> };

function replyReader(tr: Transport, signal?: AbortSignal, timeoutMs = 30_000) {
  const MAX_REPLY_BYTES = 64 * 1024;
  const MAX_REPLY_LINES = 100;
  const MAX_PENDING_REPLIES = 20;
  const pending: SmtpReply[] = [];
  const waiters: ReplyWaiter[] = [];
  let terminal: Error | undefined;
  let buffer = "";
  let replyLines: string[] = [];
  let replyCode: number | undefined;
  let replyBytes = 0;
  let generation = 0;

  const settleError = (error: Error) => {
    if (terminal) return;
    terminal = error;
    for (const waiter of waiters.splice(0)) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
  };
  const dispatch = (reply: SmtpReply) => {
    const waiter = waiters.shift();
    if (!waiter) {
      if (pending.length >= MAX_PENDING_REPLIES) return settleError(new Error("SMTP sent too many unsolicited responses"));
      pending.push(reply);
    }
    else {
      clearTimeout(waiter.timer);
      waiter.resolve(reply);
    }
  };
  const consumeLine = (line: string) => {
    const marker = /^(\d{3})([ -])/.exec(line);
    if (replyCode === undefined) {
      if (!marker) return settleError(new Error("SMTP malformed response"));
      replyCode = Number(marker[1]);
    } else if (marker && Number(marker[1]) !== replyCode) {
      return settleError(new Error("SMTP inconsistent multiline response"));
    }
    replyBytes += Buffer.byteLength(line, "utf8") + 2;
    replyLines.push(line);
    if (replyBytes > MAX_REPLY_BYTES || replyLines.length > MAX_REPLY_LINES) return settleError(new Error("SMTP response exceeded the bounded limit"));
    if (marker?.[2] === " ") {
      dispatch({ code: replyCode, lines: replyLines });
      replyCode = undefined;
      replyLines = [];
      replyBytes = 0;
    }
  };
  const listenData = (activeGeneration: number) => {
    tr.once("data", (chunk) => {
      if (activeGeneration !== generation || terminal) return;
      const value = String(chunk ?? "");
      if (replyBytes + Buffer.byteLength(buffer, "utf8") + Buffer.byteLength(value, "utf8") > MAX_REPLY_BYTES) {
        settleError(new Error("SMTP response exceeded the bounded limit"));
        return;
      }
      buffer += value;
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        if (line) consumeLine(line);
      }
      listenData(activeGeneration);
    });
  };
  const listenTerminal = () => {
    tr.once("error", (error) => settleError(new Error(`SMTP transport error: ${String(error).slice(0, 120)}`)));
    tr.once("end", () => settleError(new Error("SMTP transport ended before completion")));
  };
  const attach = () => {
    listenData(generation);
    listenTerminal();
  };
  const abort = () => settleError(new Error("SMTP operation aborted"));
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  attach();

  return {
    next(): Promise<SmtpReply> {
      if (pending.length) return Promise.resolve(pending.shift() as SmtpReply);
      if (terminal) return Promise.reject(terminal);
      return new Promise((resolve, reject) => {
        const waiter = { resolve, reject, timer: undefined as unknown as ReturnType<typeof setTimeout> };
        waiter.timer = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          reject(new Error("SMTP response timeout"));
        }, timeoutMs);
        waiters.push(waiter);
      });
    },
    restartAfterUpgrade(): void {
      generation += 1;
      buffer = "";
      replyLines = [];
      replyCode = undefined;
      replyBytes = 0;
      tr.removeAllListeners();
      tr.upgrade?.();
      attach();
    },
    close(): void {
      generation += 1;
      signal?.removeEventListener("abort", abort);
      tr.removeAllListeners();
      tr.destroy();
    },
  };
}

function expectCode(reply: SmtpReply, accepted: number[]): number {
  if (!accepted.includes(reply.code)) throw new Error(`SMTP unexpected response code ${reply.code}`);
  return reply.code;
}

/** Run one SMTP send. Throws on protocol, timeout, abort or network failure. */
export async function sendEmail(
  config: GmailConfig,
  to: string,
  subject: string,
  body: string,
  transport?: Transport,
  signal?: AbortSignal,
): Promise<{ ok: true; to: string; subject: string }> {
  const normalized = normalizeConfig(config);
  buildMessage(normalized.user, to, subject, body);
  const tr = transport ?? realTransport(normalized.host, normalized.port, normalized.secure);
  const replies = replyReader(tr, signal);

  try {
    expectCode(await replies.next(), [220]);
    tr.write("EHLO holar.local\r\n");
    expectCode(await replies.next(), [250]);
    if (!normalized.secure) {
      tr.write("STARTTLS\r\n");
      expectCode(await replies.next(), [220]);
      replies.restartAfterUpgrade();
      tr.write("EHLO holar.local\r\n");
      expectCode(await replies.next(), [250]);
    }
    tr.write("AUTH LOGIN\r\n");
    expectCode(await replies.next(), [334]);
    tr.write(`${b64(normalized.user)}\r\n`);
    expectCode(await replies.next(), [334]);
    tr.write(`${b64(normalized.pass)}\r\n`);
    expectCode(await replies.next(), [235]);
    tr.write(`MAIL FROM:<${normalized.user}>\r\n`);
    expectCode(await replies.next(), [250]);
    tr.write(`RCPT TO:<${to}>\r\n`);
    expectCode(await replies.next(), [250, 251]);
    tr.write("DATA\r\n");
    expectCode(await replies.next(), [354]);
    tr.write(`${buildMessage(normalized.user, to, subject, body)}\r\n.\r\n`);
    expectCode(await replies.next(), [250]);
    tr.write("QUIT\r\n");
    replies.close();
    return { ok: true, to, subject };
  } catch (error) {
    replies.close();
    throw error;
  }
}
