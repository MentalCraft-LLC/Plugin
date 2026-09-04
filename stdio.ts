/**
 * FastMCP Stdio Transport Protection
 *
 * Redirects stdout logging (console.log, console.info, console.warn, console.debug)
 * to process.stderr so that standard output remains 100% reserved for JSON-RPC 2.0 frames.
 */

export function protectStdioTransport(): void {
  const toStderr = (...args: any[]) => {
    process.stderr.write(
      args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n"
    );
  };
  console.log = toStderr;
  console.info = toStderr;
  console.warn = toStderr;
  console.debug = toStderr;
}
