import { afterEach, describe, expect, test } from "bun:test";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { appendFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const script = resolve(here, "scripts/watch-annotation-inbox.mjs");

function wait(ms: number) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function listen(path: string): Promise<Server> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(path, () => resolveListen());
  });
  return server;
}

async function closeServer(server: Server) {
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
}

describe("annotation inbox watch follows the native host", () => {
  const roots: string[] = [];
  const procs: ChildProcessWithoutNullStreams[] = [];
  const servers: Server[] = [];

  afterEach(async () => {
    for (const proc of procs) {
      proc.kill("SIGTERM");
    }
    procs.length = 0;
    for (const server of servers) {
      await closeServer(server);
    }
    servers.length = 0;
    for (const root of roots) {
      rmSync(root, { recursive: true, force: true });
    }
    roots.length = 0;
  });

  test("prints the Owner message only while control.sock exists", async () => {
    const root = join(tmpdir(), `holar-annotation-watch-${process.pid}-${Date.now()}`);
    roots.push(root);
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const inbox = join(root, "annotation-inbox.jsonl");
    const sock = join(root, "control.sock");
    writeFileSync(inbox, "", { mode: 0o600 });
    const closed = { kind: "annotation", message: "closed", url: "https://example.com/closed" };
    const opened = { kind: "annotation", message: "open the sider", url: "https://example.com/open" };
    const afterClose = { kind: "annotation", message: "after-close", url: "https://example.com/after" };
    const reopened = { kind: "annotation", message: "reopen preference", url: "https://example.com/reopen" };
    const openedEvent = JSON.stringify({ ownerMessage: true, text: "open the sider", url: "https://example.com/open" });
    const reopenedEvent = JSON.stringify({ ownerMessage: true, text: "reopen preference", url: "https://example.com/reopen" });

    const proc = spawn("bun", [script], {
      env: {
        ...process.env,
        HOLAR_BROWSER_LOCAL: root,
        HOLAR_BROWSER_WATCH_INTERVAL: "40",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    procs.push(proc);

    const lines: string[] = [];
    proc.stdout.setEncoding("utf8");
    proc.stdout.on("data", (chunk: string) => {
      for (const line of chunk.split("\n")) {
        if (line.trim()) lines.push(line.trim());
      }
    });

    appendFileSync(inbox, `${JSON.stringify(closed)}\n`);
    await wait(160);
    expect(lines).toEqual([]);

    const server = await listen(sock);
    servers.push(server);
    await wait(120);
    appendFileSync(inbox, `${JSON.stringify({ id: "noise" })}\n`);
    appendFileSync(inbox, `${JSON.stringify(opened)}\n`);
    await wait(160);
    expect(lines).toEqual([openedEvent]);

    await closeServer(server);
    servers.pop();
    await wait(120);
    appendFileSync(inbox, `${JSON.stringify(afterClose)}\n`);
    await wait(160);
    expect(lines).toEqual([openedEvent]);

    const again = await listen(sock);
    servers.push(again);
    await wait(120);
    appendFileSync(inbox, `${JSON.stringify(reopened)}\n`);
    await wait(160);
    expect(lines).toEqual([openedEvent, reopenedEvent]);
  });
});
