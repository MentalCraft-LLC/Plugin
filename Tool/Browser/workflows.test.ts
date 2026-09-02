import { describe, expect, test } from "bun:test";
import type { BrowserCommand } from "./core.ts";
import { captureClarityProjectId, chooseGa4Objective, readClarityProjectIdentity, runClarityProject, runClarityToken, runGa4Account, runGa4DistinctAccount } from "./workflows.ts";

class QueueTransport {
  readonly commands: BrowserCommand[] = [];
  constructor(private readonly responses: unknown[]) {}
  async request(command: BrowserCommand): Promise<unknown> {
    this.commands.push(command);
    if (this.responses.length === 0) throw new Error("unexpected_workflow_command");
    const response = this.responses.shift();
    if (response instanceof Error) throw response;
    return response;
  }
}

const page = (controls: unknown[]) => ({
  origin: "https://analytics.google.com",
  path: "/analytics/web/provision/",
  controls,
});

const dispatched = { action: "dispatched", value_returned: false };

describe("Browser provider workflows", () => {
  test("selects a distinct GA4 target without exposing its Provider ID", async () => {
    const transport = new QueueTransport([
      page([{ role: "button", name: "打开通用选择器。", disabled: false }]),
      dispatched,
      page([{ role: "option", name: "Example Analytics [provider-id]", disabled: false }]),
      { action: "select_ga4_target", status: "dispatched", value_returned: false },
      page([{ role: "link", name: "管理", disabled: false }]),
      dispatched,
      page([{ role: "button", name: "管理", disabled: false }]),
    ]);
    const result = await runGa4Account(transport, "Example Analytics");
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "ready",
      phase: "property",
      control_count: 1,
    });
    expect(transport.commands.map((command) => command.action)).toEqual([
      "controls", "click", "controls", "select_ga4_target", "controls", "click", "controls",
    ]);
    expect(JSON.stringify(transport.commands)).not.toContain("548089744");
  });

  test("starts distinct GA4 provisioning on the official provision surface", async () => {
    const transport = new QueueTransport([
      page([{ role: "button", name: "查看注释", disabled: false }]),
    ]);
    const result = await runGa4DistinctAccount(transport, "Example Analytics", {
      companySize: "小型 - 1 至 10 名员工",
      businessActivity: "其他业务活动",
      objectiveName: "查看用户互动度和留存率",
    });
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "blocked",
      phase: "account",
      reason: "create_account_control_missing",
      control_count: 1,
    });
    expect(transport.commands).toEqual([{
      protocol: "spiral.browser.v1",
      action: "controls",
      url: "https://analytics.google.com/analytics/web/?#/provision",
      navigate: true,
    }]);
  });

  test("enters the GA4 Admin surface through the visible provider navigation", async () => {
    const transport = new QueueTransport([
      page([{ role: "link", name: "管理", disabled: false }]),
      dispatched,
      page([{ role: "button", name: "开始衡量", disabled: false }]),
      dispatched,
      page([{ role: "textbox", name: "媒体资源名称", disabled: false }]),
    ]);
    const result = await runGa4Account(transport, "Example Analytics");
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "ready",
      phase: "property",
      control_count: 1,
    });
    expect(transport.commands.map((command) => command.action)).toEqual([
      "controls", "click", "controls", "click", "controls",
    ]);
  });

  test("advances GA4 account setup with optional sharing disabled and stops at property setup", async () => {
    const transport = new QueueTransport([
      page([{ role: "button", name: "开始衡量", disabled: false }]),
      dispatched,
      page([
        { role: "textbox", name: "我的新账号名称", disabled: false },
        { role: "checkbox", name: "Google 产品和服务", checked: true, disabled: false },
        { role: "checkbox", name: "技术支持", checked: false, disabled: false },
        { role: "button", name: "下一步", disabled: true },
      ]),
      dispatched,
      dispatched,
      page([
        { role: "textbox", name: "我的新账号名称", disabled: false },
        { role: "checkbox", name: "Google 产品和服务", checked: false, disabled: false },
        { role: "checkbox", name: "技术支持", checked: false, disabled: false },
        { role: "button", name: "下一步", disabled: false },
      ]),
      dispatched,
      page([{ role: "textbox", name: "媒体资源名称", disabled: false }]),
    ]);

    const result = await runGa4Account(transport, "Example Analytics");
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "advanced",
      phase: "property",
      control_count: 1,
    });
    expect(transport.commands.map((command) => command.action)).toEqual([
      "controls", "click", "controls", "fill", "click", "controls", "click", "controls",
    ]);
    expect(transport.commands.find((command) => command.action === "fill")?.value).toBe("Example Analytics");
    expect(transport.commands.some((command) => command.name?.includes("服务条款"))).toBe(false);
  });

  test("stops and preserves a resumable human boundary before any provider action", async () => {
    const transport = new QueueTransport([
      { status: "human_boundary", human_boundary: "mfa", resumable: true, controls: [] },
    ]);
    const result = await runGa4Account(transport, "Example Analytics");
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "blocked",
      phase: "human-boundary",
      reason: "human_boundary:mfa",
      control_count: 0,
    });
    expect(transport.commands.map((command) => command.action)).toEqual(["controls"]);
  });

  test("accepts one delegated standard GA4 terms boundary and resumes", async () => {
    const transport = new QueueTransport([
      { status: "human_boundary", human_boundary: "terms", resumable: true, controls: [] },
      { action: "accept_standard_terms", status: "dispatched", value_returned: false },
      page([{ role: "textbox", name: "Property name", disabled: false }]),
    ]);
    const result = await runGa4Account(transport, "Example Analytics", { acceptStandardTerms: true });
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "ready",
      phase: "property",
      control_count: 1,
    });
    expect(transport.commands).toEqual([
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin", navigate: true },
      {
        protocol: "spiral.browser.v1",
        action: "accept_standard_terms",
        url: "https://analytics.google.com/analytics/web/#/admin",
        provider: "ga4",
        owner_terms_delegated: true,
      },
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin" },
    ]);
  });

  test("accepts an explicitly Owner-authorized combined GA4 terms boundary", async () => {
    const transport = new QueueTransport([
      { status: "human_boundary", human_boundary: "terms", resumable: true, controls: [] },
      { action: "accept_owner_authorized_terms", status: "dispatched", value_returned: false },
      page([{ role: "textbox", name: "Property name", disabled: false }]),
    ]);
    const result = await runGa4Account(transport, "Example Analytics", { acceptOwnerAuthorizedTerms: true });
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "ready",
      phase: "property",
      control_count: 1,
    });
    expect(transport.commands).toEqual([
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin", navigate: true },
      {
        protocol: "spiral.browser.v1",
        action: "accept_owner_authorized_terms",
        url: "https://analytics.google.com/analytics/web/#/admin",
        provider: "ga4",
        owner_confirmed: true,
        owner_terms_delegated: true,
      },
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin" },
    ]);
  });

  test("selects one allowlisted GA4 objective when semantic controls are exposed", async () => {
    const transport = new QueueTransport([
      page([{ role: "radio", name: "发掘潜在客户", disabled: false }]),
      dispatched,
      page([{ role: "radio", name: "发掘潜在客户", checked: true, disabled: false }]),
    ]);

    const result = await chooseGa4Objective(transport, "发掘潜在客户");
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "advanced",
      phase: "objective",
      control_count: 1,
    });
    expect(transport.commands).toEqual([
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin", navigate: true },
      {
        protocol: "spiral.browser.v1",
        action: "click",
        url: "https://analytics.google.com/analytics/web/#/admin",
        role: "radio",
        name: "发掘潜在客户",
      },
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin" },
    ]);
  });

  test("selects an allowlisted GA4 objective through a provider checkbox", async () => {
    const transport = new QueueTransport([
      page([{ role: "checkbox", name: "查看用户互动度和留存率", checked: false, disabled: false }]),
      dispatched,
      page([{ role: "checkbox", name: "查看用户互动度和留存率", checked: true, disabled: false }]),
    ]);
    const result = await chooseGa4Objective(transport, "查看用户互动度和留存率");
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "advanced",
      phase: "objective",
      control_count: 1,
    });
    expect(transport.commands).toEqual([
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin", navigate: true },
      {
        protocol: "spiral.browser.v1",
        action: "click",
        url: "https://analytics.google.com/analytics/web/#/admin",
        role: "checkbox",
        name: "查看用户互动度和留存率",
      },
      { protocol: "spiral.browser.v1", action: "controls", url: "https://analytics.google.com/analytics/web/#/admin" },
    ]);
  });

  test("selects an allowlisted GA4 objective through the provider card adapter", async () => {
    const transport = new QueueTransport([
      page([{ role: "button", name: "关于业务目标的提示", disabled: false }]),
      { action: "select_ga4_objective", status: "dispatched", value_returned: false },
      page([{ role: "button", name: "创建包含媒体资源的账号", disabled: false }]),
    ]);
    const result = await chooseGa4Objective(transport, "查看用户互动度和留存率", { navigateToSurface: false });
    expect(result).toEqual({
      workflow: "ga4-account",
      status: "advanced",
      phase: "objective",
      control_count: 1,
    });
    expect(transport.commands.map((command) => command.action)).toEqual([
      "controls", "select_ga4_objective", "controls",
    ]);
  });

  test("fails closed on an unknown GA4 data-sharing choice", async () => {
    const transport = new QueueTransport([
      page([
        { role: "textbox", name: "Account name", disabled: false },
        { role: "checkbox", name: "Unknown sharing choice", checked: true, disabled: false },
      ]),
      dispatched,
    ]);
    const result = await runGa4Account(transport, "Example Analytics");
    expect(result.status).toBe("blocked");
    expect(result.reason).toBe("unknown_data_sharing_control");
    expect(transport.commands.map((command) => command.action)).toEqual(["controls", "fill"]);
  });

  test("accepts one delegated standard Clarity terms boundary and resumes", async () => {
    const transport = new QueueTransport([
      { status: "human_boundary", human_boundary: "terms", resumable: true, controls: [] },
      { action: "accept_standard_terms", status: "dispatched", value_returned: false },
      { origin: "https://clarity.microsoft.com", path: "/projects", controls: [{ role: "link", name: "Example Analytics", disabled: false }] },
      { project_card_count: 1, project_name_match: true, domain_match: true, project_id_readback: true, distinct_identity_verified: true, raw_values_returned: false },
    ]);
    const result = await runClarityProject(transport, "Example Analytics", "example.test", { acceptStandardTerms: true });
    expect(result).toEqual({
      workflow: "clarity-project",
      status: "ready",
      phase: "project",
      control_count: 1,
    });
    expect(transport.commands).toEqual([
      { protocol: "spiral.browser.v1", action: "controls", url: "https://clarity.microsoft.com/projects", navigate: true },
      {
        protocol: "spiral.browser.v1",
        action: "accept_standard_terms",
        url: "https://clarity.microsoft.com/projects",
        provider: "clarity",
        owner_terms_delegated: true,
      },
      { protocol: "spiral.browser.v1", action: "controls", url: "https://clarity.microsoft.com/projects" },
      {
        protocol: "spiral.browser.v1",
        action: "clarity_project_identity",
        url: "https://clarity.microsoft.com/projects",
        project_name: "Example Analytics",
        domain: "example.test",
      },
    ]);
  });

  test("accepts delegated Clarity terms exposed inside the project form", async () => {
    const form = page([
      { role: "textbox", name: "Project name", disabled: false },
      { role: "textbox", name: "Website URL", disabled: false },
      { role: "combobox", name: "Industry Other", disabled: false },
      { role: "checkbox", name: "Accept standard terms", context: "dialog", checked: false, disabled: false },
      { role: "button", name: "Create project", disabled: false },
    ]);
    const transport = new QueueTransport([
      page([{ role: "button", name: "New project", disabled: false }]),
      dispatched,
      form,
      dispatched,
      dispatched,
      form,
      { action: "accept_standard_terms", status: "dispatched", value_returned: false },
      page([{ role: "button", name: "Create project", disabled: false }]),
      dispatched,
      page([{ role: "link", name: "Example Analytics example.test", disabled: false }]),
      { project_card_count: 1, project_name_match: true, domain_match: true, project_id_readback: true, distinct_identity_verified: true, raw_values_returned: false },
    ]);
    const result = await runClarityProject(transport, "Example Analytics", "example.test", { acceptStandardTerms: true });
    expect(result).toMatchObject({ status: "advanced", phase: "project" });
    expect(transport.commands.map((command) => command.action)).toContain("accept_standard_terms");
  });

  test("creates one exact Clarity project and remains idempotent by public target", async () => {
    const clarityPage = (controls: unknown[]) => ({
      origin: "https://clarity.microsoft.com",
      path: "/projects",
      controls,
    });
    const transport = new QueueTransport([
      clarityPage([{ role: "button", name: "New project", disabled: false }]),
      dispatched,
      clarityPage([
        { role: "textbox", name: "Name", disabled: false },
        { role: "textbox", name: "Website URL", disabled: false },
      ]),
      dispatched,
      dispatched,
      clarityPage([
        { role: "textbox", name: "Name", disabled: false },
        { role: "textbox", name: "Website URL", disabled: false },
        { role: "combobox", name: "Website industry Select one", disabled: false },
        { role: "button", name: "Create project", disabled: true },
      ]),
      dispatched,
      clarityPage([
        { role: "combobox", name: "Website industry Science, Social Science, & Others", disabled: false },
        { role: "option", name: "Other", disabled: false },
      ]),
      dispatched,
      clarityPage([
        { role: "combobox", name: "Website industry Other", disabled: false },
        { role: "button", name: "Create project", disabled: false },
      ]),
      dispatched,
      clarityPage([{ role: "link", name: "Example Analytics", disabled: false }]),
      { project_card_count: 1, project_name_match: true, domain_match: true, project_id_readback: true, distinct_identity_verified: true, raw_values_returned: false },
    ]);

    const result = await runClarityProject(transport, "Example Analytics", "example.test");
    expect(result.status).toBe("advanced");
    expect(result.phase).toBe("project");
    expect(transport.commands.map((command) => command.action)).toEqual([
      "controls", "click", "controls", "fill", "fill", "controls",
      "click", "controls", "click", "controls", "click", "controls",
      "clarity_project_identity",
    ]);
  });

  test("reads one distinct Clarity identity without returning its Provider ID", async () => {
    const transport = new QueueTransport([
      { project_card_count: 1, project_name_match: true, domain_match: true, project_id_readback: true, distinct_identity_verified: true, raw_values_returned: false },
    ]);
    const result = await readClarityProjectIdentity(transport, "Example Analytics", "example.test");
    expect(result).toEqual({
      project_card_count: 1,
      project_name_match: true,
      domain_match: true,
      project_id_readback: true,
      distinct_identity_verified: true,
      raw_values_returned: false,
    });
    expect(transport.commands).toEqual([{
      protocol: "spiral.browser.v1",
      action: "clarity_project_identity",
      url: "https://clarity.microsoft.com/projects",
      project_name: "Example Analytics",
      domain: "example.test",
    }]);
  });

  test("captures one verified Clarity project ID without returning its value", async () => {
    const transport = new QueueTransport([
      { status: "stored", route: "Application/Assessment/Example Analytics", project_id_present: true, project_id_returned: false, token_file: "[private]", mode: "0600" },
    ]);
    const result = await captureClarityProjectId(transport, "Application/Assessment/Example Analytics", "Example Analytics", "example.test");
    expect(result.project_id_present).toBe(true);
    expect(result.project_id_returned).toBe(false);
    expect(JSON.stringify(result)).not.toContain("newid123");
    expect(transport.commands).toEqual([{
      protocol: "spiral.browser.v1",
      action: "capture_clarity_project_id",
      url: "https://clarity.microsoft.com/projects",
      route: "Application/Assessment/Example Analytics",
      project_name: "Example Analytics",
      domain: "example.test",
      identity_verified: true,
    }]);
  });

  test("captures a generated Clarity token directly into local storage without returning its value", async () => {
    const clarityPage = (controls: unknown[]) => ({
      origin: "https://clarity.microsoft.com",
      path: "/projects/view/xvh7gpm90r/settings",
      controls,
    });
    const transport = new QueueTransport([
      new Error("clarity_token_missing"),
      { status: "ready" },
      clarityPage([{ context: "header", role: "tab", name: "settings", disabled: false }]),
      dispatched,
      clarityPage([{ context: "main", role: "link", name: "Data export", disabled: false }]),
      dispatched,
      clarityPage([{ context: "main", role: "button", name: "Generate new API token", disabled: false }]),
      dispatched,
      clarityPage([
        { context: "dialog", role: "textbox", name: "Enter a friendly name", disabled: false },
        { context: "dialog", role: "button", name: "Add", disabled: true },
      ]),
      dispatched,
      clarityPage([
        { context: "dialog", role: "textbox", name: "Enter a friendly name", disabled: false },
        { context: "dialog", role: "button", name: "Add", disabled: false },
      ]),
      dispatched,
      { status: "stored", token_present: true, token_value_returned: false },
    ]);

    const result = await runClarityToken(
      transport,
      "Application/Assessment/Example",
      "xvh7gpm90r",
    );
    expect(result).toEqual({
      workflow: "clarity-token",
      status: "advanced",
      phase: "stored",
      control_count: 2,
    });
    expect(transport.commands.map((command) => command.action)).toEqual([
      "capture_clarity_token", "open", "controls", "click", "controls", "click",
      "controls", "click", "controls", "fill", "controls", "click", "capture_clarity_token",
    ]);
    expect(JSON.stringify(transport.commands)).not.toContain("abcdefgh.ijklmnop.qrstuvwx");
  });
});
