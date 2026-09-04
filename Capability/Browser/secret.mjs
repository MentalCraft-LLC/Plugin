import { randomUUID } from "node:crypto";
import { chmodSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const CLARITY_TOKEN = /^[A-Za-z0-9_-]{8,2048}\.[A-Za-z0-9_-]{8,4096}\.[A-Za-z0-9_-]{8,4096}$/;
const ROUTE = /^(?:Application|Business|Service|Design)\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;
const CLARITY_PROJECT = /^[A-Za-z0-9_-]{5,64}$/;
const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{6,20}$/;

function isWithin(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
}

function atomicPrivateWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  try {
    writeFileSync(temporary, content, { mode: 0o600, flag: "wx" });
    chmodSync(temporary, 0o600);
    renameSync(temporary, path);
    chmodSync(path, 0o600);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function checkedJsonFile(path, privateFile = false) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1_000_000 || (privateFile && (stat.mode & 0o077) !== 0)) {
    throw new Error("local_file_invalid");
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function readAnalyticsConfig(configPath) {
  try {
    const value = checkedJsonFile(configPath, true);
    if (value?.schema !== "spiral.analytics.local.v1" || !value.targets || typeof value.targets !== "object") {
      throw new Error("analytics_config_invalid");
    }
    return value;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return { schema: "spiral.analytics.local.v1", targets: {} };
  }
}

function readClarityAuthority(route, authorityPath) {
  if (!ROUTE.test(route)) throw new Error("route_not_authorized");
  const authority = checkedJsonFile(authorityPath);
  const targets = (authority.targets ?? []).filter((item) => item.route === route);
  if (authority.status !== "active" || authority.scope?.clarity_project_bootstrap !== true || targets.length !== 1) {
    throw new Error("clarity_capture_not_authorized");
  }
  return { authority, target: targets[0] };
}

function readGa4Authority(route, authorityPath) {
  if (!ROUTE.test(route)) throw new Error("route_not_authorized");
  const authority = checkedJsonFile(authorityPath);
  const targets = (authority.targets ?? []).filter((item) => item.route === route);
  if (authority.status !== "active" || authority.scope?.ga4_property_and_stream_mutation !== true || targets.length !== 1) {
    throw new Error("ga4_capture_not_authorized");
  }
  return { authority, target: targets[0] };
}

export function storeGa4MeasurementId(route, value, authorityPath, configPath) {
  const { target } = readGa4Authority(route, authorityPath);
  const measurementId = String(value ?? "").trim().toUpperCase();
  if (!GA4_MEASUREMENT_ID.test(measurementId)) throw new Error("ga4_measurement_id_invalid");
  const local = readAnalyticsConfig(configPath);
  local.targets[route] = {
    ...(local.targets[route] ?? {}),
    google: {
      ...(local.targets[route]?.google ?? {}),
      measurementId,
    },
  };
  atomicPrivateWrite(configPath, `${JSON.stringify(local, null, 2)}\n`);
  return {
    status: "stored",
    route,
    target: target.key,
    measurement_id_present: true,
    measurement_id_returned: false,
    mode: "0600",
  };
}

export function clarityLocalTarget(route, authorityPath, configPath) {
  const { authority } = readClarityAuthority(route, authorityPath);
  const local = readAnalyticsConfig(configPath);
  const clarity = local.targets?.[route]?.clarity;
  const tokenFile = resolve(clarity?.tokenFile ?? "");
  if (!CLARITY_PROJECT.test(clarity?.projectId ?? "") || !isWithin(dirname(configPath), tokenFile)) {
    throw new Error("clarity_capture_not_authorized");
  }
  return { projectId: clarity.projectId, tokenFile };
}

export function storeClarityProject(route, value, authorityPath, configPath) {
  const { target } = readClarityAuthority(route, authorityPath);
  const projectId = String(value ?? "").trim();
  if (!CLARITY_PROJECT.test(projectId)) throw new Error("clarity_project_invalid");
  const local = readAnalyticsConfig(configPath);
  const existing = local.targets?.[route]?.clarity ?? {};
  const tokenFile = resolve(existing.tokenFile ?? resolve(dirname(configPath), `${target.key}.clarity-token`));
  if (!isWithin(dirname(configPath), tokenFile)) throw new Error("clarity_token_path_invalid");
  local.targets[route] = {
    ...(local.targets[route] ?? {}),
    clarity: { projectId, tokenFile },
  };
  atomicPrivateWrite(configPath, `${JSON.stringify(local, null, 2)}\n`);
  return {
    status: "stored",
    route,
    project_id_present: true,
    project_id_returned: false,
    token_file: tokenFile,
    mode: "0600",
  };
}

export function storeClarityToken(route, value, authorityPath, configPath) {
  const target = clarityLocalTarget(route, authorityPath, configPath);
  const token = String(value ?? "").trim();
  if (!CLARITY_TOKEN.test(token)) throw new Error("clarity_token_invalid");
  atomicPrivateWrite(target.tokenFile, `${token}\n`);
  return {
    status: "stored",
    route,
    project_id: target.projectId,
    token_file: target.tokenFile,
    token_present: true,
    token_value_returned: false,
    mode: "0600",
  };
}
