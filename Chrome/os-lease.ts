import { spawnSync } from "node:child_process";

const SCRIPT_TIMEOUT_MS = 30_000;

function automationEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ["HOME", "PATH", "LANG", "LC_ALL", "TMPDIR", "USER"]) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  return env;
}

function runScript(script: string): { status: number; stdout: string; stderr: string } {
  const result = spawnSync("osascript", ["-l", "JavaScript", "-e", script], {
    encoding: "utf8",
    timeout: SCRIPT_TIMEOUT_MS,
    env: automationEnvironment(),
    maxBuffer: 64 * 1024,
  });
  return { status: result.status ?? -1, stdout: String(result.stdout ?? ""), stderr: String(result.stderr ?? "") };
}

function automationError(result: { status: number; stdout: string; stderr: string }): string {
  return String(result.stderr || result.stdout || "osascript failed").trim().slice(0, 120);
}

function cgMouseScript(kind: "click", x: number, y: number): string {
  const px = Math.round(x);
  const py = Math.round(y);
  const move = `const move = $.CGEventCreateMouseEvent($(), $.kCGEventMouseMoved, {x:${px}, y:${py}}, $.kCGMouseButtonLeft);\n$.CGEventPost($.kCGHIDEventTap, move);\n`;
  const down = `const down = $.CGEventCreateMouseEvent($(), $.kCGEventLeftMouseDown, {x:${px}, y:${py}}, $.kCGMouseButtonLeft);\n$.CGEventPost($.kCGHIDEventTap, down);\n`;
  const up = `const up = $.CGEventCreateMouseEvent($(), $.kCGEventLeftMouseUp, {x:${px}, y:${py}}, $.kCGMouseButtonLeft);\n$.CGEventPost($.kCGHIDEventTap, up);\n`;
  const body = kind === "click" ? move + down + up : move;
  return [
    'ObjC.import("CoreGraphics");',
    "function run(argv) {",
    body,
    "return 'ok';",
    "}",
  ].join("\n");
}

export type ChromeOsLease = {
  previousApp: string;
  foreground(appName: string): { ok: boolean; error?: string };
  measureWindow(appName: string): { x: number; y: number; width: number; height: number } | { error: string };
  click(point: { x: number; y: number }): { ok: boolean; error?: string };
  restore(): { ok: boolean; error?: string };
};

export function acquireChromeOsLease(): ChromeOsLease {
  const frontmost = runScript('function run(argv) {\nvar se = Application("System Events");\nvar processes = se.applicationProcesses.whose({ frontmost: true });\nreturn processes.length > 0 ? processes[0].name() : "";\n}');
  const previousApp = frontmost.status === 0 ? frontmost.stdout.trim() : "";
  if (!previousApp) throw new Error(automationError(frontmost));
  return {
    previousApp,
    foreground(appName) {
      const result = runScript(`function run(argv) {\nApplication(${JSON.stringify(appName)}).activate();\nreturn "ok";\n}`);
      return result.status === 0 ? { ok: true } : { ok: false, error: automationError(result) };
    },
    measureWindow(appName) {
      const quoted = JSON.stringify(appName);
      const script = [
        `var appName = ${quoted};`,
        "function run(argv) {",
        'ObjC.import("AppKit");',
        "var ws = $.NSWorkspace.sharedWorkspace;",
        "var frontApp = ws.frontmostApplication;",
        "if (frontApp.localizedName.js !== appName) { return 'not_frontmost'; }",
        "var se = Application(\"System Events\");",
        "var windows = se.processes.byName(appName).windows();",
        "var best = null;",
        "var bestArea = -1;",
        "for (var i = 0; i < windows.length; i++) {",
        "  var w = windows[i];",
        "  var p = w.position();",
        "  var s = w.size();",
        "  var area = s[0] * s[1];",
        "  if (area > bestArea) { bestArea = area; best = p[0] + ',' + p[1] + ',' + s[0] + ',' + s[1]; }",
        "}",
        "return best || 'unreadable';",
        "}",
      ].join("\n");
      const result = runScript(script);
      if (result.status !== 0) return { error: automationError(result) };
      const out = result.stdout.trim();
      if (out === "not_frontmost") return { error: "target app not frontmost" };
      if (out === "unreadable") return { error: "window bounds unreadable" };
      const parts = out.split(",").map(Number);
      if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return { error: "window bounds unreadable" };
      const [x, y, width, height] = parts;
      if (width <= 0 || height <= 0 || width > 10_000 || height > 10_000) return { error: "window bounds invalid" };
      return { x, y, width, height };
    },
    click(point) {
      const result = runScript(cgMouseScript("click", point.x, point.y));
      return result.status === 0 ? { ok: true } : { ok: false, error: automationError(result) };
    },
    restore() {
      const result = runScript(`function run(argv) {\nvar se = Application("System Events");\nse.processes.byName(${JSON.stringify(previousApp)}).frontmost = true;\nreturn "ok";\n}`);
      return result.status === 0 ? { ok: true } : { ok: false, error: automationError(result) };
    },
  };
}
