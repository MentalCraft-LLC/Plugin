/**
 * iMessage channel of the unified message tool.
 *
 * Extracted verbatim from the retired imessage tool adapter: sends are
 * verified against the local Messages database (chat.db, read-only), values
 * live only in the local 0600 config, and message text is never returned.
 */

/**
 * iMessage reach operation for the primary agent.
 *
 * Capabilities:
 * - Send to the Owner or any named contact (contacts map lives in the local
 *   0600 config; values never enter parameters, chat, results or logs).
 * - Send verification: after osascript reports success, the local Messages
 *   database (chat.db, read-only) is checked for a new outbound record.
 *   A silent no-op (e.g. recipient without iMessage — Mac Messages cannot
 *   fall back to carrier SMS) is reported as a failure instead of "sent".
 * - Status: recent message metadata (direction + time + length only; message
 *   text is never returned) for one recipient.
 *
 * Messages are sent by writing a UTF-8 .applescript source file and running
 * `osascript <file>`; passing text through `-e` + system attributes corrupted
 * non-ASCII (mojibake). Requires macOS automation permission for Messages.
 */

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { atomicWriteSecret } from "../../secret/write.ts";


export const IMESSAGE_PROTOCOL = "holar.imessage.v1";

export interface SocialConfig {
  imessageRecipient: string; // Apple ID or phone of the human Owner
  contacts?: Record<string, string>; // named contacts: name -> Apple ID or phone
}

const EMAIL_RECIPIENT = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/;
const PHONE_RECIPIENT = /^\+?[0-9][0-9 ()-]{5,29}$/;

function validRecipient(value: string): boolean {
  return value.length <= 200 && (EMAIL_RECIPIENT.test(value) || PHONE_RECIPIENT.test(value));
}

export function configPath(cwd: string): string {
  if (process.env.SOCIAL_CONFIG_PATH) return process.env.SOCIAL_CONFIG_PATH;
  const canonical = join(homedir(), ".config", "holar", "imessage.json");
  if (existsSync(canonical)) return canonical;
  const legacy = join(homedir(), ".pi", "agent", "imessage", "config.json");
  if (existsSync(legacy)) return legacy;
  return canonical;
}

function parseConfig(path: string): SocialConfig {
  if (!existsSync(path)) throw new Error("imessage config missing: run imessage_bootstrap to configure the recipient");
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16_000) throw new Error("imessage config must be a bounded regular file");
  if ((stat.mode & 0o077) !== 0) throw new Error("imessage config permissions must be 0600");
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error("imessage config is not valid JSON");
  }
  const record = value as Partial<SocialConfig>;
  const recipient = typeof record.imessageRecipient === "string" ? record.imessageRecipient.trim() : "";
  if (!validRecipient(recipient)) throw new Error("imessage config imessageRecipient is invalid");
  const contacts: Record<string, string> = {};
  if (record.contacts !== undefined) {
    if (typeof record.contacts !== "object" || record.contacts === null || Array.isArray(record.contacts)) {
      throw new Error("imessage config contacts must be an object of name -> recipient");
    }
    for (const [name, value] of Object.entries(record.contacts)) {
      const trimmed = typeof value === "string" ? value.trim() : "";
      if (name.length < 1 || name.length > 40) throw new Error("imessage contact name is invalid");
      if (!validRecipient(trimmed)) throw new Error(`imessage contact ${name} recipient is invalid`);
      contacts[name] = trimmed;
    }
  }
  return { imessageRecipient: recipient, contacts };
}

export function loadConfig(cwd: string): SocialConfig {
  return parseConfig(configPath(cwd));
}

// Local address-book resolution (inlined from the retired contact tool):
// named contacts with per-channel addresses live in one 0600 config shared
// by every channel.

interface ContactChannels {
  imessage?: string;
  email?: string;
}

function contactBookPath(cwd?: string): string {
  if (process.env.CONTACT_CONFIG_PATH) return process.env.CONTACT_CONFIG_PATH;
  const canonical = join(homedir(), ".config", "holar", "contacts.json");
  if (existsSync(canonical)) return canonical;
  const legacy = join(homedir(), ".pi", "agent", "contact", "config.json");
  if (existsSync(legacy)) return legacy;
  return canonical;
}

function resolveContactFromBook(cwd: string | undefined, name: string, channel: keyof ContactChannels): string {
  const path = contactBookPath(cwd);
  if (!existsSync(path)) throw new Error(`contact "${name}" is not configured`);
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16_000) throw new Error("contact config must be a bounded regular file");
  if ((stat.mode & 0o077) !== 0) throw new Error("contact config permissions must be 0600");
  const book = JSON.parse(readFileSync(path, "utf8")) as { contacts?: Record<string, ContactChannels> };
  const entry = book.contacts?.[name];
  const value = entry?.[channel];
  if (!value) throw new Error(`contact "${name}" has no ${channel} channel`);
  return value;
}

export function resolveRecipient(config: SocialConfig, to: string | undefined, cwd?: string): string {
  if (to === undefined || to === "" || to === "owner") return config.imessageRecipient;
  const local = config.contacts?.[to];
  if (local) return local;
  if (cwd) {
    try {
      return resolveContactFromBook(cwd, to, "imessage");
    } catch {
      // fall through to the descriptive error below
    }
  }
  const names = Object.keys(config.contacts ?? {});
  throw new Error(
    `imessage contact "${to}" is not configured` +
      (names.length ? ` (available: ${names.join(", ")})` : " (no contacts configured)"),
  );
}

/**
 * Write the Owner recipient (+ optional named contacts) to the local 0600
 * secret config. The caller (a local dialog tool) must never return the
 * value in a tool result.
 */
export function writeSocialConfig(
  recipient: string,
  contacts: Record<string, string> = {},
  path = configPath(process.cwd()),
): void {
  const value = recipient.trim();
  if (!validRecipient(value)) throw new Error("iMessage recipient is invalid");
  const parsedContacts: Record<string, string> = {};
  for (const [name, raw] of Object.entries(contacts)) {
    const contact = typeof raw === "string" ? raw.trim() : "";
    if (name.length < 1 || name.length > 40 || !validRecipient(contact)) {
      throw new Error(`iMessage contact ${name} is invalid`);
    }
    parsedContacts[name] = contact;
  }
  if (existsSync(path)) {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16_000) throw new Error("imessage config must be a bounded regular file");
  }
  atomicWriteSecret(path, `${JSON.stringify({ imessageRecipient: value, ...(Object.keys(parsedContacts).length ? { contacts: parsedContacts } : {}) }, null, 2)}\n`);
}

export function imessageScript(recipient: string, text: string): string {
	// Script is written as a UTF-8 source file and executed with
	// `osascript <file>`. Passing text through `-e` + system attributes
	// corrupted non-ASCII (UTF-8 bytes re-decoded), producing mojibake.
	const literal = (value: string) =>
		`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
	return [
		`set recipient to ${literal(recipient)}`,
		`set messageBody to ${literal(text)}`,
		'tell application "Messages"',
		"\tsend messageBody to buddy recipient",
		"end tell",
	].join("\n");
}

export function sendImessage(recipient: string, text: string, signal?: AbortSignal): Promise<void> {
	if (!validRecipient(recipient) || text.length < 1 || text.length > 2_000 || text.includes("\0")) {
		return Promise.reject(new Error("imessage send input is invalid"));
	}
	return new Promise((resolve, reject) => {
		const temporary = join(tmpdir(), `imessage-${process.pid}-${randomUUID()}.applescript`);
		try {
			writeFileSync(temporary, imessageScript(recipient, text), { mode: 0o600, flag: "wx" });
		} catch {
			return reject(new Error("imessage script could not be written"));
		}
		execFile(
			"osascript",
			[temporary],
			{
				timeout: 15_000,
				signal,
				maxBuffer: 16_384,
			},
			(error) => {
				try {
					rmSync(temporary, { force: true });
				} catch {}
				error
					? reject(new Error("imessage send failed; verify Messages automation permission"))
					: resolve();
			},
		);
	});
}

export const MESSAGES_DB = join(homedir(), "Library", "Messages", "chat.db");
export const WATCH_STATE = process.env.IMESSAGE_WATCH_STATE
  || (existsSync(join(homedir(), ".pi", "agent", "imessage", "watch-state.json"))
      ? join(homedir(), ".pi", "agent", "imessage", "watch-state.json")
      : join(homedir(), ".config", "holar", "imessage-watch-state.json"));

/** Apple epoch (2001-01-01) offset from Unix epoch, in seconds. */
// Apple epoch (2001-01-01) precedes Unix epoch by this many seconds.
// Database dates are Apple-epoch nanoseconds: Apple seconds = Unix seconds
// MINUS this offset (display adds it back for localtime).
const APPLE_EPOCH_OFFSET = 978_307_200;

/**
 * Read-only query of the local Messages database. Returns recent message
 * metadata for one recipient: direction (out=1/in=0), local time and byte
 * length. Message text is never returned.
 */
export function messageStatus(recipient: string): Promise<Array<{ out: boolean; time: string; bytes: number }>> {
	return new Promise((resolve, reject) => {
		const sql = `SELECT m.is_from_me, datetime(m.date/1000000000 + ${APPLE_EPOCH_OFFSET}, 'unixepoch', 'localtime') AS t, coalesce(length(m.text), 0) AS len
			FROM message m
			JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
			JOIN chat c ON c.ROWID = cmj.chat_id
			JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
			JOIN handle h ON h.ROWID = chj.handle_id
			WHERE h.id = ?
			ORDER BY m.date DESC LIMIT 5;`;
		// sqlite3 CLI does not bind `?` placeholders; the recipient is an
		// already-validated phone/email (alphanumeric + a few symbols), so
		// single-quote escaping is sufficient and safe here.
		const escaped = recipient.replace(/'/g, "''");
		execFile(
			"sqlite3",
			[`file:${MESSAGES_DB}?mode=ro`, sql.replaceAll("?", `'${escaped}'`)],
			{ timeout: 8_000, maxBuffer: 16_384 },
			(error, stdout) => {
				if (error) return reject(new Error("imessage status unavailable; Messages database not readable"));
				const rows = stdout
					.split("\n")
					.filter((line) => line.trim().length > 0)
					.map((line) => {
						const [out, time, bytes] = line.split("|");
						return { out: out === "1", time, bytes: Number(bytes ?? 0) };
					});
				resolve(rows);
			},
		);
	});
}

/**
 * Watch for new replies from a recipient since the last checkpoint.
 * Returns reply metadata (time only) and persists the checkpoint so each
 * recipient is reported at most once per new message.
 */
export function watchReplies(
	recipient: string,
	name: string,
	signal?: AbortSignal,
	includeText = false,
): Promise<Array<{ time: string; out: boolean; bytes: number; text?: string }>> {
	return new Promise((resolve, reject) => {
		const checkpoint = readWatchCheckpoint();
		const since = Math.floor(Date.now() / 1000 - 30 * 24 * 3600 - APPLE_EPOCH_OFFSET);
		// \x1f (unit separator) virtually never appears in message text; the
		// default "|" separator would corrupt any reply containing "|".
		const prefix = includeText ? ".mode list\n.separator '\\x1f'\n" : "";
		const sql = `${prefix}SELECT m.is_from_me, datetime(m.date/1000000000 + ${APPLE_EPOCH_OFFSET}, 'unixepoch', 'localtime') AS t, coalesce(length(m.text), 0) AS len${includeText ? ", coalesce(m.text, '') AS text" : ""}
			FROM message m
			JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
			JOIN chat c ON c.ROWID = cmj.chat_id
			JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
			JOIN handle h ON h.ROWID = chj.handle_id
			WHERE h.id = ? AND m.is_from_me = 0 AND m.date/1000000000 >= ${since}
			ORDER BY m.date DESC LIMIT 20;`;
		const escaped = recipient.replace(/'/g, "''");
		execFile(
			"sqlite3",
			[`file:${MESSAGES_DB}?mode=ro`, sql.replaceAll("?", `'${escaped}'`)],
			{ timeout: 8_000, signal, maxBuffer: 16_384 },
			(error, stdout) => {
				if (error) return reject(new Error("imessage watch unavailable; Messages database not readable"));
				const rows = stdout
					.split("\n")
					.filter((line) => line.trim().length > 0)
					.map((line) => {
						const parts = includeText ? line.split("\x1f") : line.split("|");
						const [out, time, bytes] = parts;
						const text = includeText ? (parts.slice(3).join("\x1f") ?? "") : undefined;
						return {
							out: out === "1",
							time,
							bytes: Number(bytes ?? 0),
							...(text !== undefined ? { text: text.trim().slice(0, 400) } : {}),
						};
					});
				const previous = checkpoint[name] ?? "";
				const fresh = rows.filter((row) => row.time > previous);
				// Persist the newest reply time as the checkpoint.
				if (fresh.length > 0) {
					writeWatchCheckpoint({ ...checkpoint, [name]: fresh[0].time });
				}
				resolve(fresh);
			},
		);
	});
}

function readWatchCheckpoint(): Record<string, string> {
	try {
		const stat = lstatSync(WATCH_STATE);
		if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16_000) return {};
		const value = JSON.parse(readFileSync(WATCH_STATE, "utf8"));
		return typeof value === "object" && value !== null ? (value as Record<string, string>) : {};
	} catch {
		return {};
	}
}

function writeWatchCheckpoint(state: Record<string, string>): void {
	try {
		atomicWriteSecret(WATCH_STATE, JSON.stringify(state));
	} catch {}
}

/**
 * Verify an outbound send by checking the local Messages database for a new
 * outbound record within `withinMs` of now. Returns true only when the
 * message actually entered the conversation.
 */
export function verifyOutbound(recipient: string, withinMs = 90_000): Promise<boolean> {
	const since = Math.floor(Date.now() / 1000 - withinMs / 1000 - APPLE_EPOCH_OFFSET);
	return new Promise((resolve, reject) => {
		const sql = `SELECT COUNT(*) FROM message m
			JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
			JOIN chat c ON c.ROWID = cmj.chat_id
			JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
			JOIN handle h ON h.ROWID = chj.handle_id
			WHERE h.id = ? AND m.is_from_me = 1 AND m.date/1000000000 >= ${since};`;
		const escaped = recipient.replace(/'/g, "''");
		execFile(
			"sqlite3",
			[`file:${MESSAGES_DB}?mode=ro`, sql.replaceAll("?", `'${escaped}'`)],
			{ timeout: 8_000, maxBuffer: 16_384 },
			(error, stdout) => {
				if (error) return reject(new Error("imessage send verification unavailable"));
				resolve(stdout.trim() === "1" || stdout.trim() === "2");
			},
		);
	});
}

