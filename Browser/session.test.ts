import { afterEach, describe, expect, test } from "bun:test";
import { clearSession, sessionCookieHeader, storeSession } from "./session.mjs";

afterEach(() => {
  clearSession("https://example.com/");
});

describe("local session atom", () => {
  test("keeps Cookie values in native-process memory and returns only a receipt", () => {
    const secret = "session-secret-fixture";
    const receipt = storeSession("https://example.com/account", [{
      name: "sid",
      value: secret,
      domain: "example.com",
      path: "/",
      secure: true,
      httpOnly: true,
      session: true,
    }]);
    expect(receipt).toEqual({
      status: "stored",
      origin: "https://example.com",
      cookie_count: 1,
      storage: "native_process_memory",
      retention_seconds: 900,
      raw_values_returned: false,
    });
    expect(JSON.stringify(receipt)).not.toContain(secret);
    expect(sessionCookieHeader("https://example.com/account")).toBe(`sid=${secret}`);
  });

  test("rejects non-web URLs and oversized Cookie sets", () => {
    expect(() => storeSession("file:///tmp/private", [])).toThrow("session_url_invalid");
    expect(() => storeSession("https://example.com/", Array.from({ length: 501 }, () => ({
      name: "sid",
      value: "x",
      domain: "example.com",
      path: "/",
    })))).toThrow("session_cookie_set_invalid");
  });
});
