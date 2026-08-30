import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { clarityLocalTarget, storeClarityProject, storeClarityToken, storeGa4MeasurementId } from "./secret.mjs";

const temporary: string[] = [];
afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

function fixture(tokenFile?: string) {
  const root = mkdtempSync(join(tmpdir(), "spiral-browser-secret-"));
  temporary.push(root);
  const directory = join(root, "analytics");
  const authorityPath = join(root, "authority.json");
  const configPath = join(directory, "config.json");
  const route = "Application/Assessment/Example";
  const resolvedTokenFile = tokenFile ?? join(directory, "example.clarity-token");
  mkdirSync(directory, { recursive: true });
  writeFileSync(authorityPath, JSON.stringify({
    status: "active",
    scope: { clarity_project_bootstrap: true, ga4_property_and_stream_mutation: true },
    targets: [{ route, key: "example" }],
  }));
  writeFileSync(configPath, JSON.stringify({
    schema: "spiral.analytics.local.v1",
    targets: { [route]: { clarity: { projectId: "xvh7gpm90r", tokenFile: resolvedTokenFile } } },
  }), { mode: 0o600 });
  return { root, route, authorityPath, configPath, tokenFile: resolvedTokenFile };
}

describe("one-way GA4 measurement capture", () => {
  test("stores one exact measurement ID privately without returning it", () => {
    const item = fixture();
    const receipt = storeGa4MeasurementId(item.route, "G-ABC1234567", item.authorityPath, item.configPath);
    expect(receipt).toEqual({
      status: "stored",
      route: item.route,
      target: "example",
      measurement_id_present: true,
      measurement_id_returned: false,
      mode: "0600",
    });
    expect(JSON.stringify(receipt)).not.toContain("G-ABC1234567");
    const config = JSON.parse(readFileSync(item.configPath, "utf8"));
    expect(config.targets[item.route].google.measurementId).toBe("G-ABC1234567");
    expect(statSync(item.configPath).mode & 0o077).toBe(0);
  });
});

describe("one-way Clarity project capture", () => {
  test("stores one verified project ID privately without returning it", () => {
    const item = fixture();
    const receipt = storeClarityProject(item.route, "newid123", item.authorityPath, item.configPath);
    expect(receipt).toEqual({
      status: "stored",
      route: item.route,
      project_id_present: true,
      project_id_returned: false,
      token_file: item.tokenFile,
      mode: "0600",
    });
    expect(JSON.stringify(receipt)).not.toContain("newid123");
    const config = JSON.parse(readFileSync(item.configPath, "utf8"));
    expect(config.targets[item.route].clarity.projectId).toBe("newid123");
    expect(statSync(item.configPath).mode & 0o077).toBe(0);
  });
});

describe("one-way Clarity token capture", () => {
  test("writes one exact token privately and returns only a non-secret receipt", () => {
    const item = fixture();
    const token = "abcdefgh.ijklmnop.qrstuvwx";
    const receipt = storeClarityToken(item.route, token, item.authorityPath, item.configPath);
    expect(receipt).toEqual({
      status: "stored",
      route: item.route,
      project_id: "xvh7gpm90r",
      token_file: item.tokenFile,
      token_present: true,
      token_value_returned: false,
      mode: "0600",
    });
    expect(JSON.stringify(receipt)).not.toContain(token);
    expect(readFileSync(item.tokenFile, "utf8")).toBe(`${token}\n`);
    expect(statSync(item.tokenFile).mode & 0o077).toBe(0);
  });

  test("rejects path escape, malformed token and undeclared routes before writing", () => {
    const escapedRoot = mkdtempSync(join(tmpdir(), "spiral-browser-escape-"));
    temporary.push(escapedRoot);
    const escaped = fixture(join(escapedRoot, "outside-token"));
    expect(() => clarityLocalTarget(escaped.route, escaped.authorityPath, escaped.configPath)).toThrow("not_authorized");

    const item = fixture();
    expect(() => storeClarityToken(item.route, "not-a-token", item.authorityPath, item.configPath)).toThrow("invalid");
    expect(() => storeClarityToken("Business/Other/Route", "abcdefgh.ijklmnop.qrstuvwx", item.authorityPath, item.configPath)).toThrow("not_authorized");
  });
});
