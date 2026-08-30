#!/usr/bin/env bun
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { HolarStore, defaultHolarStorePath } from "../../.extension/governance/store.ts";
import { resolveWorkspaceRoot } from "../../.extension/governance/runtime.ts";

const MAX_MESSAGE = 2_000;
const CONNECT_TIMEOUT_MS = 8_000;

const payload = JSON.parse((await Bun.stdin.text()) || "{}");
const workspace = resolveWorkspaceRoot(String(payload.workspace || process.env.HOLAR_BROWSER_WORKSPACE || process.cwd()));
const message = String(payload.message || "").trim().slice(0, MAX_MESSAGE);
const target = String(payload.target || "").trim();
if (!message) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: "message_empty" })}\n`);
  process.exit(0);
}

const store = await HolarStore.open({ databasePath: defaultHolarStorePath() });
const now = Date.now();
let lease = target ? store.resolveLiveLease(target, workspace, now) : undefined;
if (!lease) {
  const live = store.listLiveLeases(workspace, now);
  lease = live.slice().sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0];
}
if (!lease?.socketPath || !existsSync(lease.socketPath)) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: "target_offline" })}\n`);
  process.exit(0);
}

const envelope = {
  version: 1,
  messageId: randomUUID(),
  sourceSession: "chrome-annotate",
  targetSession: lease.sessionId,
  message,
  deliverAs: "steer",
  subject: "Chrome design mode",
  date: new Date(now).toISOString(),
};

const result = await new Promise((resolve) => {
  const socket = createConnection(lease.socketPath);
  let settled = false;
  let body = "";
  const finish = (value) => {
    if (settled) return;
    settled = true;
    socket.destroy();
    resolve(value);
  };
  socket.setTimeout(CONNECT_TIMEOUT_MS, () => finish({ ok: false, error: "endpoint_timeout" }));
  socket.once("error", () => finish({ ok: false, error: "endpoint_unavailable" }));
  socket.once("connect", () => socket.write(`${JSON.stringify(envelope)}\n`));
  socket.on("data", (chunk) => {
    body += chunk.toString("utf8");
    const boundary = body.indexOf("\n");
    if (boundary < 0) return;
    try {
      const ack = JSON.parse(body.slice(0, boundary));
      finish(ack.ok === true ? { ok: true, target: lease.sessionId } : { ok: false, error: ack.reason || "delivery_failed" });
    } catch {
      finish({ ok: false, error: "invalid_ack" });
    }
  });
});

process.stdout.write(`${JSON.stringify(result)}\n`);
