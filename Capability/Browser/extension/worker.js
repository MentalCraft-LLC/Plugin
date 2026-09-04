importScripts("challenge.js", "foreground-screenshot.js", "managed-screenshot.js", "activate-tab.js");

const PROTOCOL = "spiral.browser.v1";
const HOST = "com.onespiral.browser";
const NORMAL_WEB_PROTOCOLS = new Set(["http:", "https:"]);
const STORAGE_PREFIX = "managedTabIds:";
const GROUP_PREFIX = "managedTabGroupId:";
const ACTIVATION_PREFIX = "trustedActivation:";
const FOREGROUND_SCREENSHOT_KEY = "foregroundScreenshotGrant";
const FINANCIAL_ACTION = /(?:\bbuy\b|\bpurchase\b|\bpay\b|\bcheckout\b|\bsubscribe\b|\bsubscription\b|\bupgrade\b|\border\b|\btransfer\b|\bsend money\b|\bdonate\b|\btip\b|\bbilling\b|\bpayment\b|\bcredit card\b|\bdebit card\b|\bbank\b|\bwallet\b|\binvoice\b|\brefund\b|\bcharge\b|\bcart\b|\bpricing\b|\bplan\b|[$€£¥]|支付|付款|购买|订阅|升级|结账|下单|转账|捐赠|账单|银行卡)/i;
let port;
let reconnectTimer;
const stripeFramesByTab = new Map();
const STRIPE_EMBEDDED_HOST = /(?:^|\.)stripe\.com$/i;
const TERMS_CONTROL = /terms(?:\s+of\s+(?:service|use))?|service\s+terms|privacy\s+policy|agree|accept|条款|服务协议|隐私政策|同意|接受/i;

function clearStripeFrames(tabId) {
  stripeFramesByTab.delete(tabId);
}

function registerStripeFrame(sender) {
  if (!Number.isInteger(sender?.tab?.id) || !Number.isInteger(sender?.frameId) || sender.frameId <= 0 || typeof sender?.url !== "string") return;
  let url;
  try { url = safeUrl(sender.url); } catch { return; }
  if (!STRIPE_EMBEDDED_HOST.test(url.hostname)) return;
  const frames = stripeFramesByTab.get(sender.tab.id) ?? new Map();
  if (!frames.has(sender.frameId) && frames.size >= 8) return;
  frames.set(sender.frameId, url.hostname.toLowerCase());
  stripeFramesByTab.set(sender.tab.id, frames);
}

function safeFrameControls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((control) => control && typeof control === "object" && typeof control.name === "string" && control.name.length <= 120 && typeof control.role === "string")
    .slice(0, 24)
    .map((control) => ({
      context: typeof control.context === "string" ? control.context : "page",
      role: control.role,
      name: control.name,
      disabled: control.disabled === true,
      ...(typeof control.checked === "boolean" ? { checked: control.checked } : {}),
    }));
}

function safeFrameBinaryControls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((control) => control && typeof control === "object" && typeof control.name === "string" && control.name.length <= 120 && ["checkbox", "radio", "switch"].includes(control.role))
    .slice(0, 24)
    .map((control) => ({
      role: control.role,
      name: control.name,
      checked: control.checked === true,
      disabled: control.disabled === true,
      terms_signal: control.terms_signal === true,
    }));
}

async function pageFromFrames(tabId, topOrigin) {
  const top = await sendToContent(tabId, { action: "page" });
  if (!top || typeof top !== "object") throw new Error("content_page_invalid");
  let topUrl;
  try { topUrl = safeUrl(topOrigin); } catch { return top; }
  if (topUrl.hostname !== "dashboard.stripe.com") return top;
  await new Promise((resolve) => setTimeout(resolve, 250));
  const candidates = [...(stripeFramesByTab.get(tabId) ?? new Map()).entries()]
    .filter(([, hostname]) => STRIPE_EMBEDDED_HOST.test(hostname))
    .slice(0, 8);
  const summaries = [];
  const boundaryControls = [];
  for (const [frameId] of candidates) {
    try {
      const frame = await sendToContent(tabId, { action: "page" }, frameId, 1);
      const controls = safeFrameControls(frame?.controls);
      const binaryControls = safeFrameBinaryControls(frame?.diagnostics?.binary_controls);
      if (controls.length === 0 && binaryControls.length === 0) continue;
      summaries.push({ controls, binary_controls: binaryControls });
      for (const control of controls) {
        if (TERMS_CONTROL.test(control.name)) boundaryControls.push(control);
      }
      for (const control of binaryControls) {
        if (control.terms_signal && control.name) boundaryControls.push(control);
      }
    } catch { /* stale or non-responsive iframe is ignored */ }
  }
  const topControls = safeFrameControls(top.controls);
  return {
    ...top,
    controls: [...topControls, ...boundaryControls].slice(0, 120),
    embedded_frame_diagnostics: {
      discovered_frame_count: candidates.length,
      inspected_frame_count: summaries.length,
      controls: summaries.flatMap((summary) => summary.controls).slice(0, 24),
      binary_controls: summaries.flatMap((summary) => summary.binary_controls).slice(0, 24),
      actions_supported: false,
    },
  };
}

function safeUrl(raw) {
  let url;
  try { url = new URL(String(raw)); } catch { throw new Error("url_invalid"); }
  if (!NORMAL_WEB_PROTOCOLS.has(url.protocol) || url.username || url.password) {
    throw new Error("origin_not_allowed");
  }
  return url;
}

function safeForegroundUrl(raw) {
  let url;
  try { url = new URL(String(raw)); } catch { throw new Error("url_invalid"); }
  if (!NORMAL_WEB_PROTOCOLS.has(url.protocol) || url.username || url.password) throw new Error("foreground_origin_not_allowed");
  return url;
}

function requiresFinancialConfirmation(command) {
  if (!["click", "fill", "press_enter"].includes(command?.action)) return false;
  return FINANCIAL_ACTION.test([command.url, command.name, command.field].filter(Boolean).join(" "));
}

function managedSession(command) {
  const id = String(command?.session?.id ?? "").trim();
  const name = String(command?.session?.name ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  const workspace = String(command?.session?.workspace ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!/^[a-z0-9][a-z0-9_-]{7,79}$/i.test(id) || !name || name.length > 80) throw new Error("session_invalid");
  if (!workspace || workspace.length > 200) throw new Error("session_workspace_invalid");
  return { id, name, workspace };
}

// Governance Law: In Browser, tab-group-name strictly is session-name (Single Source of Truth).
function groupTitle(session) {
  return session.name;
}

function tabKey(session) {
  return `${STORAGE_PREFIX}${session.id}`;
}

function activityKey(session) {
  return `lastActivity:${session.id}`;
}

// Idle reaping: a managed tab group with no bridge activity for
// IDLE_REAP_MS is closed (tabs removed + storage cleared), so abandoned
// Session groups do not pile up. Runs on a light interval; no daemon.
const IDLE_REAP_MS = 30 * 60 * 1000;

async function reapIdleGroups() {
  const now = Date.now();
  const all = await chrome.storage.session.get(null);
  const reaped = [];
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith("lastActivity:")) continue;
    const sessionId = key.slice("lastActivity:".length);
    if (typeof value === "number" && now - value > IDLE_REAP_MS) {
      const session = { id: sessionId, name: "idle-reap", workspace: "" };
      const ids = await managedTabIds(session);
      for (const id of ids) {
        try {
          const tab = await chrome.tabs.get(id);
          if (tab?.id) { await chrome.tabs.remove(tab.id); clearStripeFrames(tab.id); }
        } catch { /* already closed */ }
      }
      await forgetGroup(session);
      reaped.push(sessionId);
    }
  }
  return reaped;
}

setInterval(() => { void reapIdleGroups().catch(() => undefined); }, 5 * 60 * 1000);

function groupKey(session) {
  return `${GROUP_PREFIX}${session.id}`;
}

async function rememberedGroupId(session) {
  const key = groupKey(session);
  const live = await chrome.storage.session.get(key);
  if (Number.isInteger(live[key])) return live[key];
  const saved = await chrome.storage.local.get(key);
  if (Number.isInteger(saved[key])) return saved[key];
  const title = groupTitle(session);
  if (!title) return null;
  const groups = await chrome.tabGroups.query({ title });
  if (groups.length === 0) return null;
  const ranked = [];
  for (const group of groups) {
    if (!Number.isInteger(group.id)) continue;
    const tabs = await chrome.tabs.query({ groupId: group.id });
    ranked.push({ id: group.id, tabs: tabs.length });
  }
  ranked.sort((left, right) => right.tabs - left.tabs);
  if (ranked.length === 0) return null;
  await rememberGroupId(session, ranked[0].id);
  return ranked[0].id;
}

async function rememberGroupId(session, groupId) {
  const key = groupKey(session);
  await chrome.storage.session.set({ [key]: groupId });
  await chrome.storage.local.set({ [key]: groupId });
}

async function forgetGroup(session) {
  const keys = [tabKey(session), groupKey(session), activationKey(session), activityKey(session)];
  await chrome.storage.session.remove(keys);
  await chrome.storage.local.remove([groupKey(session)]);
}

async function hydrateManagedTabs(session) {
  const current = await managedTabIds(session);
  if (current.length > 0) return current;
  const groupId = await rememberedGroupId(session);
  if (groupId === null) return [];
  try {
    await chrome.tabGroups.get(groupId);
    const tabs = await chrome.tabs.query({ groupId });
    const ids = tabs.map((tab) => tab.id).filter((id) => Number.isInteger(id));
    if (ids.length === 0) return [];
    await chrome.storage.session.set({ [tabKey(session)]: ids, [groupKey(session)]: groupId });
    return ids;
  } catch {
    await chrome.storage.local.remove([groupKey(session)]);
    return [];
  }
}

function activationKey(session) {
  return `${ACTIVATION_PREFIX}${session.id}`;
}

async function activateManagedTab(tab, targetUrl, session, confirmed) {
  await assertInsideManagedGroup(tab, session);
  const priorActivation = await chrome.storage.session.get(activationKey(session));
  if (priorActivation[activationKey(session)]) throw new Error("trusted_activation_unrestored");
  const identity = globalThis.spiralActivateTarget(tab, targetUrl, confirmed);
  const [previousTarget] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
  const previousWindow = await chrome.windows.getLastFocused();
  let groupCollapsed = false;
  if (Number.isInteger(tab.groupId) && tab.groupId >= 0) {
    const group = await chrome.tabGroups.get(tab.groupId);
    groupCollapsed = group.collapsed === true;
  }
  await chrome.storage.session.set({
    [activationKey(session)]: {
      target_tab_id: tab.id,
      target_window_id: tab.windowId,
      target_group_id: Number.isInteger(tab.groupId) ? tab.groupId : -1,
      target_origin: new URL(targetUrl).origin,
      previous_tab_id: previousTarget?.id ?? null,
      previous_window_id: previousWindow?.id ?? null,
      group_collapsed: groupCollapsed,
      activated_at: Date.now(),
    },
  });
  if (groupCollapsed) await chrome.tabGroups.update(tab.groupId, { collapsed: false });
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  const current = await chrome.tabs.get(tab.id);
  if (!current.active || current.windowId !== tab.windowId) throw new Error("activate_target_not_foreground");
  // Report the managed window's own bounds so the host can convert CSS
  // points into global screen points for THIS window, never a larger
  // unrelated Chrome window. Browser-reported geometry is still cross-checked
  // against the empirically measured scale in the host.
  let windowBounds = null;
  try {
    const targetWindow = await chrome.windows.get(tab.windowId, { populate: false });
    if (Number.isFinite(targetWindow.left) && Number.isFinite(targetWindow.top)
      && Number.isFinite(targetWindow.width) && Number.isFinite(targetWindow.height)) {
      windowBounds = { left: targetWindow.left, top: targetWindow.top, width: targetWindow.width, height: targetWindow.height };
    }
  } catch { /* bounds unavailable; host falls back to System Events measurement */ }
  return { ...identity, status: "activated", tab_active: true, focus_changed: true, window_bounds: windowBounds };
}

async function restoreManagedTab(session, targetUrl) {
  const key = activationKey(session);
  const stored = await chrome.storage.session.get(key);
  const state = stored[key];
  if (!state) throw new Error("restore_background_state_missing");
  const target = await chrome.tabs.get(state.target_tab_id);
  let previous;
  if (Number.isInteger(state.previous_tab_id) && state.previous_tab_id !== state.target_tab_id) {
    try { previous = await chrome.tabs.get(state.previous_tab_id); } catch { previous = undefined; }
  }
  if (!previous || previous.windowId !== target.windowId) {
    const candidates = await chrome.tabs.query({ windowId: target.windowId });
    previous = candidates.find((candidate) => candidate.id && candidate.id !== target.id);
  }
  if (!previous?.id) throw new Error("restore_background_tab_missing");
  await chrome.tabs.update(previous.id, { active: true });
  if (Number.isInteger(state.target_group_id) && state.target_group_id >= 0 && state.group_collapsed === true) {
    await chrome.tabGroups.update(state.target_group_id, { collapsed: true });
  }
  if (Number.isInteger(state.previous_window_id)) {
    try { await chrome.windows.update(state.previous_window_id, { focused: true }); } catch { /* prior Chrome window closed */ }
  }
  const restoredTarget = await chrome.tabs.get(state.target_tab_id);
  if (restoredTarget.active) throw new Error("restore_background_target_still_active");
  await chrome.storage.session.remove(key);
  return { status: "restored", tab_active: false, focus_changed: true, popup_opened: false };
}

async function managedTabIds(session) {
  const key = tabKey(session);
  const value = await chrome.storage.session.get(key);
  return Array.isArray(value[key]) ? value[key].filter(Number.isInteger) : [];
}

async function isManagedTabId(session, id) {
  return (await managedTabIds(session)).includes(id);
}

async function assertInsideManagedGroup(tab, session) {
  if (!tab?.id || !(await isManagedTabId(session, tab.id))) throw new Error("tab_outside_managed_group");
}

async function finishManaged(tabId, session, result) {
  const managed = await chrome.tabs.get(tabId);
  await assertInsideManagedGroup(managed, session);
  return { ...result, tab_active: managed.active === true, focus_changed: false, popup_opened: false };
}

async function foreignTabIsActiveInWindow(session, windowId) {
  const [active] = await chrome.tabs.query({ active: true, windowId });
  if (!active?.id) return false;
  return !(await isManagedTabId(session, active.id));
}

async function retainManagedTab(session, id) {
  const ids = await managedTabIds(session);
  if (!ids.includes(id)) ids.push(id);
  await chrome.storage.session.set({ [tabKey(session)]: ids.slice(-20) });
}

async function releaseManagedTab(session, id) {
  const ids = (await managedTabIds(session)).filter((candidate) => candidate !== id);
  await chrome.storage.session.set({ [tabKey(session)]: ids });
}

async function existingManagedTab(origin, session) {
  await hydrateManagedTabs(session);
  const retained = [];
  let match = null;
  for (const id of await managedTabIds(session)) {
    try {
      const tab = await chrome.tabs.get(id);
      if (!tab.id || !tab.url) continue;
      const url = new URL(tab.url);
      if (!NORMAL_WEB_PROTOCOLS.has(url.protocol)) continue;
      retained.push(tab.id);
      if (!match && url.origin === origin) match = tab;
    } catch { /* closed tab */ }
  }
  await chrome.storage.session.set({ [tabKey(session)]: retained });
  return match;
}

async function ensureManagedGroup(tab, session, allowActive = false) {
  if (!tab.id || !tab.windowId) throw new Error("background_tab_group_invalid");
  await hydrateManagedTabs(session);
  const ids = await managedTabIds(session);
  const managed = [];
  for (const id of ids) {
    try {
      const candidate = await chrome.tabs.get(id);
      if (!candidate.id || !candidate.windowId || !NORMAL_WEB_PROTOCOLS.has(new URL(candidate.url || "").protocol)) continue;
      managed.push(candidate);
    } catch { /* closed tab */ }
  }
  if (!managed.some((candidate) => candidate.id === tab.id)) managed.push(tab);

  let groupId = await rememberedGroupId(session);
  let group;
  if (groupId !== null) {
    try { group = await chrome.tabGroups.get(groupId); }
    catch { groupId = null; }
  }
  if (groupId === null) {
    const candidates = [];
    for (const candidate of managed) {
      if (!Number.isInteger(candidate.groupId) || candidate.groupId < 0) continue;
      try {
        const candidateGroup = await chrome.tabGroups.get(candidate.groupId);
        candidates.push(candidateGroup);
      } catch { /* stale group */ }
    }
    group = candidates.find((candidate) => candidate.title === groupTitle(session)) ?? null;
    // Never fall back to another session's group: a missing or renamed group
    // must be created fresh with this session's name, otherwise every session
    // silently shares the first group found (visible as one "· holar" group).
    groupId = group?.id ?? null;
  }

  const windowId = group?.windowId ?? tab.windowId;
  if (groupId === null) {
    groupId = await chrome.tabs.group({ tabIds: [tab.id], createProperties: { windowId } });
    group = await chrome.tabGroups.get(groupId);
  }
  if (!group || group.windowId !== windowId) throw new Error("background_tab_group_invalid");

  const sameWindow = [];
  for (const candidate of managed) {
    let grouped = candidate;
    if (candidate.windowId !== windowId) {
      if (candidate.active) continue;
      grouped = await chrome.tabs.move(candidate.id, { windowId, index: -1 });
    }
    if (!grouped || !grouped.id) throw new Error("background_tab_move_failed");
    sameWindow.push(grouped.id);
  }
  if (sameWindow.length > 0) await chrome.tabs.group({ groupId, tabIds: sameWindow });
  const managedIds = managed.map((candidate) => candidate.id).filter(Number.isInteger);
  await chrome.storage.session.set({ [tabKey(session)]: managedIds });
  await rememberGroupId(session, groupId);
  const foreignActive = await foreignTabIsActiveInWindow(session, windowId);
  await chrome.tabGroups.update(groupId, { title: groupTitle(session), color: "blue", collapsed: foreignActive });
  const grouped = await chrome.tabs.get(tab.id);
  await assertInsideManagedGroup(grouped, session);
  return grouped;
}

async function managedGroupReadback(ids, expectedTitle) {
  const tabs = [];
  for (const id of ids) {
    try { tabs.push(await chrome.tabs.get(id)); } catch { /* closed tab */ }
  }
  const groupIds = [...new Set(tabs.map((tab) => tab.groupId).filter((id) => Number.isInteger(id) && id >= 0))];
  if (tabs.length === 0) return { status: "empty", title: expectedTitle, collapsed: true, tab_count: 0 };
  if (groupIds.length !== 1) return { status: "drift", title: expectedTitle, collapsed: false, tab_count: tabs.length };
  try {
    const group = await chrome.tabGroups.get(groupIds[0]);
    return {
      status: group.title === expectedTitle && group.collapsed ? "ready" : "drift",
      title: group.title || "",
      collapsed: Boolean(group.collapsed),
      tab_count: tabs.length,
    };
  } catch {
    return { status: "drift", title: expectedTitle, collapsed: false, tab_count: tabs.length };
  }
}

async function waitComplete(tabId, timeoutMs = 30_000) {
  const current = await chrome.tabs.get(tabId);
  if (current.status === "complete") return current;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("navigation_timeout"));
    }, timeoutMs);
    function listener(id, change, tab) {
      if (id !== tabId || change.status !== "complete") return;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(tab);
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function activeOrLatestManagedTab(session) {
  await hydrateManagedTabs(session);
  const ids = await managedTabIds(session);
  const tabs = [];
  for (const id of ids) {
    try {
      const tab = await chrome.tabs.get(id);
      if (tab?.id && tab.url && NORMAL_WEB_PROTOCOLS.has(new URL(tab.url).protocol)) {
        tabs.push(tab);
      }
    } catch { /* closed tab */ }
  }
  if (tabs.length === 0) return null;
  const activeTab = tabs.find((t) => t.active);
  return activeTab ?? tabs.at(-1) ?? null;
}

async function ensureTab(rawUrl, navigate = false, session, allowActive = false) {
  if (!rawUrl) {
    const existing = await activeOrLatestManagedTab(session);
    if (!existing) throw new Error("url_required");
    const tab = await ensureManagedGroup(existing, session, allowActive);
    if (!tab.url) throw new Error("background_tab_url_missing");
    let current;
    try { current = new URL(tab.url); } catch { throw new Error("background_tab_url_invalid"); }
    if (!NORMAL_WEB_PROTOCOLS.has(current.protocol)) {
      return { tab, status: "interactive_login_required", origin: null, path: null };
    }
    return { tab, status: "ready", origin: current.origin, path: current.pathname };
  }
  const target = safeUrl(rawUrl);
  let tab = await existingManagedTab(target.origin, session);
  let navigationStarted = false;
  if (!tab) {
    tab = await chrome.tabs.create({ url: target.toString(), active: false });
    if (!tab.id) throw new Error("background_tab_create_failed");
    clearStripeFrames(tab.id);
    await retainManagedTab(session, tab.id);
    navigationStarted = true;
  } else if ((navigate || tab.url !== target.toString()) && tab.id) {
    clearStripeFrames(tab.id);
    tab = await chrome.tabs.update(tab.id, { url: target.toString() });
    navigationStarted = true;
  }
  tab = navigationStarted ? await waitComplete(tab.id) : await chrome.tabs.get(tab.id);
  tab = await ensureManagedGroup(tab, session, allowActive);
  if (tab.id) {
    try { await chrome.tabs.update(tab.id, { autoDiscardable: false }); } catch {}
  }
  if (!tab.url) throw new Error("background_tab_url_missing");
  let current;
  try { current = new URL(tab.url); } catch { throw new Error("background_tab_url_invalid"); }
  if (!NORMAL_WEB_PROTOCOLS.has(current.protocol)) {
    return { tab, status: "interactive_login_required", origin: null, path: null };
  }
  return { tab, status: "ready", origin: current.origin, path: current.pathname };
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

async function awakenBackgroundPage(tabId, run) {
  if (!Number.isInteger(tabId)) return await run(false);
  let attached = false;
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
    attached = true;
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (!/already attached/i.test(text)) return await run(false);
  }
  let awakened = false;
  let screencast = false;
  const onEvent = (source, method, params) => {
    if (source?.tabId !== tabId || method !== "Page.screencastFrame") return;
    const sessionId = params?.sessionId;
    if (!Number.isInteger(sessionId)) return;
    chrome.debugger.sendCommand({ tabId }, "Page.screencastFrameAck", { sessionId }).catch(() => undefined);
  };
  try {
    try { await chrome.debugger.sendCommand({ tabId }, "Page.enable", {}); } catch {}
    try {
      await chrome.debugger.sendCommand({ tabId }, "Page.setWebLifecycleState", { state: "active" });
      awakened = true;
    } catch {}
    try {
      await chrome.debugger.sendCommand({ tabId }, "Emulation.setFocusEmulationEnabled", { enabled: true });
      awakened = true;
    } catch {}
    try {
      chrome.debugger.onEvent.addListener(onEvent);
      await chrome.debugger.sendCommand({ tabId }, "Page.startScreencast", {
        format: "jpeg",
        quality: 1,
        maxWidth: 64,
        maxHeight: 64,
        everyNthFrame: 2,
      });
      screencast = true;
      awakened = true;
    } catch {
      try { chrome.debugger.onEvent.removeListener(onEvent); } catch {}
    }
    return await run(awakened);
  } finally {
    if (screencast) {
      try { chrome.debugger.onEvent.removeListener(onEvent); } catch {}
      try { await chrome.debugger.sendCommand({ tabId }, "Page.stopScreencast", {}); } catch {}
    }
    try { await chrome.debugger.sendCommand({ tabId }, "Emulation.setFocusEmulationEnabled", { enabled: false }); } catch {}
    if (attached) await chrome.debugger.detach({ tabId }).catch(() => undefined);
  }
}

async function sendToContent(tabId, message, frameId = 0, attempts = 5, timeoutMs = 6_000) {
  const longRunning = message?.action === "read_text";
  const maxAttempts = longRunning ? Math.min(attempts, 2) : attempts;
  let lastError = "content_unavailable";
  let reloaded = false;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await withTimeout(
        chrome.tabs.sendMessage(tabId, { protocol: PROTOCOL, ...message }, { frameId }),
        timeoutMs,
        "content_timeout",
      );
      if (!response?.ok) throw new Error(response?.error || "content_failure");
      return response.result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "content_unavailable";
      const lost = /receiving end does not exist/i.test(lastError);
      const hung = lastError === "content_timeout";
      if (hung && longRunning) break;
      if (!reloaded && (lost || hung)) {
        reloaded = true;
        try {
          if (chrome.scripting?.executeScript) {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ["text.js", "long-capture.js", "annotation.js", "content.js"],
            });
            await new Promise((resolve) => setTimeout(resolve, 150));
          } else {
            await chrome.tabs.reload(tabId, { bypassCache: false });
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        } catch { /* tab closed meanwhile; continue retry loop */ }
      }
      if (attempt + 1 < maxAttempts) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(lastError);
}

const ownerSubmitWaiters = new Map();

function composeOwnerAnnotationMessage(payload) {
  const lines = [];
  const body = String(payload?.prompt || "").trim();
  if (body) lines.push(body.slice(0, 2000));
  if (payload?.url) lines.push(String(payload.url).slice(0, 300));
  if (payload?.title) lines.push(String(payload.title).slice(0, 120));
  const rows = Array.isArray(payload?.annotations) ? payload.annotations.slice(0, 12) : [];
  if (rows.length > 0) {
    if (lines.length > 0) lines.push("");
    for (const item of rows) {
      const name = item.component || item.tag || item.element || "element";
      const text = String(item.textContent || item.name || "").slice(0, 80);
      const path = String(item.xpath || "").slice(0, 160);
      lines.push(`- ${name} xpath=${path}${text ? ` text=${text}` : ""}`);
    }
  }
  return lines.join("\n").trim().slice(0, 2000);
}

async function resolveSubmitTarget(sender) {
  const tabId = sender?.tab?.id;
  if (!Number.isInteger(tabId)) return "";
  try {
    const tab = await chrome.tabs.get(tabId);
    if (Number.isInteger(tab.groupId) && tab.groupId >= 0) {
      const group = await chrome.tabGroups.get(tab.groupId);
      const title = String(group.title || "").trim();
      if (title && title.length <= 80) return title;
    }
  } catch {}
  return "";
}

function submitOwnerAnnotation(payload) {
  if (!port) connect();
  if (!port) throw new Error("extension_not_ready");
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ownerSubmitWaiters.delete(id);
      reject(new Error("owner_submit_timeout"));
    }, 10_000);
    ownerSubmitWaiters.set(id, (message) => {
      clearTimeout(timer);
      if (message.ok) resolve(message.result || { copied: true, delivered: false });
      else reject(new Error(message.error || "owner_submit_failed"));
    });
    port.postMessage({
      kind: "owner_submit",
      id,
      target: payload.target || "",
      url: payload.url || "",
      message: payload.message,
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.protocol === PROTOCOL && message?.kind === "stripe_frame_ready") {
    registerStripeFrame(sender);
    sendResponse({ ok: true });
    return false;
  }
  if (message?.protocol === PROTOCOL && message?.action === "annotation_submit") {
    Promise.resolve()
      .then(async () => {
        const target = await resolveSubmitTarget(sender);
        const composed = typeof message.message === "string" && message.message.trim()
          ? message.message.trim().slice(0, 2000)
          : composeOwnerAnnotationMessage(message);
        if (!composed) throw new Error("message_empty");
        const result = await submitOwnerAnnotation({ target, url: message.url, message: composed });
        return { copied: result.copied !== false, delivered: result.delivered === true, status: result.status };
      })
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "owner_submit_failed" }));
    return true;
  }
  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => clearStripeFrames(tabId));
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === "loading") clearStripeFrames(tabId);
});

async function captureSession(rawUrl, session) {
  const target = safeUrl(rawUrl);
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, cookie_count: 0, raw_values_returned: false };
  let cookies;
  try { cookies = await chrome.cookies.getAll({ url: target.toString() }); } catch { throw new Error("session_cookie_read_unavailable"); }
  if (!Array.isArray(cookies) || cookies.length > 500) throw new Error("session_cookie_set_too_large");
  return {
    status: "captured",
    origin: target.origin,
    path: target.pathname,
    cookie_count: cookies.length,
    cookies: cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      session: cookie.session,
    })),
    raw_values_returned: true,
    tab_active: false,
    focus_changed: false,
    popup_opened: false,
  };
}

async function termsDiagnostics(rawUrl, session, provider) {
  if (!["ga4", "clarity"].includes(provider)) throw new Error("terms_provider_invalid");
  const target = safeUrl(rawUrl);
  const allowed = provider === "ga4"
    ? target.origin === "https://analytics.google.com" && target.pathname.startsWith("/analytics/web/")
    : target.origin === "https://clarity.microsoft.com" && target.pathname.startsWith("/projects");
  if (!allowed) throw new Error("terms_target_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const result = await sendToContent(state.tab.id, { action: "terms_diagnostics", provider });
  return await finishManaged(state.tab.id, session, result);
}

async function selectGa4Target(rawUrl, session, targetName) {
  const target = safeUrl(rawUrl);
  if (target.origin !== "https://analytics.google.com" || !target.pathname.startsWith("/analytics/web/")) throw new Error("ga4_target_surface_invalid");
  const name = String(targetName ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length > 120 || /[@\n\r]/.test(name)) throw new Error("ga4_target_name_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (boundary) return { status: "human_boundary", human_boundary: boundary.kind, resumable: true, raw_values_returned: false };
  const result = await sendToContent(state.tab.id, { action: "select_ga4_target", target_name: name });
  return await finishManaged(state.tab.id, session, result);
}

async function selectGa4Objective(rawUrl, session, objectiveName) {
  const target = safeUrl(rawUrl);
  if (target.origin !== "https://analytics.google.com" || !target.pathname.startsWith("/analytics/web/")) throw new Error("ga4_objective_surface_invalid");
  const name = String(objectiveName ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length > 120 || /[@\n\r]/.test(name)) throw new Error("ga4_objective_name_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (boundary) return { status: "human_boundary", human_boundary: boundary.kind, resumable: true, raw_values_returned: false };
  const result = await sendToContent(state.tab.id, { action: "select_ga4_objective", objective_name: name });
  return await finishManaged(state.tab.id, session, result);
}

async function openClaritySettings(rawUrl, session) {
  const target = safeUrl(rawUrl);
  if (target.origin !== "https://clarity.microsoft.com" || !target.pathname.startsWith("/projects")) throw new Error("clarity_project_surface_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (boundary) return { status: "human_boundary", human_boundary: boundary.kind, resumable: true, raw_values_returned: false };
  const result = await sendToContent(state.tab.id, { action: "open_clarity_settings" });
  return await finishManaged(state.tab.id, session, result);
}

async function captureGa4MeasurementId(rawUrl, session, route, streamName, domain, identityVerified) {
  const target = safeUrl(rawUrl);
  if (target.origin !== "https://analytics.google.com" || !target.pathname.startsWith("/analytics/web/")) throw new Error("ga4_measurement_surface_invalid");
  const name = String(streamName ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  const site = String(domain ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!route || !name || name.length > 120 || !site || site.length > 253 || /[@\n\r]/.test(name) || /[@\n\r]/.test(site)) throw new Error("ga4_measurement_input_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (boundary) return { status: "human_boundary", human_boundary: boundary.kind, resumable: true, raw_values_returned: false };
  const result = await sendToContent(state.tab.id, { action: "capture_ga4_measurement_id", stream_name: name, domain: site, identity_verified: identityVerified === true });
  return await finishManaged(state.tab.id, session, { ...result, route });
}

async function captureClarityProjectId(rawUrl, session, route, projectName, domain, identityVerified) {
  const target = safeUrl(rawUrl);
  if (target.origin !== "https://clarity.microsoft.com" || !target.pathname.startsWith("/projects")) throw new Error("clarity_project_surface_invalid");
  const name = String(projectName ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  const site = String(domain ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!route || !name || name.length > 120 || !site || site.length > 253 || /[@\n\r]/.test(name) || /[@\n\r]/.test(site)) throw new Error("clarity_capture_input_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (boundary) return { status: "human_boundary", human_boundary: boundary.kind, resumable: true, raw_values_returned: false };
  const pathValue = String(state.path ?? "");
  const pathMatch = pathValue.match(/\/projects\/view\/([A-Za-z0-9_-]{5,64})(?=\/|$)/) ?? pathValue.match(/#\/(a\d+p\d+)(?:\/|$)/);
  const projectIdHint = pathMatch?.[1] ?? "";
  const result = await sendToContent(state.tab.id, { action: "capture_clarity_project_id", project_name: name, domain: site, identity_verified: identityVerified === true, project_id_hint: projectIdHint });
  return await finishManaged(state.tab.id, session, { ...result, route });
}

async function openClarityProject(rawUrl, session, projectName) {
  const target = safeUrl(rawUrl);
  if (target.origin !== "https://clarity.microsoft.com" || !target.pathname.startsWith("/projects")) throw new Error("clarity_project_surface_invalid");
  const name = String(projectName ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length > 120 || /[@\n\r]/.test(name)) throw new Error("clarity_project_name_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (boundary) return { status: "human_boundary", human_boundary: boundary.kind, resumable: true, raw_values_returned: false };
  const result = await sendToContent(state.tab.id, { action: "open_clarity_project", project_name: name });
  return await finishManaged(state.tab.id, session, result);
}

async function clarityProjectIdentity(rawUrl, session, projectName, domain) {
  const target = safeUrl(rawUrl);
  if (target.origin !== "https://clarity.microsoft.com" || !target.pathname.startsWith("/projects")) throw new Error("clarity_project_surface_invalid");
  const name = String(projectName ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  const site = String(domain ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length > 120 || !site || site.length > 253 || /[@\n\r]/.test(name) || /[@\n\r]/.test(site)) throw new Error("clarity_identity_input_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, raw_values_returned: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (boundary) return { status: "human_boundary", human_boundary: boundary.kind, resumable: true, raw_values_returned: false };
  const result = await sendToContent(state.tab.id, { action: "clarity_project_identity", project_name: name, domain: site });
  const currentPath = String(state.path ?? "");
  const pathIdentity = /\/projects\/view\/[A-Za-z0-9_-]{5,64}(?:\/|$)/.test(currentPath)
    || /#\/a\d+p\d+(?:\/|$)/.test(currentPath);
  const identity = pathIdentity
    ? {
        ...result,
        project_card_count: Math.max(Number(result?.project_card_count ?? 0), 1),
        project_id_readback: true,
        distinct_identity_verified: result?.project_name_match === true && result?.domain_match === true,
      }
    : result;
  return await finishManaged(state.tab.id, session, identity);
}

async function acceptStandardTerms(rawUrl, session, provider, delegated) {
  if (delegated !== true) throw new Error("terms_delegation_required");
  if (!["ga4", "clarity"].includes(provider)) throw new Error("terms_provider_invalid");
  const target = safeUrl(rawUrl);
  const allowed = provider === "ga4"
    ? target.origin === "https://analytics.google.com" && target.pathname.startsWith("/analytics/web/")
    : target.origin === "https://clarity.microsoft.com" && target.pathname.startsWith("/projects");
  if (!allowed) throw new Error("terms_target_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, tab_active: false, focus_changed: false, popup_opened: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (!boundary || boundary.kind !== "terms") {
    return { status: "terms_boundary_missing", tab_active: false, focus_changed: false, popup_opened: false };
  }
  const result = await sendToContent(state.tab.id, { action: "accept_standard_terms", provider });
  return await finishManaged(state.tab.id, session, result);
}

async function acceptOwnerAuthorizedTerms(rawUrl, session, provider, delegated, confirmed) {
  if (delegated !== true || confirmed !== true) throw new Error("owner_terms_confirmation_required");
  if (!["ga4", "clarity"].includes(provider)) throw new Error("terms_provider_invalid");
  const target = safeUrl(rawUrl);
  const allowed = provider === "ga4"
    ? target.origin === "https://analytics.google.com" && target.pathname.startsWith("/analytics/web/")
    : target.origin === "https://clarity.microsoft.com" && target.pathname.startsWith("/projects");
  if (!allowed) throw new Error("terms_target_invalid");
  const state = await ensureTab(target.toString(), false, session);
  if (state.status !== "ready") {
    return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, tab_active: false, focus_changed: false, popup_opened: false };
  }
  const page = await sendToContent(state.tab.id, { action: "page" });
  const boundary = globalThis.spiralDetectHumanBoundary?.(page);
  if (!boundary || boundary.kind !== "terms") {
    return { status: "terms_boundary_missing", tab_active: false, focus_changed: false, popup_opened: false };
  }
  const result = await sendToContent(state.tab.id, { action: "accept_owner_authorized_terms", provider });
  return await finishManaged(state.tab.id, session, result);
}

async function handle(command) {
  if (!command || command.protocol !== PROTOCOL) throw new Error("protocol_invalid");
  if (requiresFinancialConfirmation(command) && command.owner_confirmed !== true) throw new Error("financial_confirmation_required");
  const session = managedSession(command);
  if (command.action !== "status") {
    await chrome.storage.session.set({ [activityKey(session)]: Date.now() });
  }
  if (command.action === "status") {
    const ids = await hydrateManagedTabs(session);
    const activation = await chrome.storage.session.get(activationKey(session));
    return {
      status: "ready",
      runtime_version: 127,
      managed_tab_count: ids.length,
      managed_group: await managedGroupReadback(ids, groupTitle(session)),
      trusted_activation_pending: Boolean(activation[activationKey(session)]),
      allowed_origins: ["http://*/*", "https://*/*"],
      focus_operations: false,
      popup_ui: false,
      cookie_permission: true,
      debugger_permission: true,
      full_page_screenshot: true,
      self_repair: true,
    };
  }
  if (command.action === "close_group") {
    // Session teardown: close every managed tab in this session's group and
    // clear the group storage so no tab-group residue survives the Session.
    const ids = await managedTabIds(session);
    let closed = 0;
    for (const id of ids) {
      try {
        const tab = await chrome.tabs.get(id);
        if (tab?.id) {
          await chrome.tabs.remove(tab.id);
          clearStripeFrames(tab.id);
          closed += 1;
        }
      } catch { /* already closed */ }
    }
    await forgetGroup(session);
    return {
      status: "group_closed",
      runtime_version: 127,
      closed_tab_count: closed,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "repair") {
    const activation = await chrome.storage.session.get(activationKey(session));
    if (activation[activationKey(session)]) {
      try { await restoreManagedTab(session, command.url ?? "https://invalid.local/"); }
      catch { throw new Error("repair_trusted_activation_recovery_failed"); }
    }
    const retained = [];
    for (const id of await managedTabIds(session)) {
      try {
        const tab = await chrome.tabs.get(id);
        if (!tab.id || !tab.url || !NORMAL_WEB_PROTOCOLS.has(new URL(tab.url).protocol)) continue;
        retained.push(tab.id);
        await chrome.tabs.reload(tab.id, { bypassCache: false });
      } catch { /* stale tab */ }
    }
    await chrome.storage.session.set({ [tabKey(session)]: retained });
    await chrome.storage.session.remove(activationKey(session));
    setTimeout(() => chrome.runtime.reload(), 500);
    return {
      status: "reload_queued",
      runtime_version: 127,
      retained_tab_count: retained.length,
      reloaded_tab_count: retained.length,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "hot_reload") {
    const activation = await chrome.storage.session.get(activationKey(session));
    if (activation[activationKey(session)]) {
      try { await restoreManagedTab(session, command.url ?? "https://invalid.local/"); }
      catch { throw new Error("repair_trusted_activation_recovery_failed"); }
    }
    const retained = [];
    for (const id of await managedTabIds(session)) {
      try {
        const tab = await chrome.tabs.get(id);
        if (!tab.id || !tab.url || !NORMAL_WEB_PROTOCOLS.has(new URL(tab.url).protocol)) continue;
        retained.push(tab.id);
        await chrome.tabs.reload(tab.id, { bypassCache: true });
      } catch { /* stale tab */ }
    }
    await chrome.storage.session.set({ [tabKey(session)]: retained });
    await chrome.storage.session.remove(activationKey(session));
    setTimeout(() => chrome.runtime.reload(), 300);
    return {
      status: "hot_reload_dispatched",
      runtime_version: 127,
      retained_tab_count: retained.length,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "reload_page") {
    const state = await ensureTab(command.url, false, session);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, tab_active: false, focus_changed: false, popup_opened: false };
    }
    await chrome.tabs.reload(state.tab.id, { bypassCache: command.bypass_cache === true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    return await finishManaged(state.tab.id, session, { action: "reload_page", status: "reloaded" });
  }
  if (
    command.action === "evaluate_script"
    || command.action === "read_console"
    || command.action === "read_network"
    || command.action === "read_storage"
    || command.action === "set_storage"
    || command.action === "clear_storage"
    || command.action === "wait_for"
    || command.action === "fill_form"
    || command.action === "inspect_element"
    || command.action === "annotate"
    || command.action === "read_markdown"
    || command.action === "performance_metrics"
    || command.action === "hover"
    || command.action === "scroll"
    || command.action === "press_key"
    || command.action === "drag_and_drop"
    || command.action === "upload_file"
  ) {
    const state = await ensureTab(command.url, false, session);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, tab_active: false, focus_changed: false, popup_opened: false };
    }
    const result = await sendToContent(state.tab.id, command);
    return await finishManaged(state.tab.id, session, result);
  }
  if (command.action === "read_cookies") {
    const targetUrl = command.url || "";
    let cookies = [];
    try {
      cookies = targetUrl ? await chrome.cookies.getAll({ url: targetUrl }) : await chrome.cookies.getAll({});
    } catch {}
    const safe = (cookies || []).slice(0, 100).map((c) => ({
      name: c.name,
      domain: c.domain,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      session: c.session,
      expirationDate: c.expirationDate,
    }));
    return { action: "read_cookies", count: (cookies || []).length, cookies: safe };
  }
  if (command.action === "clear_cookies") {
    const targetUrl = command.url || "";
    let cookies = [];
    try {
      cookies = targetUrl ? await chrome.cookies.getAll({ url: targetUrl }) : await chrome.cookies.getAll({});
    } catch {}
    let removed = 0;
    for (const c of cookies || []) {
      try {
        const cookieUrl = (c.secure ? "https://" : "http://") + c.domain.replace(/^\./, "") + c.path;
        await chrome.cookies.remove({ url: cookieUrl, name: c.name });
        removed++;
      } catch {}
    }
    return { action: "clear_cookies", removed_count: removed };
  }
  if (command.action === "capture_pdf") {
    const state = await ensureTab(command.url, false, session);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, tab_active: false, focus_changed: false, popup_opened: false };
    }
    try {
      await chrome.debugger.attach({ tabId: state.tab.id }, "1.3");
      try {
        const pdfRes = await chrome.debugger.sendCommand({ tabId: state.tab.id }, "Page.printToPDF", {
          landscape: false,
          displayHeaderFooter: false,
          printBackground: true,
          preferCSSPageSize: true,
        });
        return await finishManaged(state.tab.id, session, {
          action: "capture_pdf",
          status: "captured",
          pdf_base64: pdfRes.data,
          bytes: Math.round((pdfRes.data.length * 3) / 4),
        });
      } finally {
        try { await chrome.debugger.detach({ tabId: state.tab.id }); } catch {}
      }
    } catch (err) {
      return await finishManaged(state.tab.id, session, {
        action: "capture_pdf",
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  if (command.action === "cdp_click") {
    if (command.owner_confirmed !== true) throw new Error("cdp_click_requires_owner_confirmation");
    const state = await ensureTab(command.url, false, session, true);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, focus_changed: false, popup_opened: false };
    }
    const x = Number(command.client_x);
    const y = Number(command.client_y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 100_000 || Math.abs(y) > 100_000) throw new Error("cdp_click_point_invalid");
    await sendToContent(state.tab.id, { action: "point_click", client_x: x, client_y: y });
    const managed = await chrome.tabs.get(state.tab.id);
    return {
      status: "cdp_click_dispatched",
      client_x: x,
      client_y: y,
      tab_active: managed.active,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "cdp_scroll") {
    if (command.owner_confirmed !== true) throw new Error("cdp_scroll_requires_owner_confirmation");
    const state = await ensureTab(command.url, false, session, true);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, focus_changed: false, popup_opened: false };
    }
    const deltaX = Number(command.delta_x ?? 0);
    const deltaY = Number(command.delta_y ?? 0);
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || Math.abs(deltaX) > 100_000 || Math.abs(deltaY) > 100_000) {
      throw new Error("cdp_scroll_delta_invalid");
    }
    const x = Number.isFinite(Number(command.client_x)) ? Number(command.client_x) : 0;
    const y = Number.isFinite(Number(command.client_y)) ? Number(command.client_y) : 0;
    await sendToContent(state.tab.id, { action: "wheel", client_x: x, client_y: y, delta_x: deltaX, delta_y: deltaY });
    const managed = await chrome.tabs.get(state.tab.id);
    return {
      status: "cdp_scroll_dispatched",
      delta_x: deltaX,
      delta_y: deltaY,
      tab_active: managed.active,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "cdp_hover") {
    if (command.owner_confirmed !== true) throw new Error("cdp_hover_requires_owner_confirmation");
    const state = await ensureTab(command.url, false, session, true);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, focus_changed: false, popup_opened: false };
    }
    const x = Number(command.client_x);
    const y = Number(command.client_y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 100_000 || Math.abs(y) > 100_000) {
      throw new Error("cdp_hover_point_invalid");
    }
    await sendToContent(state.tab.id, { action: "hover", client_x: x, client_y: y });
    const managed = await chrome.tabs.get(state.tab.id);
    return {
      status: "cdp_hover_dispatched",
      client_x: x,
      client_y: y,
      tab_active: managed.active,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "cdp_key") {
    if (command.owner_confirmed !== true) throw new Error("cdp_key_requires_owner_confirmation");
    const state = await ensureTab(command.url, false, session, true);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, focus_changed: false, popup_opened: false };
    }
    const key = String(command.key ?? "");
    await sendToContent(state.tab.id, { action: "key", key });
    const managed = await chrome.tabs.get(state.tab.id);
    return {
      status: "cdp_key_dispatched",
      key,
      tab_active: managed.active,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "capture_session") {
    return await captureSession(command.url, session);
  }
  if (command.action === "capture_screenshot") {
    const state = await ensureTab(command.url, command.navigate ?? true, session, true);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, focus_changed: false, popup_opened: false };
    }
    await assertInsideManagedGroup(state.tab, session);
    if (command.long === true) {
      return await globalThis.spiralCaptureManagedLongScreenshot(state.tab.id, command.url);
    }
    let clip = undefined;
    if (command.selector) {
      try {
        const inspected = await sendToContent(state.tab.id, { action: "inspect_element", selector: command.selector });
        if (inspected?.found && inspected.rect) {
          clip = {
            x: Math.max(0, inspected.rect.x),
            y: Math.max(0, inspected.rect.y),
            width: Math.max(1, inspected.rect.width),
            height: Math.max(1, inspected.rect.height),
          };
        }
      } catch {}
    }
    return await globalThis.spiralCaptureManagedScreenshot(state.tab.id, command.url, clip);
  }
  if (command.action === "emulate") {
    const state = await ensureTab(command.url, false, session, true);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, focus_changed: false, popup_opened: false };
    }
    await assertInsideManagedGroup(state.tab, session);
    const tabId = state.tab.id;
    const width = Number.isInteger(command.width) && command.width > 0 ? command.width : undefined;
    const height = Number.isInteger(command.height) && command.height > 0 ? command.height : undefined;
    const colorScheme = command.color_scheme === "dark" || command.color_scheme === "light" ? command.color_scheme : undefined;
    const mobile = command.mobile === true;

    try {
      let attached = false;
      try {
        await chrome.debugger.attach({ tabId }, "1.3");
        attached = true;
      } catch (err) {
        if (!/already attached/i.test(String(err))) throw err;
      }
      if (width && height) {
        await chrome.debugger.sendCommand({ tabId }, "Emulation.setDeviceMetricsOverride", {
          width,
          height,
          deviceScaleFactor: command.device_scale_factor || 1,
          mobile,
        });
      }
      if (colorScheme) {
        await chrome.debugger.sendCommand({ tabId }, "Emulation.setEmulatedMedia", {
          media: "screen",
          features: [{ name: "prefers-color-scheme", value: colorScheme }],
        });
      }
      if (attached) {
        await chrome.debugger.detach({ tabId }).catch(() => {});
      }
    } catch {}

    return {
      action: "emulate",
      status: "emulated",
      width,
      height,
      color_scheme: colorScheme,
      mobile,
      tab_active: state.tab.active === true,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "activate") {
    const tab = await existingManagedTab(new URL(command.url).origin, session);
    if (!tab) throw new Error("activate_managed_tab_missing");
    return await activateManagedTab(tab, command.url, session, command.foreground_confirmed === true);
  }
  if (command.action === "restore_background") {
    return await restoreManagedTab(session, command.url);
  }
  if (command.action === "terms_diagnostics") {
    return await termsDiagnostics(command.url, session, command.provider);
  }
  if (command.action === "select_ga4_target") {
    return await selectGa4Target(command.url, session, command.target_name);
  }
  if (command.action === "select_ga4_objective") {
    return await selectGa4Objective(command.url, session, command.objective_name);
  }
  if (command.action === "open_clarity_settings") {
    return await openClaritySettings(command.url, session);
  }
  if (command.action === "capture_ga4_measurement_id") {
    return await captureGa4MeasurementId(command.url, session, command.route, command.stream_name, command.domain, command.identity_verified);
  }
  if (command.action === "capture_clarity_project_id") {
    return await captureClarityProjectId(command.url, session, command.route, command.project_name, command.domain, command.identity_verified);
  }
  if (command.action === "open_clarity_project") {
    return await openClarityProject(command.url, session, command.project_name);
  }
  if (command.action === "clarity_project_identity") {
    return await clarityProjectIdentity(command.url, session, command.project_name, command.domain);
  }
  if (command.action === "accept_standard_terms") {
    return await acceptStandardTerms(command.url, session, command.provider, command.owner_terms_delegated);
  }
  if (command.action === "accept_owner_authorized_terms") {
    return await acceptOwnerAuthorizedTerms(command.url, session, command.provider, command.owner_terms_delegated, command.owner_confirmed);
  }
  // Conflict control is group membership: operate the Session tab-group,
  // including a managed tab the Owner is already viewing. Never touch a
  // tab outside that group. New tabs stay inactive so they cannot displace
  // a foreign page.
  const readOnly = ["read_text", "read_styles", "read_scripts", "controls", "semantic_snapshot", "disassemble"].includes(command.action);
  const state = await ensureTab(command.url, command.action === "open" || command.navigate === true, session, command.allow_active === true || readOnly);
  if (state.status !== "ready") {
    return {
      status: state.status,
      human_boundary: state.human_boundary ?? null,
      resumable: state.resumable === true,
      focus_changed: false,
      popup_opened: false,
    };
  }
  if (command.action === "open") {
    return {
      status: "ready",
      origin: state.origin,
      path: state.path,
      tab_active: false,
      focus_changed: false,
      popup_opened: false,
    };
  }
  await assertInsideManagedGroup(state.tab, session);
  if (!readOnly && FINANCIAL_ACTION.test(command.name ?? command.field ?? "")) {
    if (command.owner_confirmed !== true) throw new Error("financial_action_unconfirmed");
  }
  let result;
  if (command.action === "controls") {
    const page = await pageFromFrames(state.tab.id, state.origin);
    const boundary = globalThis.spiralDetectHumanBoundary?.(page);
    result = boundary
      ? { ...page, human_boundary: boundary.kind, human_boundary_observed: boundary.kind, human_boundary_mutated: false, ...(boundary.kind === "terms" ? { owner_authorized_terms: true } : {}) }
      : page;
  } else if (command.action === "read_text") {
    const page = await pageFromFrames(state.tab.id, state.origin);
    const boundary = globalThis.spiralDetectHumanBoundary?.(page);
    const background = state.tab.active !== true;
    const sendRead = (awakened) => sendToContent(state.tab.id, {
      action: "read_text",
      max_chars: command.max_chars,
      read_mode: command.read_mode === "advisor_reply" ? "advisor_reply" : undefined,
      long: command.long,
      background,
      awakened: awakened === true,
    }, 0, 2, 100_000);
    const text = background
      ? await awakenBackgroundPage(state.tab.id, sendRead)
      : await sendRead(false);
    result = boundary
      ? { ...text, human_boundary: boundary.kind, human_boundary_observed: boundary.kind, human_boundary_mutated: false, ...(boundary.kind === "terms" ? { owner_authorized_terms: true } : {}) }
      : text;
  } else if (command.action === "semantic_snapshot") {
    const state = await ensureTab(command.url, false, session, true);
    if (state.status !== "ready") {
      return { status: state.status, human_boundary: state.human_boundary ?? null, resumable: state.resumable === true, focus_changed: false, popup_opened: false };
    }
    const snapshot = await sendToContent(state.tab.id, { action: "semantic_snapshot", max_elements: command.max_elements ?? 60 });
    return { status: "semantic_snapshot", tab_active: false, focus_changed: false, popup_opened: false, ...snapshot };
  } else if (command.action === "disassemble") {
    result = await sendToContent(state.tab.id, { action: "disassemble", max_sections: command.max_sections });
  } else if (command.action === "read_styles") {
    result = await sendToContent(state.tab.id, { action: "read_styles" });
  } else if (command.action === "read_scripts") {
    result = await sendToContent(state.tab.id, { action: "read_scripts" });
  } else if (command.action === "capture_clarity_token") {
    if (state.origin !== "https://clarity.microsoft.com") throw new Error("clarity_token_origin_invalid");
    result = await sendToContent(state.tab.id, { action: "capture_clarity_token" });
  } else if (command.action === "click") {
    result = await sendToContent(state.tab.id, {
      action: "click",
      role: command.role,
      name: command.name,
      selector: command.selector,
      context: command.context,
      screen_x: command.screen_x,
      screen_y: command.screen_y,
      foreground_confirmed: command.foreground_confirmed === true,
    });
  } else if (command.action === "fill") {
    result = await sendToContent(state.tab.id, {
      action: "fill",
      field: command.field,
      selector: command.selector,
      value: command.value,
      multiline_public: command.multiline_public === true,
      context: command.context,
    });
  } else if (command.action === "press_enter") {
    result = await sendToContent(state.tab.id, {
      action: "press_enter",
      field: command.field,
      selector: command.selector,
      context: command.context,
    });
  } else if (command.action === "select_combobox") {
    result = await sendToContent(state.tab.id, {
      action: "select_combobox",
      field: command.field,
      selector: command.selector,
      value: command.value,
      context: command.context,
    });
  } else {
    throw new Error("action_invalid");
  }
  return await finishManaged(state.tab.id, session, result);
}

function connect() {
  clearTimeout(reconnectTimer);
  if (port) return;
  let connection;
  try { connection = chrome.runtime.connectNative(HOST); }
  catch {
    reconnectTimer = setTimeout(connect, 5_000);
    return;
  }
  port = connection;
  connection.onMessage.addListener(async (message) => {
    if (message?.kind === "reload") {
      try {
        await injectContentScriptsIntoOpenTabs();
        chrome.runtime.reload();
      } catch {}
      return;
    }
    if (message?.kind === "owner_submit_result" && typeof message.id === "string") {
      const waiter = ownerSubmitWaiters.get(message.id);
      if (waiter) {
        ownerSubmitWaiters.delete(message.id);
        waiter(message);
      }
      return;
    }
    if (message?.kind !== "command" || typeof message.id !== "string") return;
    try {
      const result = await handle(message.command);
      connection.postMessage({ kind: "response", id: message.id, ok: true, result });
    } catch (error) {
      connection.postMessage({
        kind: "response",
        id: message.id,
        ok: false,
        error: error instanceof Error ? error.message : "browser_failure",
      });
    }
  });
  connection.onDisconnect.addListener(() => {
    if (port === connection) port = undefined;
    reconnectTimer = setTimeout(connect, 2_000);
  });
  connection.postMessage({ kind: "ready", protocol: PROTOCOL });
}

async function injectContentScriptsIntoOpenTabs() {
  if (!chrome.scripting || !chrome.tabs) return;
  try {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ["text.js", "long-capture.js", "annotation.js", "content.js"],
        });
      } catch {}
    }
  } catch {}
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  let url;
  try { url = safeForegroundUrl(tab.url); } catch { return; }
  const parsed = new URL(url);
  await chrome.storage.session.set({
    [FOREGROUND_SCREENSHOT_KEY]: {
      tab_id: tab.id,
      origin: parsed.origin,
      pathname: parsed.pathname,
      granted_at: Date.now(),
    },
  });
});

chrome.runtime.onInstalled.addListener(() => {
  connect();
  void injectContentScriptsIntoOpenTabs();
});
chrome.runtime.onStartup.addListener(connect);
connect();
void injectContentScriptsIntoOpenTabs();
