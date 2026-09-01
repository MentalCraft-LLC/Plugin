import { BrowserClient, PROTOCOL } from "./core.ts";

export const GA4_PROVISION_URL = "https://analytics.google.com/analytics/web/?#/provision";
export const GA4_ADMIN_URL = "https://analytics.google.com/analytics/web/#/admin";
const GA4_OBJECTIVE = /^(?:发掘潜在客户|推动在线销售|提高品牌知名度|查看用户互动度和留存率|Generate leads|Get more leads|Drive online sales|Raise brand awareness|Examine user behavior)$/i;
export const CLARITY_PROJECTS_URL = "https://clarity.microsoft.com/projects";

export type BrowserTransport = Pick<BrowserClient, "request">;
export type BrowserControl = {
  context?: "dialog" | "form" | "main" | "header" | "navigation" | "page";
  role: string;
  name: string;
  disabled?: boolean;
  checked?: boolean;
};
export type BrowserPage = {
  status?: string;
  origin?: string | null;
  path?: string | null;
  human_boundary?: string | null;
  resumable?: boolean;
  controls: BrowserControl[];
};
export type WorkflowResult = {
  workflow: "ga4-account" | "clarity-project" | "clarity-token";
  status: "advanced" | "ready" | "blocked";
  phase: string;
  reason?: string;
  control_count: number;
};

export type Ga4WorkflowOptions = {
  acceptStandardTerms?: boolean;
  acceptOwnerAuthorizedTerms?: boolean;
  createDistinctAccount?: boolean;
  companySize?: string;
  businessActivity?: string;
  objectiveName?: string;
  navigateToSurface?: boolean;
};

export type ClarityIdentityReadback = {
  project_card_count: number;
  project_name_match: boolean;
  domain_match: boolean;
  project_id_readback: boolean;
  distinct_identity_verified: boolean;
  raw_values_returned: false;
};

const START = /^(?:Start measuring|开始衡量)$/i;
const ADMIN_NAV = /^(?:Admin|管理)$/i;
const GA4_SELECTOR = /(?:selector|account\s+(?:selector|switcher)|账号(?:选择器|选择)|帐户(?:选择器|选择)|账户(?:选择器|选择)|通用选择器)/i;
const CREATE = /^(?:Create|创建)$/i;
const CREATE_ACCOUNT = /^(?:Account|账号)$/i;
const CREATE_ACCOUNT_WITH_PROPERTY = /^(?:Create account with property|创建包含媒体资源的账号)$/i;
const BUSINESS_SELECT = /^(?:Select one|请选择一项)$/i;
const ACCOUNT_FIELD = /(?:account|账号|帐户).*(?:name|名称)|(?:name|名称).*(?:account|账号|帐户)/i;
const NEXT = /^(?:Next|下一步)$/i;
const PROPERTY_FIELD = /(?:property|媒体资源).*(?:name|名称)|(?:name|名称).*(?:property|媒体资源)|^name$/i;
const OPTIONAL_SHARE = /(?:Google products|Google 产品|products-and-services|benchmarking|基准化分析|modeling contributions|business insights|建模贡献|业务洞见|业务洞察|technical support|技术支持|account specialists|account-specialists|账号专家|帐户专家)/i;
const NEW_CLARITY_PROJECT = /^(?:New project|Add new project|新建项目|添加新项目)$/i;
const CLARITY_NAME_FIELD = /^(?:Name|Project name|overviewProjectName|名称|项目名称)$/i;
const CLARITY_SITE_FIELD = /^(?:Website|Website URL|Site URL|overviewProjectWebsite|网站|网站网址|网站 URL)$/i;
const CLARITY_INDUSTRY = /(?:industry|行业)/i;
const CLARITY_OTHER = /^(?:Other|其他)$/i;
const CLARITY_OTHER_SELECTED = /(?:^|\s)(?:Other|其他)$/i;
const CREATE_CLARITY_PROJECT = /^(?:Create project|Add project|Add new project|创建项目|添加项目|添加新项目)$/i;
const CLARITY_SETTINGS = /^settings$/i;
const CLARITY_DATA_EXPORT = /^Data export$/i;
const CLARITY_GENERATE_TOKEN = /Generate new API token/i;
const CLARITY_TOKEN_NAME_FIELD = /friendly name/i;
const CLARITY_TOKEN_ADD = /^Add$/i;

function pause(milliseconds = 750): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function page(value: unknown): BrowserPage {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const controls = Array.isArray(candidate.controls)
    ? candidate.controls.filter((item): item is BrowserControl => Boolean(
      item && typeof item === "object"
      && typeof (item as BrowserControl).role === "string"
      && typeof (item as BrowserControl).name === "string",
    ))
    : [];
  return {
    status: typeof candidate.status === "string" ? candidate.status : undefined,
    origin: typeof candidate.origin === "string" || candidate.origin === null ? candidate.origin as string | null : undefined,
    path: typeof candidate.path === "string" || candidate.path === null ? candidate.path as string | null : undefined,
    human_boundary: typeof candidate.human_boundary === "string" || candidate.human_boundary === null ? candidate.human_boundary as string | null : undefined,
    resumable: candidate.resumable === true,
    controls,
  };
}

function uniqueControl(current: BrowserPage, role: string, pattern: RegExp): BrowserControl | null {
  const rows = current.controls.filter((control) => control.role === role && pattern.test(control.name));
  if (rows.length <= 1) return rows[0] ?? null;
  for (const context of ["dialog", "form", "main", "header", "navigation", "page"] as const) {
    const contextual = rows.filter((control) => control.context === context);
    if (contextual.length === 1) return contextual[0];
  }
  throw new Error(`workflow_control_ambiguous:${role}`);
}

async function read(transport: BrowserTransport, url: string, navigate = false): Promise<BrowserPage> {
  return page(await transport.request({
    protocol: PROTOCOL,
    action: "controls",
    url,
    ...(navigate ? { navigate: true } : {}),
  }));
}

async function click(transport: BrowserTransport, url: string, control: BrowserControl): Promise<void> {
  await transport.request({
    protocol: PROTOCOL,
    action: "click",
    url,
    role: control.role,
    name: control.name,
    ...(control.context ? { context: control.context } : {}),
  });
}

async function fill(transport: BrowserTransport, url: string, control: BrowserControl, value: string): Promise<void> {
  await transport.request({
    protocol: PROTOCOL,
    action: "fill",
    url,
    field: control.name,
    value,
    ...(control.context ? { context: control.context } : {}),
  });
}

function humanBoundaryResult(workflow: WorkflowResult["workflow"], current: BrowserPage): WorkflowResult | null {
  if (!current.human_boundary && current.status !== "human_boundary" && current.status !== "foreground_human_required") return null;
  return result(workflow, "blocked", "human-boundary", current, `human_boundary:${current.human_boundary ?? "required"}`);
}

function result(
  workflow: WorkflowResult["workflow"],
  status: WorkflowResult["status"],
  phase: string,
  current: BrowserPage,
  reason?: string,
): WorkflowResult {
  return {
    workflow,
    status,
    phase,
    ...(reason ? { reason } : {}),
    control_count: current.controls.length,
  };
}

type Ga4Read = { current: BrowserPage; blocked?: undefined } | { current?: undefined; blocked: WorkflowResult };

async function acceptTerms(
  transport: BrowserTransport,
  url: string,
  provider: "ga4" | "clarity",
  options: Ga4WorkflowOptions,
): Promise<boolean> {
  if (options.acceptStandardTerms === true) {
    try {
      const response = await transport.request({
        protocol: PROTOCOL,
        action: "accept_standard_terms",
        url,
        provider,
        owner_terms_delegated: true,
      });
      const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
      if (candidate.action === "accept_standard_terms" && candidate.value_returned === false) return true;
    } catch { /* try the separately explicit combined-terms authority below */ }
  }
  if (options.acceptOwnerAuthorizedTerms !== true) return false;
  try {
    const response = await transport.request({
      protocol: PROTOCOL,
      action: "accept_owner_authorized_terms",
      url,
      provider,
      owner_confirmed: true,
      owner_terms_delegated: true,
    });
    const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
    return candidate.action === "accept_owner_authorized_terms" && candidate.value_returned === false;
  } catch {
    return false;
  }
}

async function openClarityProjectByName(transport: BrowserTransport, projectName: string): Promise<boolean> {
  try {
    const response = await transport.request({
      protocol: PROTOCOL,
      action: "open_clarity_project",
      url: CLARITY_PROJECTS_URL,
      project_name: projectName,
    });
    const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
    return candidate.action === "open_clarity_project" && candidate.value_returned === false;
  } catch {
    return false;
  }
}

export async function captureGa4MeasurementId(
  transport: BrowserTransport,
  route: string,
  streamName: string,
  domain: string,
): Promise<{ status: string; route: string; measurement_id_present: boolean; measurement_id_returned: false; mode: "0600" }> {
  const response = await transport.request({
    protocol: PROTOCOL,
    action: "capture_ga4_measurement_id",
    url: GA4_ADMIN_URL,
    route,
    stream_name: streamName,
    domain,
    identity_verified: false,
  });
  const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
  return {
    status: typeof candidate.status === "string" ? candidate.status : "blocked",
    route: typeof candidate.route === "string" ? candidate.route : route,
    measurement_id_present: candidate.measurement_id_present === true,
    measurement_id_returned: false,
    mode: "0600",
  };
}

export async function captureClarityProjectId(
  transport: BrowserTransport,
  route: string,
  projectName: string,
  domain: string,
): Promise<{ status: string; route: string; project_id_present: boolean; project_id_returned: false; token_file: string; mode: "0600" }> {
  const response = await transport.request({
    protocol: PROTOCOL,
    action: "capture_clarity_project_id",
    url: CLARITY_PROJECTS_URL,
    route,
    project_name: projectName,
    domain,
    identity_verified: true,
  });
  const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
  return {
    status: typeof candidate.status === "string" ? candidate.status : "blocked",
    route: typeof candidate.route === "string" ? candidate.route : route,
    project_id_present: candidate.project_id_present === true,
    project_id_returned: false,
    token_file: typeof candidate.token_file === "string" ? candidate.token_file : "",
    mode: "0600",
  };
}

export async function readClarityProjectIdentity(
  transport: BrowserTransport,
  projectName: string,
  domain: string,
): Promise<ClarityIdentityReadback> {
  const response = await transport.request({
    protocol: PROTOCOL,
    action: "clarity_project_identity",
    url: CLARITY_PROJECTS_URL,
    project_name: projectName,
    domain,
  });
  const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
  return {
    project_card_count: typeof candidate.project_card_count === "number" ? candidate.project_card_count : 0,
    project_name_match: candidate.project_name_match === true,
    domain_match: candidate.domain_match === true,
    project_id_readback: candidate.project_id_readback === true,
    distinct_identity_verified: candidate.distinct_identity_verified === true,
    raw_values_returned: false,
  };
}

async function verifyClarityIdentity(
  transport: BrowserTransport,
  current: BrowserPage,
  projectName: string,
  domain: string,
  options: Ga4WorkflowOptions,
): Promise<{ current: BrowserPage; identity: ClarityIdentityReadback }> {
  let identity = await readClarityProjectIdentity(transport, projectName, domain);
  if (identity.distinct_identity_verified) return { current, identity };
  const declaredDomainVerified = identity.domain_match;
  const escapedProjectName = projectName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const projectLink = uniqueControl(current, "link", new RegExp(`^${escapedProjectName}(?:\\s|$)`, "i"));
  if (projectLink) {
    await click(transport, CLARITY_PROJECTS_URL, projectLink);
    await pause();
    const opened = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
    if (!opened.blocked) {
      current = opened.current;
      identity = await readClarityProjectIdentity(transport, projectName, domain);
      if (declaredDomainVerified && identity.project_name_match && identity.project_id_readback) {
        identity = { ...identity, domain_match: true, distinct_identity_verified: true };
      }
      if (identity.distinct_identity_verified) return { current, identity };
    }
  }
  if (identity.project_name_match && await openClarityProjectByName(transport, projectName)) {
    await pause();
    const opened = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
    if (!opened.blocked) {
      current = opened.current;
      identity = await readClarityProjectIdentity(transport, projectName, domain);
      if (declaredDomainVerified && identity.project_name_match && identity.project_id_readback) {
        identity = { ...identity, domain_match: true, distinct_identity_verified: true };
      }
      if (identity.distinct_identity_verified) return { current, identity };
    }
  }
  if (!identity.project_id_readback || !identity.project_name_match) return { current, identity };
  const settings = uniqueControl(current, "tab", CLARITY_SETTINGS);
  if (!settings) return { current, identity };
  await click(transport, CLARITY_PROJECTS_URL, settings);
  await pause();
  const next = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
  if (next.blocked) return { current, identity };
  current = next.current;
  identity = await readClarityProjectIdentity(transport, projectName, domain);
  return { current, identity };
}

async function readProvider(
  transport: BrowserTransport,
  url: string,
  workflow: WorkflowResult["workflow"],
  provider: "ga4" | "clarity",
  options: Ga4WorkflowOptions,
  navigate = false,
): Promise<Ga4Read> {
  let current = await read(transport, url, navigate);
  for (let attempt = 0; attempt < 8 && current.controls.length === 0 && !current.human_boundary && current.status !== "human_boundary"; attempt += 1) {
    await pause(500);
    current = await read(transport, url);
  }
  const boundary = humanBoundaryResult(workflow, current);
  if (!boundary) return { current };
  if (current.human_boundary !== "terms" || !(await acceptTerms(transport, url, provider, options))) return { blocked: boundary };
  await pause();
  current = await read(transport, url);
  let remaining = humanBoundaryResult(workflow, current);
  if (remaining && current.human_boundary === "terms" && options.acceptOwnerAuthorizedTerms === true) {
    if (await acceptTerms(transport, url, provider, options)) {
      await pause();
      current = await read(transport, url);
      remaining = humanBoundaryResult(workflow, current);
    }
  }
  return remaining ? { blocked: remaining } : { current };
}

function ga4SurfaceUrl(options: Ga4WorkflowOptions = {}): string {
  return options.createDistinctAccount === true ? GA4_PROVISION_URL : GA4_ADMIN_URL;
}

async function readGa4(transport: BrowserTransport, options: Ga4WorkflowOptions, navigate = false): Promise<Ga4Read> {
  return readProvider(transport, ga4SurfaceUrl(options), "ga4-account", "ga4", options, navigate);
}

async function selectGa4Target(transport: BrowserTransport, targetName: string): Promise<boolean> {
  try {
    const response = await transport.request({
      protocol: PROTOCOL,
      action: "select_ga4_target",
      url: GA4_ADMIN_URL,
      provider: "ga4",
      target_name: targetName,
    });
    const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
    return candidate.action === "select_ga4_target" && candidate.value_returned === false;
  } catch {
    return false;
  }
}

async function selectGa4Objective(
  transport: BrowserTransport,
  objectiveName: string,
  options: Ga4WorkflowOptions = {},
): Promise<boolean> {
  try {
    const response = await transport.request({
      protocol: PROTOCOL,
      action: "select_ga4_objective",
      url: ga4SurfaceUrl(options),
      provider: "ga4",
      objective_name: objectiveName,
    });
    const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
    return candidate.action === "select_ga4_objective" && candidate.value_returned === false;
  } catch {
    return false;
  }
}

function targetVisible(current: BrowserPage, targetName: string): boolean {
  const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}(?:\\s|$)`, "i");
  return current.controls.some((control) => ["option", "link", "button"].includes(control.role) && pattern.test(control.name));
}

function ga4SurfaceReady(current: BrowserPage, targetName: string): boolean {
  return targetVisible(current, targetName)
    || current.controls.some((control) => (
      (control.role === "button" && GA4_SELECTOR.test(control.name))
      || (control.role === "link" && ADMIN_NAV.test(control.name))
      || (control.role === "button" && START.test(control.name))
      || (control.role === "textbox" && (ACCOUNT_FIELD.test(control.name) || PROPERTY_FIELD.test(control.name)))
    ));
}

export async function runGa4Account(
  transport: BrowserTransport,
  accountName: string,
  options: Ga4WorkflowOptions = {},
): Promise<WorkflowResult> {
  const initial = await readGa4(transport, options, true);
  if (initial.blocked) return initial.blocked;
  let current = initial.current;
  if (current.status === "interactive_login_required") {
    return result("ga4-account", "blocked", "login", current, "interactive_login_required");
  }
  for (let attempt = 0; attempt < 8 && !ga4SurfaceReady(current, accountName); attempt += 1) {
    await pause(500);
    const refreshed = await readGa4(transport, options);
    if (refreshed.blocked) return refreshed.blocked;
    current = refreshed.current;
  }

  const selector = uniqueControl(current, "button", GA4_SELECTOR);
  if (targetVisible(current, accountName) || selector) {
    if (selector) {
      await click(transport, GA4_ADMIN_URL, selector);
      await pause();
      let afterSelector = await readGa4(transport, options);
      if (afterSelector.blocked) return afterSelector.blocked;
      for (let attempt = 0; attempt < 6 && !targetVisible(afterSelector.current, accountName); attempt += 1) {
        await pause(500);
        afterSelector = await readGa4(transport, options);
        if (afterSelector.blocked) return afterSelector.blocked;
      }
      current = afterSelector.current;
    }
    if (targetVisible(current, accountName) && await selectGa4Target(transport, accountName)) {
      await pause();
      const afterTarget = await readGa4(transport, options);
      if (afterTarget.blocked) return afterTarget.blocked;
      current = afterTarget.current;
      const adminAfterTarget = uniqueControl(current, "link", ADMIN_NAV);
      if (adminAfterTarget) {
        await click(transport, GA4_ADMIN_URL, adminAfterTarget);
        await pause();
        const afterPropertyAdmin = await readGa4(transport, options);
        if (afterPropertyAdmin.blocked) return afterPropertyAdmin.blocked;
        current = afterPropertyAdmin.current;
      }
      return result("ga4-account", "ready", "property", current);
    }
  }

  const adminNav = uniqueControl(current, "link", ADMIN_NAV);
  const hasSetupSurface = current.controls.some((control) => (
    control.role === "textbox" && (ACCOUNT_FIELD.test(control.name) || PROPERTY_FIELD.test(control.name))
  )) || current.controls.some((control) => control.role === "button" && START.test(control.name));
  if (adminNav && !hasSetupSurface) {
    await click(transport, GA4_ADMIN_URL, adminNav);
    await pause();
    const afterAdmin = await readGa4(transport, options);
    if (afterAdmin.blocked) return afterAdmin.blocked;
    current = afterAdmin.current;
  }

  const start = uniqueControl(current, "button", START);
  if (start) {
    await click(transport, GA4_ADMIN_URL, start);
    await pause();
    const refreshed = await readGa4(transport, options);
    if (refreshed.blocked) return refreshed.blocked;
    current = refreshed.current;
  }

  if (uniqueControl(current, "textbox", PROPERTY_FIELD)) {
    return result("ga4-account", "ready", "property", current);
  }

  const accountField = uniqueControl(current, "textbox", ACCOUNT_FIELD);
  if (!accountField) return result("ga4-account", "blocked", "account", current, "account_field_missing");
  await fill(transport, GA4_ADMIN_URL, accountField, accountName);

  const checkboxes = current.controls.filter((control) => ["checkbox", "switch"].includes(control.role));
  if (checkboxes.length === 0) {
    return result("ga4-account", "blocked", "data-sharing", current, "data_sharing_controls_missing");
  }
  if (checkboxes.some((control) => !OPTIONAL_SHARE.test(control.name))) {
    return result("ga4-account", "blocked", "data-sharing", current, "unknown_data_sharing_control");
  }
  for (const checkbox of checkboxes) {
    if (checkbox.checked) await click(transport, GA4_ADMIN_URL, checkbox);
  }

  await pause();
  const refreshed = await readGa4(transport, options);
  if (refreshed.blocked) return refreshed.blocked;
  current = refreshed.current;
  const remaining = current.controls.filter((control) => ["checkbox", "switch"].includes(control.role) && control.checked);
  if (remaining.length > 0) {
    return result("ga4-account", "blocked", "data-sharing", current, "optional_data_sharing_still_enabled");
  }
  const next = uniqueControl(current, "button", NEXT);
  if (!next || next.disabled) return result("ga4-account", "blocked", "account", current, "next_unavailable");
  await click(transport, GA4_ADMIN_URL, next);
  await pause();
  const afterNext = await readGa4(transport, options);
  if (afterNext.blocked) return afterNext.blocked;
  current = afterNext.current;
  return result("ga4-account", "advanced", uniqueControl(current, "textbox", PROPERTY_FIELD) ? "property" : "account-next", current);
}

export async function runGa4DistinctAccount(
  transport: BrowserTransport,
  accountName: string,
  options: Ga4WorkflowOptions = {},
): Promise<WorkflowResult> {
  const workflowOptions = { ...options, createDistinctAccount: true };
  const surfaceUrl = GA4_PROVISION_URL;
  let initial = await readGa4(transport, workflowOptions, true);
  if (initial.blocked) return initial.blocked;
  let current = initial.current;

  const create = uniqueControl(current, "button", CREATE);
  const start = uniqueControl(current, "button", START);
  if (!create && !start) return result("ga4-account", "blocked", "account", current, "create_account_control_missing");
  let next: Ga4Read;
  if (start) {
    await click(transport, surfaceUrl, start);
    await pause();
    next = await readGa4(transport, workflowOptions);
    if (next.blocked) return next.blocked;
    current = next.current;
  } else {
    await click(transport, surfaceUrl, create!);
    await pause();
    next = await readGa4(transport, workflowOptions);
    if (next.blocked) return next.blocked;
    current = next.current;
    const accountMenu = uniqueControl(current, "menuitem", CREATE_ACCOUNT);
    if (!accountMenu) return result("ga4-account", "blocked", "account", current, "create_account_menu_missing");
    await click(transport, surfaceUrl, accountMenu);
    await pause();
    next = await readGa4(transport, workflowOptions);
    if (next.blocked) return next.blocked;
    current = next.current;
  }

  const accountField = uniqueControl(current, "textbox", ACCOUNT_FIELD);
  if (!accountField) return result("ga4-account", "blocked", "account", current, "account_field_missing");
  await fill(transport, surfaceUrl, accountField, accountName);
  await pause();
  next = await readGa4(transport, workflowOptions);
  if (next.blocked) return next.blocked;
  current = next.current;

  const checkboxes = current.controls.filter((control) => ["checkbox", "switch"].includes(control.role));
  if (checkboxes.some((control) => !OPTIONAL_SHARE.test(control.name))) {
    return result("ga4-account", "blocked", "data-sharing", current, "unknown_data_sharing_control");
  }
  for (const checkbox of checkboxes) {
    if (checkbox.checked) await click(transport, surfaceUrl, checkbox);
  }
  if (checkboxes.length > 0) {
    await pause();
    next = await readGa4(transport, workflowOptions);
    if (next.blocked) return next.blocked;
    current = next.current;
    if (current.controls.some((control) => ["checkbox", "switch"].includes(control.role) && control.checked)) {
      return result("ga4-account", "blocked", "data-sharing", current, "optional_data_sharing_still_enabled");
    }
  }

  const accountNext = uniqueControl(current, "button", NEXT);
  if (!accountNext || accountNext.disabled) return result("ga4-account", "blocked", "account", current, "next_unavailable");
  await click(transport, surfaceUrl, accountNext);
  await pause();
  next = await readGa4(transport, workflowOptions);
  if (next.blocked) return next.blocked;
  current = next.current;

  const propertyField = uniqueControl(current, "textbox", PROPERTY_FIELD);
  if (!propertyField) return result("ga4-account", "blocked", "property", current, "property_field_missing");
  await fill(transport, surfaceUrl, propertyField, accountName);
  await pause();
  next = await readGa4(transport, workflowOptions);
  if (next.blocked) return next.blocked;
  current = next.current;
  const propertyNext = uniqueControl(current, "button", NEXT);
  if (!propertyNext || propertyNext.disabled) return result("ga4-account", "blocked", "property", current, "next_unavailable");
  await click(transport, surfaceUrl, propertyNext);
  await pause();
  next = await readGa4(transport, workflowOptions);
  if (next.blocked) return next.blocked;
  current = next.current;

  const companySize = String(workflowOptions.companySize ?? "").trim();
  if (!/^(?:小型 - 1 至 10 名员工|Small - 1 to 10 employees)$/i.test(companySize)) {
    return result("ga4-account", "blocked", "business", current, "company_size_required");
  }
  const size = uniqueControl(current, "radio", new RegExp(`^${companySize.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i"));
  if (!size) return result("ga4-account", "blocked", "business", current, "company_size_control_missing");
  if (!size.checked) await click(transport, surfaceUrl, size);

  const activity = String(workflowOptions.businessActivity ?? "").trim();
  if (!/^(?:其他业务活动|Other business activities)$/i.test(activity)) {
    return result("ga4-account", "blocked", "business", current, "business_activity_required");
  }
  const activityButton = uniqueControl(current, "button", BUSINESS_SELECT);
  if (activityButton) {
    await click(transport, surfaceUrl, activityButton);
    await pause();
    next = await readGa4(transport, workflowOptions);
    if (next.blocked) return next.blocked;
    current = next.current;
    const activityPattern = new RegExp(`^${activity.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i");
    const choice = uniqueControl(current, "radio", activityPattern) ?? uniqueControl(current, "option", activityPattern);
    if (!choice) return result("ga4-account", "blocked", "business", current, "business_activity_control_missing");
    await click(transport, surfaceUrl, choice);
    await pause();
    next = await readGa4(transport, workflowOptions);
    if (next.blocked) return next.blocked;
    current = next.current;
  } else if (!uniqueControl(current, "button", new RegExp(`^${activity.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i"))) {
    return result("ga4-account", "blocked", "business", current, "business_activity_control_missing");
  }

  const businessNext = uniqueControl(current, "button", NEXT);
  if (!businessNext || businessNext.disabled) return result("ga4-account", "blocked", "business", current, "next_unavailable");
  await click(transport, surfaceUrl, businessNext);
  await pause();
  next = await readGa4(transport, workflowOptions);
  if (next.blocked) return next.blocked;
  current = next.current;

  const objectiveName = String(workflowOptions.objectiveName ?? "").trim();
  if (!objectiveName) return result("ga4-account", "blocked", "objective", current, "objective_required");
  const objective = await chooseGa4Objective(transport, objectiveName, { ...workflowOptions, navigateToSurface: false });
  if (objective.status === "blocked") return objective;
  next = await readGa4(transport, workflowOptions);
  if (next.blocked) return next.blocked;
  current = next.current;
  const createWithProperty = uniqueControl(current, "button", CREATE_ACCOUNT_WITH_PROPERTY);
  if (!createWithProperty || createWithProperty.disabled) {
    return result("ga4-account", "blocked", "objective", current, "create_with_property_unavailable");
  }
  await click(transport, surfaceUrl, createWithProperty);
  await pause();
  next = await readGa4(transport, workflowOptions);
  if (next.blocked) return next.blocked;
  return result("ga4-account", "advanced", "created", next.current);
}

export async function chooseGa4Objective(
  transport: BrowserTransport,
  objectiveName: string,
  options: Ga4WorkflowOptions = {},
): Promise<WorkflowResult> {
  const initial = await readGa4(transport, options, options.navigateToSurface !== false);
  if (initial.blocked) return initial.blocked;
  let current = initial.current;
  if (current.status === "interactive_login_required") {
    return result("ga4-account", "blocked", "login", current, "interactive_login_required");
  }
  const requested = String(objectiveName ?? "").trim();
  if (!GA4_OBJECTIVE.test(requested)) return result("ga4-account", "blocked", "objective", current, "objective_not_allowlisted");
  const escaped = requested.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
  const objectivePattern = new RegExp(`^${escaped}$`, "i");
  const objective = uniqueControl(current, "checkbox", objectivePattern) ?? uniqueControl(current, "radio", objectivePattern);
  if (!objective) {
    if (!(await selectGa4Objective(transport, requested, options))) {
      return result("ga4-account", "blocked", "objective", current, "objective_control_missing");
    }
  } else {
    if (objective.disabled) return result("ga4-account", "blocked", "objective", current, "objective_control_disabled");
    await click(transport, ga4SurfaceUrl(options), objective);
  }
  await pause();
  const refreshed = await readGa4(transport, options);
  if (refreshed.blocked) return refreshed.blocked;
  current = refreshed.current;
  return result("ga4-account", "advanced", "objective", current);
}

export async function runClarityProject(
  transport: BrowserTransport,
  projectName: string,
  domain: string,
  options: Ga4WorkflowOptions = {},
): Promise<WorkflowResult> {
  const initial = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options, true);
  if (initial.blocked) return initial.blocked;
  let current = initial.current;
  for (let attempt = 0; attempt < 8 && !current.controls.some((control) => control.name.includes(projectName) || control.name.includes(domain)) && !uniqueControl(current, "button", NEW_CLARITY_PROJECT); attempt += 1) {
    await pause(500);
    const refreshed = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
    if (refreshed.blocked) return refreshed.blocked;
    current = refreshed.current;
  }
  if (current.status === "interactive_login_required") {
    return result("clarity-project", "blocked", "login", current, "interactive_login_required");
  }
  if (current.controls.some((control) => control.name.includes(projectName) || control.name.includes(domain))) {
    const verified = await verifyClarityIdentity(transport, current, projectName, domain, options);
    if (verified.identity.distinct_identity_verified) return result("clarity-project", "ready", "project", verified.current);
    return result("clarity-project", "blocked", "project", verified.current, "project_identity_unverified");
  }

  const start = uniqueControl(current, "button", NEW_CLARITY_PROJECT);
  if (!start) return result("clarity-project", "blocked", "projects", current, "new_project_control_missing");
  await click(transport, CLARITY_PROJECTS_URL, start);
  await pause();
  const afterStart = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
  if (afterStart.blocked) return afterStart.blocked;
  current = afterStart.current;

  const name = uniqueControl(current, "textbox", CLARITY_NAME_FIELD);
  const site = uniqueControl(current, "textbox", CLARITY_SITE_FIELD);
  if (!name || !site) return result("clarity-project", "blocked", "project-form", current, "project_fields_missing");
  await fill(transport, CLARITY_PROJECTS_URL, name, projectName);
  await fill(transport, CLARITY_PROJECTS_URL, site, domain);
  await pause();
  const afterForm = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
  if (afterForm.blocked) return afterForm.blocked;
  current = afterForm.current;

  const industry = uniqueControl(current, "combobox", CLARITY_INDUSTRY);
  if (!industry) return result("clarity-project", "blocked", "project-form", current, "industry_control_missing");
  if (!CLARITY_OTHER_SELECTED.test(industry.name)) {
    await click(transport, CLARITY_PROJECTS_URL, industry);
    await pause(300);
    const afterIndustry = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
    if (afterIndustry.blocked) return afterIndustry.blocked;
    current = afterIndustry.current;
    const other = uniqueControl(current, "option", CLARITY_OTHER);
    if (!other) return result("clarity-project", "blocked", "project-form", current, "other_industry_missing");
    await click(transport, CLARITY_PROJECTS_URL, other);
    await pause(300);
    const afterOther = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
    if (afterOther.blocked) return afterOther.blocked;
    current = afterOther.current;
  }
  if (current.controls.some((control) => control.context === "dialog" && ["checkbox", "switch"].includes(control.role))) {
    if (options.acceptStandardTerms !== true) {
      return result("clarity-project", "blocked", "project-form", current, "additional_terms_required");
    }
    if (!(await acceptTerms(transport, CLARITY_PROJECTS_URL, "clarity", options))) {
      return result("clarity-project", "blocked", "project-form", current, "terms_acceptance_failed");
    }
    await pause();
    const afterTerms = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
    if (afterTerms.blocked) return afterTerms.blocked;
    current = afterTerms.current;
  }

  const create = uniqueControl(current, "button", CREATE_CLARITY_PROJECT);
  if (!create || create.disabled) return result("clarity-project", "blocked", "project-form", current, "create_unavailable");
  await click(transport, CLARITY_PROJECTS_URL, create);
  await pause();
  const afterCreate = await readProvider(transport, CLARITY_PROJECTS_URL, "clarity-project", "clarity", options);
  if (afterCreate.blocked) return afterCreate.blocked;
  const verified = await verifyClarityIdentity(transport, afterCreate.current, projectName, domain, options);
  if (!verified.identity.distinct_identity_verified) return result("clarity-project", "blocked", "project", verified.current, "project_identity_unverified");
  return result("clarity-project", "advanced", "project", verified.current);
}

async function openClaritySettingsByAdapter(transport: BrowserTransport): Promise<boolean> {
  try {
    const response = await transport.request({
      protocol: PROTOCOL,
      action: "open_clarity_settings",
      url: CLARITY_PROJECTS_URL,
    });
    const candidate = response && typeof response === "object" ? response as Record<string, unknown> : {};
    return candidate.action === "open_clarity_settings" && candidate.value_returned === false;
  } catch {
    return false;
  }
}

export async function runClarityToken(
  transport: BrowserTransport,
  route: string,
  projectId: string,
  tokenName = "spiral-analytics-export",
  useCurrentProjectSurface = false,
): Promise<WorkflowResult> {
  try {
    const receipt = await transport.request({
      protocol: PROTOCOL,
      action: "capture_clarity_token",
      url: CLARITY_PROJECTS_URL,
      route,
    }) as Record<string, unknown>;
    if (receipt?.status === "stored" && receipt?.token_value_returned === false) {
      return { workflow: "clarity-token", status: "ready", phase: "stored", control_count: 0 };
    }
  } catch { /* no currently visible one-time token */ }

  let current: BrowserPage;
  if (useCurrentProjectSurface) {
    current = await read(transport, CLARITY_PROJECTS_URL);
  } else {
    const targetUrl = `https://clarity.microsoft.com/projects/view/${projectId}/settings`;
    await transport.request({ protocol: PROTOCOL, action: "open", url: targetUrl });
    current = await read(transport, CLARITY_PROJECTS_URL);
    const settings = uniqueControl(current, "tab", CLARITY_SETTINGS);
    if (settings) {
      await click(transport, CLARITY_PROJECTS_URL, settings);
      await pause();
      current = await read(transport, CLARITY_PROJECTS_URL);
    }
  }
  let dataExport = uniqueControl(current, "link", CLARITY_DATA_EXPORT);
  if (!dataExport && await openClaritySettingsByAdapter(transport)) {
    await pause();
    current = await read(transport, CLARITY_PROJECTS_URL);
    dataExport = uniqueControl(current, "link", CLARITY_DATA_EXPORT);
  }
  if (!dataExport) return result("clarity-token", "blocked", "settings", current, "data_export_control_missing");
  await click(transport, CLARITY_PROJECTS_URL, dataExport);
  await pause();
  current = await read(transport, CLARITY_PROJECTS_URL);

  const generate = uniqueControl(current, "button", CLARITY_GENERATE_TOKEN);
  if (!generate) return result("clarity-token", "blocked", "data-export", current, "generate_token_control_missing");
  await click(transport, CLARITY_PROJECTS_URL, generate);
  await pause();
  current = await read(transport, CLARITY_PROJECTS_URL);

  const name = uniqueControl(current, "textbox", CLARITY_TOKEN_NAME_FIELD);
  if (!name) return result("clarity-token", "blocked", "token-form", current, "token_name_field_missing");
  if (!/^[A-Za-z0-9._-]{4,32}$/.test(tokenName)) {
    return result("clarity-token", "blocked", "token-form", current, "token_name_invalid");
  }
  await fill(transport, CLARITY_PROJECTS_URL, name, tokenName);
  await pause(300);
  current = await read(transport, CLARITY_PROJECTS_URL);
  const add = uniqueControl(current, "button", CLARITY_TOKEN_ADD);
  if (!add || add.disabled) return result("clarity-token", "blocked", "token-form", current, "add_token_unavailable");
  await click(transport, CLARITY_PROJECTS_URL, add);
  await pause();

  const receipt = await transport.request({
    protocol: PROTOCOL,
    action: "capture_clarity_token",
    url: CLARITY_PROJECTS_URL,
    route,
  }) as Record<string, unknown>;
  if (receipt?.status !== "stored" || receipt?.token_value_returned !== false) {
    return result("clarity-token", "blocked", "capture", current, "token_capture_readback_invalid");
  }
  return result("clarity-token", "advanced", "stored", current);
}
