import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readSync, statSync, unwatchFile, watchFile } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

const local = resolve(process.env.HOLAR_BROWSER_LOCAL || resolve(homedir(), ".config/holar/browser"));
const inbox = resolve(local, "annotation-inbox.jsonl");
const socket = resolve(local, "control.sock");
const interval = Math.min(2_000, Math.max(40, Number(process.env.HOLAR_BROWSER_WATCH_INTERVAL) || 250));

mkdirSync(dirname(inbox), { recursive: true, mode: 0o700 });
if (!existsSync(inbox)) {
  const created = openSync(inbox, "a", 0o600);
  closeSync(created);
}

let offset = statSync(inbox).size;
let watching = false;

function nativeHostOpen() {
  try {
    return lstatSync(socket).isSocket();
  } catch {
    return false;
  }
}

function ownerMonitorLine(raw) {
  try {
    const payload = JSON.parse(raw);
    const text = String(payload?.message || "").trim();
    if (payload?.kind !== "annotation" || !text) return "";
    return `${JSON.stringify({
      ownerMessage: true,
      text: text.slice(0, 2000),
      url: String(payload.url || "").slice(0, 300),
    })}\n`;
  } catch {
    return "";
  }
}

function drain() {
  if (!watching) return;
  const size = statSync(inbox).size;
  if (size < offset) offset = 0;
  if (size <= offset) return;
  const length = size - offset;
  const buffer = Buffer.alloc(length);
  const fd = openSync(inbox, "r");
  try {
    readSync(fd, buffer, 0, length, offset);
  } finally {
    closeSync(fd);
  }
  offset = size;
  for (const line of buffer.toString("utf8").split("\n")) {
    if (!line.trim()) continue;
    const event = ownerMonitorLine(line);
    if (event) {
      if (typeof Bun !== "undefined") Bun.write(Bun.stdout, event);
      else process.stdout.write(event);
    }
  }
}

function onInbox() {
  try { drain(); } catch {}
}

function startWatch() {
  if (watching) return;
  offset = statSync(inbox).size;
  watching = true;
  watchFile(inbox, { interval }, onInbox);
}

function stopWatch() {
  if (!watching) return;
  watching = false;
  unwatchFile(inbox);
}

function tick() {
  if (nativeHostOpen()) {
    startWatch();
    try { drain(); } catch {}
  } else {
    stopWatch();
  }
}

tick();
setInterval(tick, interval);
