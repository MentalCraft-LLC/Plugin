(() => {
  const PROTOCOL = "spiral.browser.v1";
  const SAFE_CONTROL_TERM = /(?:admin|account|property|access|management|user|add|invite|next|continue|save|done|settings|data export|generate|api token|token|new project|website|project|create|editor|role|cancel|confirm|analytics|clarity|search|select|menu|more|close|submit|name|domain|url|管理|账号|帐户|账户|资源|访问权限|用户|添加|邀请|下一步|继续|保存|完成|设置|数据导出|生成|令牌|新建项目|网站|项目|创建|编辑者|角色|取消|确认|搜索|选择|菜单|更多|关闭|提交|名称|域名|网址|开始衡量|开始使用|Google products|Google 产品|products-and-services|benchmarking|基准化分析|建模贡献|modeling contributions|business insights|业务洞见|业务洞察|technical support|技术支持|account specialists|账号专家|帐户专家|数据共享|industry|行业|other|其他|time zone|timezone|时区|currency|币种|货币|UTC|USD|U\.S\. Dollar|business|业务|企业|company size|规模|objective|目标|terms|条款|accept|接受|同意|platform|平台|web stream|数据流|small|employees|小型|1 至 10 名员工|user engagement|retention|behavior|用户互动度|留存率)/i;
  const EQUIVALENT_FORM_OPENER = /^(?:add new project|new project|添加新项目|新建项目)$/i;
  const STANDARD_TERMS_LABEL = /^(?:(?:I\s+)?(?:accept|agree(?:\s+to)?)(?:\s+the)?\s+(?:(?:Google\s+Analytics|Microsoft\s+Clarity)\s+)?(?:terms(?:\s+of\s+service)?|terms\s+of\s+use|service\s+terms)|(?:accept|agree)\s+terms(?:\s+of\s+service)?|(?:同意|接受)(?:\s+(?:Google\s+Analytics|Microsoft\s+Clarity))?\s*(?:服务条款|条款)|Google\s+Analytics\s+(?:Terms\s+of\s+Service|服务条款)|Microsoft\s+Clarity\s+(?:Terms\s+of\s+Use|条款))$/i;
  const TERMS_SIGNAL = /terms(?:\s+of\s+(?:service|use))?|service\s+terms|privacy\s+policy|agree|accept|条款|服务协议|隐私政策|同意|接受/i;
  const GA_DATA_SHARING_ID = /^data-sharing-(?:products-and-services|benchmarking|technical-support|account-specialists-hide-sales)$/;
  const GA_SMALL_BUSINESS = /^(?:小型 - 1 至 10 名员工|Small - 1 to 10 employees)$/i;
  const GA_BEHAVIOR_OBJECTIVE = /^(?:查看用户互动度和留存率|Examine user behavior)$/i;
  const GA_OBJECTIVES = [
    { label: "发掘潜在客户", pattern: /发掘潜在客户|获取潜在客户|generate leads|get more leads|lead generation/i },
    { label: "推动在线销售", pattern: /推动在线销售|drive online sales|online sales/i },
    { label: "提高品牌知名度", pattern: /提高品牌知名度|raise brand awareness|brand awareness/i },
    { label: "查看用户互动度和留存率", pattern: /查看用户互动度和留存率|examine user behavior|user behavior|retention/i },
    { label: "其他业务活动", pattern: /其他业务活动|other business activities/i },
  ];
  const GA_OBJECTIVE_HELP = /(?:^|[：: ])(?:关于|about).*(?:业务目标|objective|提示|help|tooltip)/i;
  const GA_OBJECTIVE_PATH = "/analytics/web/";
  const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const TOKEN = /\b(?:ya29\.[A-Za-z0-9._~-]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g;
  const CLARITY_API_TOKEN = /^[A-Za-z0-9_-]{8,2048}\.[A-Za-z0-9_-]{8,4096}\.[A-Za-z0-9_-]{8,4096}$/;
  const OPAQUE_CONTROL_NAME = /^(?:react-aria|react-select|radix-|headlessui-|:r)[A-Za-z0-9:_-]*$/i;

  function normalize(value) {
    return String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  }

  function redact(value) {
    return normalize(value).replace(EMAIL, "[identity]").replace(TOKEN, "[secret]");
  }

  const MAX_CONSOLE_RECORDS = 100;
  const consoleRecords = (window.__spiralConsoleRecords = window.__spiralConsoleRecords || []);
  if (!window.__spiralConsoleHooked) {
    window.__spiralConsoleHooked = true;
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    function captureLog(level, args) {
      try {
        const text = args.map((arg) => {
          if (arg instanceof Error) {
            return `${arg.name || "Error"}: ${arg.message}${arg.stack ? `\n${arg.stack.slice(0, 500)}` : ""}`;
          }
          if (typeof arg === "object" && arg !== null) {
            try { return JSON.stringify(arg); } catch { return String(arg); }
          }
          return String(arg);
        }).join(" ");
        consoleRecords.push({
          level,
          text: redact(text).slice(0, 2000),
          timestamp: Date.now(),
        });
        if (consoleRecords.length > MAX_CONSOLE_RECORDS) consoleRecords.shift();
      } catch {}
    }
    console.log = (...args) => { captureLog("info", args); return originalLog.apply(console, args); };
    console.warn = (...args) => { captureLog("warn", args); return originalWarn.apply(console, args); };
    console.error = (...args) => { captureLog("error", args); return originalError.apply(console, args); };
    window.addEventListener("error", (event) => {
      captureLog("error", [event.message || "uncaught error", event.filename, event.lineno]);
    });
    window.addEventListener("unhandledrejection", (event) => {
      captureLog("error", ["unhandledrejection:", event.reason]);
    });
  }

  const MAX_NETWORK_RECORDS = 100;
  const networkRecords = (window.__spiralNetworkRecords = window.__spiralNetworkRecords || []);
  let inFlightRequests = (window.__spiralInFlightRequests = window.__spiralInFlightRequests || 0);

  if (!window.__spiralNetworkHooked) {
    window.__spiralNetworkHooked = true;
    const origFetch = window.fetch;
    if (typeof origFetch === "function") {
      window.fetch = async function(...args) {
        const start = Date.now();
        inFlightRequests++;
        const rawUrl = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "unknown";
        const method = (args[1] && args[1].method) || (args[0] && args[0].method) || "GET";
        try {
          const res = await origFetch.apply(this, args);
          networkRecords.push({
            url: redact(rawUrl).slice(0, 300),
            method: String(method).toUpperCase(),
            status: res.status,
            duration_ms: Date.now() - start,
            timestamp: Date.now(),
            type: "fetch",
          });
          if (networkRecords.length > MAX_NETWORK_RECORDS) networkRecords.shift();
          return res;
        } catch (err) {
          networkRecords.push({
            url: redact(rawUrl).slice(0, 300),
            method: String(method).toUpperCase(),
            status: 0,
            error: redact(err instanceof Error ? err.message : String(err)),
            duration_ms: Date.now() - start,
            timestamp: Date.now(),
            type: "fetch",
          });
          if (networkRecords.length > MAX_NETWORK_RECORDS) networkRecords.shift();
          throw err;
        } finally {
          inFlightRequests = Math.max(0, inFlightRequests - 1);
        }
      };
    }

    const OrigXHR = window.XMLHttpRequest;
    if (typeof OrigXHR === "function") {
      const origOpen = OrigXHR.prototype.open;
      const origSend = OrigXHR.prototype.send;
      OrigXHR.prototype.open = function(method, url, ...rest) {
        this.__spiralMethod = method;
        this.__spiralUrl = url;
        return origOpen.apply(this, [method, url, ...rest]);
      };
      OrigXHR.prototype.send = function(...args) {
        const start = Date.now();
        inFlightRequests++;
        this.addEventListener("loadend", () => {
          inFlightRequests = Math.max(0, inFlightRequests - 1);
          networkRecords.push({
            url: redact(this.__spiralUrl || "").slice(0, 300),
            method: String(this.__spiralMethod || "GET").toUpperCase(),
            status: this.status,
            duration_ms: Date.now() - start,
            timestamp: Date.now(),
            type: "xhr",
          });
          if (networkRecords.length > MAX_NETWORK_RECORDS) networkRecords.shift();
        });
        return origSend.apply(this, args);
      };
    }
  }

  async function pageText(maxChars, mode, longFlag, backgroundFlag, awakenedFlag) {
    const limit = Number.isInteger(maxChars) && maxChars > 0 && maxChars <= 100000 ? maxChars : 20000;
    const boundPublicText = globalThis.spiralBoundPublicText;
    if (typeof boundPublicText !== "function") throw new Error("public_text_boundary_unavailable");
    const advisorReply = mode === "advisor_reply";
    if (!advisorReply && typeof globalThis.spiralLongRead === "function") {
      const scroller = globalThis.spiralPrimaryScroller?.(document, window);
      if (globalThis.spiralShouldLongRead?.(longFlag, scroller, window)) {
        return await globalThis.spiralLongRead({
          document,
          window,
          boundPublicText,
          maxChars: limit,
          background: backgroundFlag === true,
          awakened: awakenedFlag === true,
        });
      }
    }
    const composers = advisorReply
      ? controlElements().filter((element) => elementRole(element) === "textbox" && elementContext(element) === "main")
      : [];
    const conversation = composers.length === 1 ? composers[0].closest("main, [role='main']") : null;
    const root = conversation ?? (document.body ?? document.documentElement);
    const parts = [];
    let chars = 0;
    let visits = 0;
    const seen = new WeakSet();
    function append(raw) {
      const separator = parts.length ? 1 : 0;
      const remaining = limit - chars - separator;
      if (remaining <= 0) return;
      const value = boundPublicText(raw, remaining);
      if (!value.trim()) return;
      parts.push(value);
      chars += separator + value.length;
    }
    function walk(root) {
      const children = root.children ?? [];
      for (const child of children) {
        if (!(child instanceof HTMLElement)) continue;
        if (seen.has(child)) continue;
        seen.add(child);
        visits += 1;
        if (visits > 4000) return;
        if (child instanceof HTMLInputElement || child instanceof HTMLTextAreaElement || child instanceof HTMLSelectElement) {
          if (child.type === "password") continue; // never expose secret values
          const placeholder = child.getAttribute("placeholder");
          if (placeholder) append(`[input:${redact(placeholder)}]`);
          continue;
        }
        const tag = child.tagName.toLowerCase();
        if (["script", "style", "noscript", "iframe", "svg", "canvas", "template"].includes(tag)) continue;
        const direct = [...child.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent ?? "")
          .join(" ");
        if (direct.trim()) append(direct);
        if (chars >= limit) return;
        walk(child);
      }
    }
    walk(root);
    const text = parts.join("\n");
    const bounded = advisorReply ? text.slice(-limit) : text.slice(0, limit);
    return { action: "read_text", chars: bounded.length, text: bounded, value_returned: true };
  }

  // Semantic snapshot (2026-08-15, Owner-driven browser enhancement): a
  // compact structured view aligned with agent-first browsers (ego lite's
  // semantic snapshot). Unlike read_text (plain text dump), it returns
  // deduplicated visible headings/text plus interactive elements with their
  // roles and states — the minimum an agent needs to decide the next action,
  // at a fraction of the tokens. Shadow DOM is walked deeply; password and
  // secret values are never exposed.
  function semanticSnapshot(maxElements) {
    const limit = Number.isInteger(maxElements) && maxElements > 0 && maxElements <= 200 ? maxElements : 60;
    const seen = new Set();
    const headings = [];
    const texts = [];
    const controls = [];
    const interactiveElements = [];
    const appendUnique = (arr, value) => {
      const key = value.trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        arr.push(value.trim());
      }
    };
    const shortLabel = (el) => {
      const aria = el.getAttribute("aria-label");
      if (aria) return aria.replace(/\s+/g, " ").slice(0, 120);
      let text = "";
      for (const node of el.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        text += node.textContent ?? "";
        if (text.length >= 120) break;
      }
      return text.replace(/\s+/g, " ").trim().slice(0, 120);
    };
    const walk = (root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      const elements = root.querySelectorAll("h1, h2, h3, h4, button, a, input, textarea, select, [role], [aria-label], [data-testid], [data-slot]");
      let index = 0;
      for (const el of elements) {
        index += 1;
        if (index > 400) break;
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute("role") || elementRole(el);
        const label = shortLabel(el);
        const slot = el.getAttribute("data-slot");
        let computedSelector = el.id ? `#${el.id}` : tag;
        if (slot) computedSelector += `[data-slot="${slot}"]`;
        else if (el.className && typeof el.className === "string") {
          const firstCls = el.className.trim().split(/\s+/)[0];
          if (firstCls) computedSelector += `.${firstCls}`;
        }

        if (tag.startsWith("h") && tag.length === 2) {
          appendUnique(headings, `${tag}: ${label}`);
        } else if (tag === "button" || tag === "a" || role === "button" || role === "link" || role === "tab" || role === "menuitem") {
          appendUnique(controls, `[${role || tag}] ${label}`);
          if (interactiveElements.length < limit) {
            interactiveElements.push({
              tag,
              role: role || tag,
              name: label,
              selector: computedSelector,
              data_slot: slot || undefined,
              disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true",
            });
          }
        } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
          if (el.type === "password") continue;
          const state = el.disabled ? "disabled" : "enabled";
          appendUnique(controls, `[input:${el.type || "text"}:${state}] ${el.getAttribute("placeholder") || label}`);
          if (interactiveElements.length < limit) {
            interactiveElements.push({
              tag,
              role: "textbox",
              name: el.getAttribute("placeholder") || label,
              selector: computedSelector,
              type: el.type || "text",
              disabled: el.disabled === true,
            });
          }
        } else if (label) {
          appendUnique(texts, label);
        }
        if (controls.length + headings.length >= limit) break;
      }
      if (controls.length + headings.length >= limit) return;
      const hosts = root.querySelectorAll("*");
      let scanned = 0;
      for (const host of hosts) {
        scanned += 1;
        if (scanned > 800) break;
        if (host.shadowRoot) walk(host.shadowRoot);
        if (controls.length + headings.length >= limit) break;
      }
    };
    walk(document);
    return {
      action: "semantic_snapshot",
      url: location.href,
      title: document.title,
      headings: headings.slice(0, limit),
      controls: controls.slice(0, limit),
      texts: texts.slice(0, Math.round(limit / 2)),
      interactive_elements: interactiveElements.slice(0, limit),
      value_returned: true,
    };
  }

  function knownGaObjective(value) {
    const text = normalize(value);
    if (GA_OBJECTIVE_HELP.test(text)) return "";
    return GA_OBJECTIVES.find((objective) => objective.pattern.test(text))?.label ?? "";
  }

  function gaObjectiveCandidate(element) {
    if (location.origin !== "https://analytics.google.com" || location.pathname !== GA_OBJECTIVE_PATH) return false;
    const text = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      associatedLabel(element),
      element.innerText,
      element.textContent,
    ].map(normalize).filter(Boolean).join(" ");
    if (!knownGaObjective(text)) return false;
    const role = normalize(element.getAttribute("role")).toLowerCase();
    const tabIndex = Number(element.getAttribute("tabindex"));
    const semantic = ["radio", "button", "option", "checkbox"].includes(role);
    const tabbable = element.hasAttribute("tabindex") && Number.isInteger(tabIndex) && tabIndex >= 0;
    const providerHint = element.tagName.toLowerCase() === "slat"
      || element.hasAttribute("data-testid")
      || element.hasAttribute("data-value")
      || element.hasAttribute("aria-selected");
    const inputSemantic = element instanceof HTMLInputElement && ["radio", "checkbox"].includes(element.type);
    return !element.matches("textarea, select, a") && (inputSemantic || semantic || tabbable || providerHint);
  }

  function visible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  }

  function controlArea(element) {
    if (!(element instanceof HTMLElement)) return Infinity;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 ? box.width * box.height : Infinity;
  }

  function innermostTextTarget(element, expected) {
    // Deepen a container candidate: find the smallest descendant whose text
    // still contains the requested name so the click point lands on the real
    // nav item instead of the whole sidebar/container. Bounded traversal;
    // stops at 512 nodes so oversized wrappers cannot stall a click.
    // Collapsed slide-out panels sit off-canvas (rect outside the viewport);
    // their copies must never win over the on-screen control.
    let best = element;
    let bestArea = controlArea(element);
    const queue = [element];
    for (let index = 0; index < queue.length && index < 512; index += 1) {
      const current = queue[index];
      const text = normalize(`${current.getAttribute("aria-label") ?? ""} ${current.innerText ?? current.textContent ?? ""}`);
      if (!text.includes(expected)) continue;
      const box = current.getBoundingClientRect();
      const onScreen = box.right > 0 && box.bottom > 0 && box.left < window.innerWidth && box.top < window.innerHeight;
      if (!onScreen) continue;
      const area = controlArea(current);
      if (area < bestArea) {
        bestArea = area;
        best = current;
      }
      if (current.children) {
        for (const child of current.children) queue.push(child);
      }
    }
    return best;
  }

  function rankSameName(candidates) {
    // Deterministic tie-break for same-name controls (duplicated nav labels,
    // aria mirrors, shadow copies): prefer the innermost interactive leaf the
    // user actually clicks, then the smaller box, then first in DOM order.
    // "Innermost" wins: a wrapper that merely mirrors the label contains the
    // real control and is never the click target.
    return [...candidates].sort((a, b) => {
      const aContains = candidates.some((other) => other !== a && a.contains(other));
      const bContains = candidates.some((other) => other !== b && b.contains(other));
      if (aContains !== bContains) return aContains ? 1 : -1;
      const aArea = controlArea(a);
      const bArea = controlArea(b);
      if (aArea !== bArea) return aArea - bArea;
      return 0;
    });
  }

  function documentTextTarget(expected) {
    // Bare-text fallback: SPA nav items often carry no interactive semantics
    // (no role/tabindex/button/anchor) and only render as text inside the
    // page. Search the whole document for the smallest on-screen element
    // whose text contains the requested label; null when nothing qualifies.
    // Bounded traversal (4096 nodes) so oversized wrappers cannot stall.
    let best = null;
    let bestArea = Infinity;
    const queue = [document.documentElement];
    for (let index = 0; index < queue.length && index < 4096; index += 1) {
      const current = queue[index];
      const isRoot = current === document.documentElement || current.nodeType === 11;
      if (current.children) {
        for (const child of current.children) queue.push(child);
      }
      if (current.shadowRoot) queue.push(current.shadowRoot);
      if (isRoot || current.nodeType !== 1) continue;
      const text = normalize(`${current.getAttribute("aria-label") ?? ""} ${current.textContent ?? current.innerText ?? ""}`);
      if (!text.includes(expected)) continue;
      const box = current.getBoundingClientRect();
      // On-screen means truly rendered: rect inside the viewport AND not
      // hidden by opacity/visibility (flyout panels are often pre-rendered
      // at full size with opacity 0 until hover).
      const style = getComputedStyle(current);
      const rendered = style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
      const onScreen = rendered && box.right > 0 && box.bottom > 0 && box.left < window.innerWidth && box.top < window.innerHeight;
      if (!onScreen) continue;
      const area = controlArea(current);
      if (area < bestArea) {
        bestArea = area;
        best = current;
      }
    }
    return best;
  }

  function interactable(element) {
    if (visible(element)) return true;
    if (!(element instanceof HTMLInputElement) || !["checkbox", "radio"].includes(element.type)) return false;
    const labels = [...(element.labels ?? [])];
    const parent = element.closest("label");
    if (parent) labels.push(parent);
    if (labels.some((label) => visible(label))) return true;
    if (
      location.origin !== "https://analytics.google.com"
      || !["/analytics/web/provision/", GA_OBJECTIVE_PATH].includes(location.pathname)
      || labels.length !== 1
    ) return false;
    if (element.type === "checkbox") {
      return GA_DATA_SHARING_ID.test(element.getAttribute("aria-labelledby") ?? "")
        || GA_BEHAVIOR_OBJECTIVE.test(element.getAttribute("name") ?? "");
    }
    const label = normalize(labels[0].innerText || labels[0].textContent || "");
    return element.type === "radio" && GA_SMALL_BUSINESS.test(label);
  }

  function associatedLabel(element) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return "";
    if (element.labels?.length) return normalize([...element.labels].map((label) => label.innerText).join(" "));
    const parent = element.closest("label");
    return parent ? normalize(parent.innerText) : "";
  }

  function referencedLabel(element) {
    const root = element.getRootNode();
    const ids = normalize(element.getAttribute("aria-labelledby")).split(" ").filter(Boolean);
    return normalize(ids.map((id) => {
      let match = typeof root.getElementById === "function" ? root.getElementById(id) : null;
      if (!match && typeof root.querySelectorAll === "function") {
        for (const candidate of root.querySelectorAll("[id]")) {
          if (candidate.id === id) {
            match = candidate;
            break;
          }
        }
      }
      if (!match && root !== document) match = document.getElementById(id);
      return match?.innerText || match?.textContent || "";
    }).join(" "));
  }

  function nearbyControlText(element) {
    let current = element.parentElement;
    for (let depth = 0; current && depth < 3; depth += 1, current = current.parentElement) {
      if (!visible(current)) continue;
      const text = normalize(current.innerText || current.textContent || "");
      if (text && text.length <= 240) return text;
    }
    return "";
  }

  function semanticName(value) {
    const text = normalize(value);
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    if (!text || text.length > 120 || OPAQUE_CONTROL_NAME.test(text) || EMAIL.test(text) || TOKEN.test(text)) {
      EMAIL.lastIndex = 0;
      TOKEN.lastIndex = 0;
      return "";
    }
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    return redact(text);
  }

  function elementName(element) {
    const values = [
      element.getAttribute("aria-label"),
      element.getAttribute("placeholder"),
      element.getAttribute("title"),
      element.getAttribute("name"),
      referencedLabel(element),
      associatedLabel(element),
      element.closest("label")?.innerText,
      element instanceof HTMLInputElement ? "" : element.innerText,
      nearbyControlText(element),
      element.textContent,
    ];
    const normalized = values.map(normalize).filter(Boolean);
    const objective = knownGaObjective(normalized.join(" "));
    if (objective) return objective;
    return normalized.find((value) => SAFE_CONTROL_TERM.test(value)) ?? normalized[0] ?? "";
  }

  function controlNames(element) {
    const names = [elementName(element), termsControlText(element)].map(normalize).filter(Boolean);
    return [...new Set(names)];
  }

  function controlName(element) {
    const names = controlNames(element);
    return names.find((name) => Boolean(semanticName(name))) ?? names[0] ?? "";
  }

  function elementRole(element) {
    if (gaObjectiveCandidate(element)) return "radio";
    const explicit = normalize(element.getAttribute("role"));
    if (explicit) return explicit;
    if (element.hasAttribute("aria-checked")) return "checkbox";
    const tag = element.tagName.toLowerCase();
    if (tag === "button") return "button";
    if (tag === "a") return "link";
    if (tag === "select") return "combobox";
    if (tag === "textarea") return "textbox";
    if (tag === "input") {
      const type = normalize(element.getAttribute("type") || "text").toLowerCase();
      if (["button", "submit", "reset"].includes(type)) return "button";
      if (["checkbox", "radio"].includes(type)) return type;
      return "textbox";
    }
    return tag;
  }

  function elementContext(element) {
    if (element.closest('[role="dialog"]')) return "dialog";
    if (element.closest("form")) return "form";
    if (element.closest('main, [role="main"]')) return "main";
    if (element.closest('header, [role="banner"]')) return "header";
    if (element.closest('nav, [role="navigation"]')) return "navigation";
    return "page";
  }

  function controlElements() {
    const selector = [
      "button",
      "a[href]",
      "input",
      "textarea",
      "select",
      "[role=button]",
      "[role=link]",
      "[role=menuitem]",
      "[role=option]",
      "[role=tab]",
      "[role=checkbox]",
      "[role=radio]",
      "[role=switch]",
      "[aria-checked]",
      "[role=combobox]",
      "[role=textbox]",
    ].join(",");
    const roots = [document];
    const controls = [];
    const seen = new Set();
    const add = (element) => {
      if (!seen.has(element) && interactable(element)) {
        seen.add(element);
        controls.push(element);
      }
    };
    for (let index = 0; index < roots.length && index < 64; index += 1) {
      const root = roots[index];
      for (const element of root.querySelectorAll(selector)) add(element);
      if (location.origin === "https://analytics.google.com" && location.pathname === GA_OBJECTIVE_PATH) {
        for (const element of root.querySelectorAll("slat, [tabindex], [data-testid], [data-value], [aria-selected]")) {
          if (gaObjectiveCandidate(element)) add(element);
        }
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
      }
    }
    return controls;
  }

  function objectiveSurfaceDiagnostics() {
    const roots = [document];
    let matchedCount = 0;
    let selectedMarkerCount = 0;
    const rows = [];
    for (let index = 0; index < roots.length && index < 64; index += 1) {
      const root = roots[index];
      for (const element of root.querySelectorAll("*")) {
        const label = knownGaObjective([
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          associatedLabel(element),
          element.innerText,
          element.textContent,
        ].map(normalize).filter(Boolean).join(" "));
        if (!label) continue;
        matchedCount += 1;
        const className = String(element.getAttribute("class") ?? "");
        const selected = element.getAttribute("aria-selected") === "true"
          || element.getAttribute("aria-checked") === "true"
          || element.getAttribute("aria-pressed") === "true"
          || /(?:selected|active|checked)/i.test(className);
        if (selected) selectedMarkerCount += 1;
        if (rows.length < 80) {
          const parentChain = [];
          let parent = element.parentElement;
          for (let depth = 0; parent && depth < 5; depth += 1, parent = parent.parentElement) {
            parentChain.push({ tag: parent.tagName.toLowerCase(), role: normalize(parent.getAttribute("role")), tabindex: parent.getAttribute("tabindex") ?? "", data_value: parent.hasAttribute("data-value"), aria_selected: parent.hasAttribute("aria-selected"), class_tokens: String(parent.getAttribute("class") ?? "").split(/\s+/).filter((token) => token && token.length <= 40).slice(0, 8) });
          }
          rows.push({
            label,
            tag: element.tagName.toLowerCase(),
            role: normalize(element.getAttribute("role")),
            parent_chain: parentChain,
            class_tokens: String(element.getAttribute("class") ?? "").split(/\s+/).filter((token) => token && token.length <= 40).slice(0, 8),
            visible: visible(element),
            tabindex: element.getAttribute("tabindex") ?? "",
            input_type: element instanceof HTMLInputElement ? normalize(element.type) : "",
            label_count: element instanceof HTMLInputElement ? element.labels?.length ?? 0 : 0,
            data_value: element.hasAttribute("data-value"),
            aria_selected: element.hasAttribute("aria-selected"),
            selected,
          });
        }
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
      }
    }
    return { matched_count: matchedCount, selected_marker_count: selectedMarkerCount, rows };
  }

  function binaryControlDiagnostics() {
    const seen = new Set();
    const rows = [];
    for (const element of controlElements()) {
      const role = elementRole(element);
      if (!["checkbox", "radio", "switch"].includes(role)) continue;
      const text = termsControlText(element) || controlName(element);
      const name = semanticName(text);
      const termsSignal = TERMS_SIGNAL.test(text);
      if (!name && !termsSignal) continue;
      const checked = element instanceof HTMLInputElement
        ? Boolean(element.checked)
        : element.getAttribute("aria-checked") === "true";
      const key = `${role}\u0000${name}\u0000${checked}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        role,
        name,
        checked,
        disabled: Boolean(element.disabled || element.getAttribute("aria-disabled") === "true"),
        terms_signal: termsSignal,
      });
      if (rows.length >= 24) break;
    }
    return rows;
  }

  function formDiagnostics() {
    const roots = [document];
    let inputCount = 0;
    let visibleInputCount = 0;
    let textboxRoleCount = 0;
    const checkboxSemantics = [];
    const radioSemantics = [];
    const selectionSemantics = [];
    const formErrors = [];
    for (let index = 0; index < roots.length && index < 64; index += 1) {
      const root = roots[index];
      for (const element of root.querySelectorAll("input, textarea")) {
        inputCount += 1;
        if (visible(element)) visibleInputCount += 1;
        if (
          location.origin === "https://analytics.google.com"
          && (location.pathname === "/analytics/web/provision/" || location.pathname === GA_OBJECTIVE_PATH)
          && element instanceof HTMLInputElement
          && ["checkbox", "radio"].includes(element.type)
        ) {
          const semantic = {
            label_count: element.labels?.length ?? 0,
            label: redact([...(element.labels ?? [])].map((label) => label.innerText || label.textContent || "").join(" ")),
            aria_label: redact(element.getAttribute("aria-label") ?? ""),
            aria_labelledby: redact(element.getAttribute("aria-labelledby") ?? ""),
            name: redact(element.getAttribute("name") ?? ""),
            id: redact(element.getAttribute("id") ?? ""),
            parent_tag: element.parentElement?.tagName?.toLowerCase() ?? "",
            parent_role: normalize(element.parentElement?.getAttribute("role")),
            checked: element.checked,
          };
          if (element.type === "checkbox" && checkboxSemantics.length < 10) checkboxSemantics.push(semantic);
          if (element.type === "radio" && radioSemantics.length < 10) radioSemantics.push(semantic);
        }
      }
      textboxRoleCount += root.querySelectorAll('[role="textbox"]').length;
      for (const element of root.querySelectorAll('[role="alert"], mat-error, [aria-live="assertive"]')) {
        if (formErrors.length >= 10 || !visible(element)) continue;
        const message = redact(element.innerText || element.textContent || "");
        if (message && !formErrors.includes(message)) formErrors.push(message);
      }
      for (const element of root.querySelectorAll('select, [role="combobox"], [aria-haspopup="listbox"]')) {
        if (selectionSemantics.length >= 10) break;
        selectionSemantics.push({
          tag: element.tagName.toLowerCase(),
          role: normalize(element.getAttribute("role")),
          visible: visible(element),
          aria_label: redact(element.getAttribute("aria-label") ?? ""),
          aria_labelledby: redact(element.getAttribute("aria-labelledby") ?? ""),
          name: redact(element.getAttribute("name") ?? ""),
          id: redact(element.getAttribute("id") ?? ""),
          text: redact(elementName(element)),
        });
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
      }
    }
    const frames = [...document.querySelectorAll("iframe")];
    const sameOriginFrameCount = frames.filter((frame) => {
      try { return new URL(frame.src, location.href).origin === location.origin; } catch { return false; }
    }).length;
    const frameOrigins = frames.map((frame) => {
      try { return new URL(frame.src, location.href).origin; } catch { return null; }
    });
    const objectiveCandidates = controlElements()
      .filter((element) => gaObjectiveCandidate(element))
      .map((element) => ({
        label: knownGaObjective([element.getAttribute("aria-label"), element.innerText, element.textContent].map(normalize).join(" ")),
        role: elementRole(element),
        tag: element.tagName.toLowerCase(),
        tabindex: element.getAttribute("tabindex") ?? "",
        disabled: Boolean(element.disabled || element.getAttribute("aria-disabled") === "true"),
      }))
      .slice(0, 12);
    return {
      input_count: inputCount,
      visible_input_count: visibleInputCount,
      textbox_role_count: textboxRoleCount,
      iframe_count: frames.length,
      same_origin_iframe_count: sameOriginFrameCount,
      iframe_origins: frameOrigins.slice(0, 8),
      open_shadow_root_count: roots.length - 1,
      checkbox_semantics: checkboxSemantics,
      radio_semantics: radioSemantics,
      selection_semantics: selectionSemantics,
      binary_controls: binaryControlDiagnostics(),
      objective_candidates: objectiveCandidates,
      objective_surface: objectiveSurfaceDiagnostics(),
      form_errors: location.origin === "https://analytics.google.com" || location.origin === "https://clarity.microsoft.com" ? formErrors : [],
      form_error_count: formErrors.length,
    };
  }

  function safeControlRows() {
    const seen = new Set();
    const rows = [];
    for (const element of controlElements()) {
      const raw = controlName(element);
      const name = semanticName(raw);
      if (!name) continue;
      const role = elementRole(element);
      const context = elementContext(element);
      const key = `${context}\u0000${role}\u0000${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const row = { context, role, name, disabled: Boolean(element.disabled || element.getAttribute("aria-disabled") === "true") };
      if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) row.checked = element.checked;
      else if (["checkbox", "radio", "switch"].includes(role) && element.hasAttribute("aria-checked")) {
        row.checked = element.getAttribute("aria-checked") === "true";
      }
      rows.push(row);
      if (rows.length >= 120) break;
    }
    return rows;
  }

  function requestedName(value) {
    const name = normalize(value);
    if (!name || name.length > 120 || EMAIL.test(name) || TOKEN.test(name)) {
      throw new Error("control_name_invalid");
    }
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    return name;
  }

  function queryWithShadow(root, sel) {
    if (!sel || typeof sel !== "string") return null;
    try {
      if (sel.startsWith("//") || sel.startsWith("xpath:")) {
        const xpathExpr = sel.startsWith("xpath:") ? sel.slice(6) : sel;
        const result = document.evaluate(xpathExpr, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue instanceof Element) return result.singleNodeValue;
      }
      const direct = root.querySelector(sel);
      if (direct instanceof Element) return direct;
    } catch {}
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.shadowRoot) {
          const shadowMatch = queryWithShadow(node.shadowRoot, sel);
          if (shadowMatch) return shadowMatch;
        }
      }
    } catch {}
    return null;
  }

  function flashActionIndicator(element, kind) {
    if (!element || !(element instanceof Element) || typeof document === "undefined" || !document.body) return;
    try {
      const box = element.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return;
      const overlay = document.createElement("div");
      overlay.setAttribute("data-holar-indicator", "true");
      let radius = "4px";
      try { radius = window.getComputedStyle(element).borderRadius || "4px"; } catch {}
      const color = kind === "click" ? "rgba(58, 150, 221, 0.3)" : kind === "fill" ? "rgba(34, 197, 94, 0.3)" : "rgba(124, 92, 255, 0.3)";
      const borderColor = kind === "click" ? "#3a96dd" : kind === "fill" ? "#22c55e" : "#7c5cff";
      Object.assign(overlay.style, {
        position: "fixed",
        top: `${Math.round(box.top)}px`,
        left: `${Math.round(box.left)}px`,
        width: `${Math.round(box.width)}px`,
        height: `${Math.round(box.height)}px`,
        borderRadius: radius,
        border: `2px solid ${borderColor}`,
        backgroundColor: color,
        boxShadow: `0 0 10px ${borderColor}`,
        pointerEvents: "none",
        zIndex: "2147483646",
        transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        transform: "scale(1)",
        opacity: "0.85",
      });
      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        overlay.style.opacity = "0";
        overlay.style.transform = "scale(1.05)";
      });
      setTimeout(() => {
        try { overlay.remove(); } catch {}
      }, 350);
    } catch {}
  }

  function elementHierarchyPath(element) {
    if (!element || !(element instanceof Element)) return "";
    const path = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && path.length < 5) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.getAttribute("data-slot")) {
        selector += `[data-slot="${current.getAttribute("data-slot")}"]`;
      } else if (current.classList && current.classList.length > 0) {
        selector += `.${Array.from(current.classList).slice(0, 2).join(".")}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(" > ");
  }

  function findControl(name, role, context, selector) {
    if (selector && typeof selector === "string") {
      const match = queryWithShadow(document, selector);
      if (match) return match;
    }
    if (!name && selector) {
      throw new Error("control_missing");
    }
    const expected = requestedName(name).toLowerCase();
    const candidates = controlElements().filter((element) => (
      (!role || elementRole(element) === role)
      && (!context || elementContext(element) === context)
    ));
    if (expected === "prompt" && role === "textbox" && candidates.length === 1) return candidates[0];
    if (expected === "send" && role === "button") {
      const send = candidates.filter((element) => /^(?:send(?: message)?|发送(?:消息)?)$/i.test(elementName(element)));
      if (send.length === 1) return send[0];
      if (send.length > 1) throw new Error("control_ambiguous");
    }
    const exact = candidates.filter((element) => controlNames(element).some((candidate) => candidate.toLowerCase() === expected));
    const onScreenMatch = (element) => {
      const box = element.getBoundingClientRect();
      return box.right > 0 && box.bottom > 0 && box.left < window.innerWidth && box.top < window.innerHeight;
    };
    // Off-canvas clones (collapsed slide-out panels) must never win, even
    // when they are the only exact-name match: an on-screen container that
    // still carries the label is the real control.
    const exactVisible = exact.filter(onScreenMatch);
    if (exactVisible.length > 0) {
      if (exactVisible.length === 1) return exactVisible[0];
      if (EQUIVALENT_FORM_OPENER.test(expected)) return exactVisible[0];
      return rankSameName(exactVisible)[0];
    }
    if (exact.length > 0 && EQUIVALENT_FORM_OPENER.test(expected)) return exact[0];
    const partial = candidates.filter((element) => controlNames(element).some((candidate) => candidate.toLowerCase().includes(expected)));
    if (partial.length === 0) {
      // Bare-text SPA nav items never become candidates; locate the label in
      // the document before giving up. Never falls back across a boundary:
      // same-page text only, on-screen only.
      const bare = documentTextTarget(expected);
      if (bare) return bare;
      if (exact.length > 0) return exact[0];
      throw new Error("control_missing");
    }
    // A container match (sidebar/nav with a merged text label) must click the
    // innermost text node, not the container center. Same-name duplicates
    // (document + shadow copy) resolve deterministically: deepen EVERY
    // candidate, prefer targets on screen (collapsed slide-out panels sit
    // off-canvas and must never win), then the smaller box, then DOM order.
    const targets = partial.map((element) => innermostTextTarget(element, expected));
    const visibleTargets = targets.filter(onScreenMatch);
    return rankSameName(visibleTargets.length > 0 ? visibleTargets : targets)[0];
  }

  function termClass(value) {
    const text = normalize(value);
    if (/privacy\s+policy|隐私政策/i.test(text)) return "privacy_policy";
    if (/data\s+(?:processing|sharing)|personal\s+data|数据(?:处理|共享)/i.test(text)) return "data_processing";
    if (/billing|payment|paid|收费|付款|付费/i.test(text)) return "paid_or_billing";
    if (/terms|service\s+terms|条款|服务协议/i.test(text)) return "service_terms";
    if (/agree|accept|同意|接受/i.test(text)) return "agreement";
    return "other";
  }

  function providerSurfaceAllowed(provider) {
    return provider === "ga4"
      ? location.origin === "https://analytics.google.com" && location.pathname.startsWith("/analytics/web/")
      : provider === "clarity"
        && location.origin === "https://clarity.microsoft.com"
        && location.pathname.startsWith("/projects");
  }

  function termsDiagnostics(provider) {
    if (!["ga4", "clarity"].includes(provider) || !providerSurfaceAllowed(provider)) throw new Error("terms_target_invalid");
    const candidates = controlElements().filter((element) => TERMS_SIGNAL.test(termsControlText(element)));
    const classes = [...new Set(candidates.map((element) => termClass(elementName(element))))].sort().slice(0, 8);
    const roleCounts = {};
    for (const element of candidates) {
      const role = elementRole(element);
      roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    }
    const agreementButtons = candidates.filter((element) => elementRole(element) === "button" && /agree|accept|同意|接受/i.test(termsControlText(element)));
    const continueButtons = controlElements().filter((element) => elementRole(element) === "button" && /create|next|continue|submit|创建|下一步|继续|提交/i.test(elementName(element)) && !/cancel|close|取消|关闭/i.test(elementName(element)));
    const enabled = (element) => !element.disabled && element.getAttribute("aria-disabled") !== "true";
    const rejectionSignal = /do\s+not|don't|decline|reject|cancel|not\s+now|不接受|不同意|拒绝|取消/i;
    const acceptButtons = agreementButtons.filter((element) => !rejectionSignal.test(termsControlText(element)));
    const uniqueAcceptNames = [...new Set(acceptButtons.map((element) => elementName(element)))];
    const rejectionButtons = agreementButtons.filter((element) => rejectionSignal.test(termsControlText(element)));
    const contextCounts = (rows) => rows.reduce((counts, element) => {
      const context = elementContext(element);
      counts[context] = (counts[context] ?? 0) + 1;
      return counts;
    }, {});
    const checkedCount = candidates.filter((element) => (
      (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type) && element.checked)
      || element.getAttribute("aria-checked") === "true"
    )).length;
    return {
      action: "terms_diagnostics",
      provider,
      term_control_count: candidates.length,
      standard_candidate_count: candidates.filter((element) => standardTermsCandidate(element, provider)).length,
      classes,
      role_counts: roleCounts,
      agreement_button_count: agreementButtons.length,
      enabled_agreement_button_count: agreementButtons.filter(enabled).length,
      accept_button_count: acceptButtons.length,
      enabled_accept_button_count: acceptButtons.filter(enabled).length,
      unique_accept_name_count: uniqueAcceptNames.length,
      rejection_button_count: rejectionButtons.length,
      agreement_button_context_counts: contextCounts(agreementButtons),
      agreement_button_names: agreementButtons.map((element) => elementName(element)),
      continue_button_count: continueButtons.length,
      enabled_continue_button_count: continueButtons.filter(enabled).length,
      continue_button_context_counts: contextCounts(continueButtons),
      checked_control_count: checkedCount,
      raw_values_returned: false,
    };
  }

  function termsControlText(element) {
    return [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      referencedLabel(element),
      associatedLabel(element),
      element.closest("label")?.innerText,
      element instanceof HTMLInputElement ? "" : element.innerText,
      element.textContent,
    ].map(normalize).filter(Boolean).join(" ");
  }

  function standardTermsCandidate(element, provider) {
    const allowedOrigin = provider === "ga4"
      ? location.origin === "https://analytics.google.com" && location.pathname.startsWith("/analytics/web/")
      : provider === "clarity"
        && location.origin === "https://clarity.microsoft.com"
        && location.pathname.startsWith("/projects");
    if (!allowedOrigin || !["checkbox", "button"].includes(elementRole(element))) return false;
    return STANDARD_TERMS_LABEL.test(termsControlText(element));
  }

  function acceptStandardTerms(provider) {
    if (!["ga4", "clarity"].includes(provider)) throw new Error("terms_provider_invalid");
    const candidates = controlElements().filter((element) => standardTermsCandidate(element, provider));
    if (candidates.length !== 1) throw new Error(candidates.length ? "standard_terms_control_ambiguous" : "standard_terms_control_missing");
    const element = candidates[0];
    if (element.disabled || element.getAttribute("aria-disabled") === "true") throw new Error("standard_terms_control_disabled");
    if (element instanceof HTMLInputElement && element.type === "checkbox" && element.checked) {
      return { action: "accept_standard_terms", status: "already_selected", provider, value_returned: false };
    }
    element.click();
    return { action: "accept_standard_terms", status: "dispatched", provider, value_returned: false };
  }

  function acceptOwnerAuthorizedTerms(provider) {
    if (!["ga4", "clarity"].includes(provider)) throw new Error("terms_provider_invalid");
    if (!providerSurfaceAllowed(provider)) throw new Error("terms_target_invalid");
    const terms = controlElements().filter((element) => TERMS_SIGNAL.test(termsControlText(element)));
    const checkboxes = terms.filter((element) => ["checkbox", "switch"].includes(elementRole(element)));
    const text = terms.map(termsControlText).join(" ");
    const combinedTerms = /data\s+(?:processing|sharing)|personal\s+data|数据(?:处理|共享)/i.test(text)
      && /terms(?:\s+of\s+(?:service|use))?|service\s+terms|条款|服务协议/i.test(text)
      && /agree|accept|同意|接受/i.test(text)
      && !/billing|payment|paid|收费|付款|付费/i.test(text)
      && !/privacy\s+policy|隐私政策/i.test(text);
    if (checkboxes.length !== 1 || !combinedTerms) throw new Error(checkboxes.length ? "owner_terms_control_ambiguous" : "owner_terms_control_missing");
    const element = checkboxes[0];
    if (element.disabled || element.getAttribute("aria-disabled") === "true") throw new Error("owner_terms_control_disabled");
    const checked = (element instanceof HTMLInputElement && element.type === "checkbox" && element.checked)
      || element.getAttribute("aria-checked") === "true";
    if (!checked) {
      element.click();
      return { action: "accept_owner_authorized_terms", status: "dispatched", provider, terms_scope: "combined_data_processing_service_terms", checkbox_dispatched: true, value_returned: false };
    }
    const rejectionSignal = /do\s+not|don't|decline|reject|cancel|not\s+now|不接受|不同意|拒绝|取消/i;
    const acceptButtons = terms.filter((candidate) => elementRole(candidate) === "button" && /agree|accept|同意|接受/i.test(termsControlText(candidate)) && !rejectionSignal.test(termsControlText(candidate)));
    const uniqueAcceptNames = [...new Set(acceptButtons.map((candidate) => elementName(candidate)))];
    if (acceptButtons.length === 1 || (acceptButtons.length > 1 && uniqueAcceptNames.length === 1)) {
      const acceptButton = acceptButtons[0];
      if (acceptButton.disabled || acceptButton.getAttribute("aria-disabled") === "true") throw new Error("owner_terms_accept_disabled");
      acceptButton.click();
      return { action: "accept_owner_authorized_terms", status: "dispatched", provider, terms_scope: "combined_data_processing_service_terms", accept_dispatched: true, value_returned: false };
    }
    const continueButtons = controlElements().filter((candidate) => elementRole(candidate) === "button" && /create|next|continue|submit|创建|下一步|继续|提交/i.test(elementName(candidate)) && !/cancel|close|取消|关闭/i.test(elementName(candidate)));
    if (continueButtons.length !== 1) {
      return { action: "accept_owner_authorized_terms", status: "already_selected", provider, terms_scope: "combined_data_processing_service_terms", value_returned: false };
    }
    const continueButton = continueButtons[0];
    if (continueButton.disabled || continueButton.getAttribute("aria-disabled") === "true") throw new Error("owner_terms_continue_disabled");
    continueButton.click();
    return { action: "accept_owner_authorized_terms", status: "dispatched", provider, terms_scope: "combined_data_processing_service_terms", continue_dispatched: true, value_returned: false };
  }

  function selectGa4Target(targetName) {
    if (!providerSurfaceAllowed("ga4")) throw new Error("ga4_target_surface_invalid");
    const expected = requestedName(targetName).toLowerCase();
    const matches = (role) => controlElements().filter((element) => {
      if (elementRole(element) !== role) return false;
      const name = normalize(elementName(element)).toLowerCase();
      return name === expected || name.startsWith(`${expected} `);
    });
    const links = matches("link");
    const options = matches("option");
    const candidates = links.length > 0 ? links : options.length > 0 ? options : matches("button");
    if (candidates.length !== 1) throw new Error(candidates.length ? "ga4_target_ambiguous" : "ga4_target_missing");
    const element = candidates[0];
    if (element.disabled || element.getAttribute("aria-disabled") === "true") throw new Error("ga4_target_disabled");
    element.click();
    return { action: "select_ga4_target", status: "dispatched", target_name: expected, value_returned: false };
  }

  async function selectGa4Objective(objectiveName) {
    if (location.origin !== "https://analytics.google.com" || !location.pathname.startsWith("/analytics/web/")) throw new Error("ga4_objective_surface_invalid");
    const expected = requestedName(objectiveName);
    const label = knownGaObjective(expected);
    if (!label) throw new Error("ga4_objective_not_allowlisted");
    const roots = [document];
    const matches = [];
    for (let index = 0; index < roots.length && index < 64; index += 1) {
      const root = roots[index];
      for (const element of root.querySelectorAll("*")) {
        if (!visible(element)) continue;
        const text = normalize(element.innerText || element.textContent || "");
        if (text === label && knownGaObjective(text) === label) matches.push(element);
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
      }
    }
    const slats = matches.filter((element) => element.tagName.toLowerCase() === "slat");
    const slat = slats.length === 1 ? slats[0] : null;
    const directChild = slat && [...slat.children].find((child) => {
      if (!visible(child)) return false;
      const text = normalize(child.innerText || child.textContent || "");
      return text === label && knownGaObjective(text) === label;
    });
    const leaves = matches.filter((element) => ![...element.querySelectorAll("*")].some((child) => {
      if (!visible(child)) return false;
      const text = normalize(child.innerText || child.textContent || "");
      return text === label && knownGaObjective(text) === label;
    }));
    const clickable = slat ?? directChild ?? leaves[0];
    if (!clickable) throw new Error("ga4_objective_control_missing");
    const box = clickable.getBoundingClientRect();
    const eventInit = { bubbles: true, composed: true, cancelable: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, view: window };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      clickable.dispatchEvent(new (type.startsWith("pointer") ? PointerEvent : MouseEvent)(type, eventInit));
    }
    if (typeof clickable.focus === "function") clickable.focus({ preventScroll: true });
    for (const key of ["Enter", " "]) {
      for (const type of ["keydown", "keyup"]) {
        clickable.dispatchEvent(new KeyboardEvent(type, { key, code: key === " " ? "Space" : "Enter", bubbles: true, composed: true, cancelable: true }));
      }
    }
    return { action: "select_ga4_objective", status: "dispatched", objective_name: label, value_returned: false };
  }

  function fillableText(element) {
    return element instanceof HTMLInputElement
      || element instanceof HTMLTextAreaElement
      || (element instanceof HTMLElement && element.isContentEditable);
  }

  function textValue(element) {
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? element.value
      : String(element.textContent ?? "");
  }

  function setNativeValue(element, value) {
    if (element instanceof HTMLElement && element.isContentEditable) {
      element.focus({ preventScroll: true });
      const selection = globalThis.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const inserted = document.execCommand("insertText", false, value);
      if (!inserted) {
        element.replaceChildren(document.createTextNode(value));
        element.dispatchEvent(new InputEvent("input", {
          bubbles: true,
          composed: true,
          data: value,
          inputType: "insertText",
        }));
      }
      element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      return;
    }
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (!setter) throw new Error("control_not_fillable");
    const previous = element.value;
    element.focus({ preventScroll: true });
    setter.call(element, value);
    if (element._valueTracker && typeof element._valueTracker.setValue === "function") {
      element._valueTracker.setValue(previous);
    }
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true,
      data: value,
      inputType: "insertText",
    }));
    element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    // Searchable comboboxes (React Select and similar) render options only
    // while their internal input retains focus; blurring here erased the
    // query and closed the menu before a later semantic option click.
    if (element.getAttribute("role") !== "combobox" && !element.closest('[role="combobox"]')) element.blur();
  }

  function openClaritySettings() {
    if (!providerSurfaceAllowed("clarity")) throw new Error("clarity_project_surface_invalid");
    const candidates = controlElements().filter((element) => {
      if (!visible(element) || !["a", "button"].includes(element.tagName.toLowerCase())) return false;
      const semantic = normalize(elementName(element));
      const text = normalize(element.innerText || element.textContent || "");
      return /^settings$/i.test(semantic) || /^settings$/i.test(text);
    });
    const geometry = (element) => {
      const box = element.getBoundingClientRect();
      return [Math.round(box.left), Math.round(box.top), Math.round(box.width), Math.round(box.height)].join(":");
    };
    const uniqueGeometry = [...new Set(candidates.map(geometry))];
    const buttonCandidates = candidates.filter((element) => element.tagName.toLowerCase() === "button");
    const narrowed = candidates.length > 1 && buttonCandidates.length === 1 ? buttonCandidates : candidates;
    const sameButtonShape = buttonCandidates.length === candidates.length
      && new Set(candidates.map((element) => {
        const box = element.getBoundingClientRect();
        return `${Math.round(box.width)}:${Math.round(box.height)}`;
      })).size === 1;
    if (narrowed.length !== 1 && uniqueGeometry.length !== 1 && !sameButtonShape) {
      throw new Error(narrowed.length ? "clarity_settings_ambiguous" : "clarity_settings_control_missing");
    }
    const element = narrowed.length === 1
      ? narrowed[0]
      : candidates.reduce((best, candidate) => candidate.getBoundingClientRect().top > best.getBoundingClientRect().top ? candidate : best);
    if (element instanceof HTMLAnchorElement) {
      let target;
      try { target = new URL(element.href, location.href); } catch { throw new Error("clarity_settings_target_invalid"); }
      if (target.origin !== location.origin) throw new Error("cross_origin_navigation_blocked");
    }
    element.click();
    return { action: "open_clarity_settings", status: "dispatched", value_returned: false };
  }

  function openClarityProject(projectName) {
    if (!providerSurfaceAllowed("clarity")) throw new Error("clarity_project_surface_invalid");
    const expectedName = normalize(projectName).toLowerCase();
    if (!expectedName || expectedName.length > 120) throw new Error("clarity_project_name_invalid");
    const allCandidates = controlElements().filter((element) => {
      if (!["a", "button"].includes(element.tagName.toLowerCase())) return false;
      const semantic = normalize(elementName(element)).toLowerCase();
      const text = normalize(element.innerText || element.textContent || "").toLowerCase();
      return semantic.includes(expectedName) || text.includes(expectedName);
    });
    const visibleCandidates = allCandidates.filter((element) => visible(element));
    const candidates = visibleCandidates.length > 0 ? visibleCandidates : allCandidates;
    if (candidates.length !== 1) throw new Error(candidates.length ? "clarity_project_ambiguous" : "clarity_project_control_missing");
    const element = candidates[0];
    if (element instanceof HTMLAnchorElement) {
      let target;
      try { target = new URL(element.href, location.href); } catch { throw new Error("clarity_project_target_invalid"); }
      if (target.origin !== location.origin) throw new Error("cross_origin_navigation_blocked");
      element.click();
    } else {
      element.click();
    }
    return { action: "open_clarity_project", status: "dispatched", value_returned: false };
  }

  function clarityProjectIdentity(projectName, domain) {
    if (!providerSurfaceAllowed("clarity")) throw new Error("clarity_project_surface_invalid");
    const expectedName = normalize(projectName);
    const expectedDomain = normalize(domain).replace(/^https?:\/\//i, "").replace(/\/$/, "");
    if (!expectedName || expectedName.length > 120 || !expectedDomain || expectedDomain.length > 253) throw new Error("clarity_identity_input_invalid");
    const roots = [document];
    let projectCardCount = 0;
    let projectNameMatch = false;
    let domainMatch = false;
    let projectIdReadback = false;
    for (let index = 0; index < roots.length && index < 64; index += 1) {
      const root = roots[index];
      for (const element of root.querySelectorAll('a[href*="/projects/view/"], [data-project-id], [data-projectid]')) {
        if (!visible(element)) continue;
        const text = normalize(element.innerText || element.textContent || elementName(element)).toLowerCase();
        let viewId = "";
        try {
          const href = element instanceof HTMLAnchorElement ? new URL(element.href, location.href) : null;
          if (href && href.origin === location.origin) {
            const parts = href.pathname.split("/").filter(Boolean);
            const viewIndex = parts.indexOf("view");
            viewId = viewIndex >= 0 ? String(parts[viewIndex + 1] ?? "") : "";
          }
        } catch { /* keep the redacted identity receipt */ }
        if (viewId && text.includes(expectedName.toLowerCase()) && text.includes(expectedDomain.toLowerCase())) {
          projectCardCount += 1;
          projectNameMatch = true;
          domainMatch = true;
          projectIdReadback = true;
        }
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
      }
    }
    let currentNameMatch = false;
    let currentDomainMatch = false;
    for (const element of document.querySelectorAll("input, textarea")) {
      if (!visible(element)) continue;
      const label = normalize(elementName(element)).toLowerCase();
      const value = String("value" in element ? element.value : "").trim().toLowerCase();
      if (!value) continue;
      if (/(?:name|project|名称|项目)/i.test(label)) currentNameMatch = currentNameMatch || value === expectedName.toLowerCase();
      if (/(?:website|site|url|domain|网站|网址|域名)/i.test(label)) currentDomainMatch = currentDomainMatch || value.includes(expectedDomain.toLowerCase());
    }
    const currentPathId = /\/projects\/view\/[A-Za-z0-9_-]{5,64}(?:\/|$)/.test(location.pathname)
      || /#\/a\d+p\d+(?:\/|$)/.test(location.href);
    const projectAttributeMarker = [...document.querySelectorAll("*")].some((element) => [...element.attributes].some((attribute) => /project.*id|id.*project/i.test(attribute.name) && Boolean(attribute.value)));
    const exactTargetControls = controlElements().filter((element) => {
      if (!visible(element)) return false;
      const text = normalize(element.innerText || element.textContent || elementName(element)).toLowerCase();
      return text.includes(expectedName.toLowerCase()) && text.includes(expectedDomain.toLowerCase());
    });
    if (exactTargetControls.length === 1) {
      projectCardCount = Math.max(projectCardCount, 1);
      projectNameMatch = true;
      domainMatch = true;
      projectIdReadback = projectIdReadback || currentPathId || projectAttributeMarker;
    }
    const currentNameControl = controlElements().some((element) => {
      if (!visible(element)) return false;
      const text = normalize(element.innerText || element.textContent || elementName(element)).toLowerCase();
      return currentPathId && text === expectedName.toLowerCase();
    });
    if (currentNameControl && (currentPathId || projectAttributeMarker)) {
      projectCardCount = Math.max(projectCardCount, 1);
      projectNameMatch = true;
      projectIdReadback = true;
    }
    if (currentNameMatch && currentDomainMatch && (currentPathId || projectAttributeMarker)) {
      projectCardCount = Math.max(projectCardCount, 1);
      projectNameMatch = true;
      domainMatch = true;
      projectIdReadback = true;
    }
    return {
      action: "clarity_project_identity",
      project_card_count: projectCardCount,
      project_name_match: projectNameMatch,
      domain_match: domainMatch,
      project_id_readback: projectIdReadback,
      distinct_identity_verified: projectCardCount === 1 && projectNameMatch && domainMatch && projectIdReadback,
      raw_values_returned: false,
    };
  }

  function captureGa4MeasurementId(streamName, domain, verifiedIdentity = false) {
    if (!providerSurfaceAllowed("ga4")) throw new Error("ga4_measurement_surface_invalid");
    const expectedName = normalize(streamName);
    const expectedDomain = normalize(domain).replace(/^https?:\/\//i, "").replace(/\/$/, "");
    if (!expectedName || expectedName.length > 120 || !expectedDomain || expectedDomain.length > 253) throw new Error("ga4_measurement_input_invalid");
    const roots = [document];
    const candidates = new Set();
    const add = (value) => {
      const text = String(value ?? "");
      for (const match of text.matchAll(/\bG-[A-Z0-9]{6,20}\b/gi)) candidates.add(match[0].toUpperCase());
    };
    const scan = (element) => {
      for (const attribute of [...element.attributes]) {
        if (/measurement.*id|id.*measurement|stream.*id/i.test(attribute.name)) add(attribute.value);
      }
      if ("value" in element) add(element.value);
      add(element.innerText || element.textContent);
    };
    const identityControls = controlElements().filter((element) => visible(element));
    const identityContainers = [];
    for (const root of roots) {
      for (const element of root.querySelectorAll('[role="dialog"], dialog, main')) {
        if (visible(element)) identityContainers.push(normalize(element.innerText || element.textContent));
      }
    }
    for (const element of identityControls) {
      const container = element.closest?.('[role="dialog"], dialog, main');
      if (container && visible(container)) identityContainers.push(normalize(container.innerText || container.textContent));
    }
    const identityText = [...identityControls.map((element) => normalize(element.innerText || element.textContent || elementName(element))), ...identityContainers].join(" ").toLowerCase();
    const nameMatch = identityText.includes(expectedName.toLowerCase());
    const domainMatch = identityText.includes(expectedDomain.toLowerCase());
    for (const element of identityControls.filter((candidate) => /copy\s+(?:the\s+)?measurement\s+id|复制.*衡量\s*ID/i.test(elementName(candidate)))) {
      let current = element;
      for (let depth = 0; current && depth < 8; depth += 1, current = current.parentElement) scan(current);
    }
    for (let index = 0; index < roots.length && index < 64; index += 1) {
      const root = roots[index];
      for (const element of root.querySelectorAll('input, textarea, code, pre, [role="textbox"], [data-measurement-id], [data-measurementid], [data-measurement_id]')) {
        if (visible(element)) scan(element);
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
      }
    }
    if (!(verifiedIdentity === true || (nameMatch && domainMatch))) throw new Error("ga4_measurement_identity_unverified");
    if (candidates.size !== 1) throw new Error(candidates.size ? "ga4_measurement_id_ambiguous" : "ga4_measurement_id_missing");
    return { action: "capture_ga4_measurement_id", status: "captured", secret: [...candidates][0], identity_verified: true, value_returned: true };
  }

  function captureClarityProjectId(projectName, domain, verifiedIdentity = false, projectIdHint = "") {
    if (!providerSurfaceAllowed("clarity")) throw new Error("clarity_project_surface_invalid");
    const identity = clarityProjectIdentity(projectName, domain);
    if (!identity.distinct_identity_verified && !(verifiedIdentity === true && identity.project_name_match && identity.project_id_readback)) {
      throw new Error("clarity_project_identity_unverified");
    }
    const hinted = String(projectIdHint ?? "").trim();
    if (/^[A-Za-z0-9_-]{5,64}$/.test(hinted)) {
      return { action: "capture_clarity_project_id", status: "captured", secret: hinted, value_returned: true };
    }
    const candidates = new Set();
    const add = (value) => {
      const text = String(value ?? "");
      for (const match of text.matchAll(/\/projects\/view\/([A-Za-z0-9_-]{5,64})(?=\/|$)/g)) candidates.add(match[1]);
      for (const match of text.matchAll(/(?:projectId|project_id|project-id)["'=:\s]+["']?([A-Za-z0-9_-]{5,64})/gi)) candidates.add(match[1]);
      for (const match of text.matchAll(/#\/(a\d+p\d+)(?:\/|$)/g)) candidates.add(match[1]);
    };
    add(location.pathname);
    add(location.hash);
    for (const element of document.querySelectorAll("[data-project-id], [data-projectid], input, textarea")) {
      for (const attribute of [...element.attributes]) {
        if (/project.*id|id.*project/i.test(attribute.name)) add(attribute.value);
      }
      if ("value" in element) add(element.value);
    }
    if (candidates.size !== 1) throw new Error(candidates.size ? "clarity_project_id_ambiguous" : "clarity_project_id_missing");
    return { action: "capture_clarity_project_id", status: "captured", secret: [...candidates][0], value_returned: true };
  }

  function clarityTokenCandidate() {
    if (location.origin !== "https://clarity.microsoft.com") throw new Error("clarity_token_origin_invalid");
    const roots = [document];
    const candidates = new Set();
    for (let index = 0; index < roots.length && index < 64; index += 1) {
      const root = roots[index];
      for (const element of root.querySelectorAll('input, textarea, code, pre, [role="textbox"]')) {
        if (!visible(element)) continue;
        const raw = "value" in element ? element.value : element.textContent;
        const value = String(raw ?? "").trim();
        if (CLARITY_API_TOKEN.test(value)) candidates.add(value);
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
      }
    }
    if (candidates.size !== 1) throw new Error(candidates.size ? "clarity_token_ambiguous" : "clarity_token_missing");
    return { secret: [...candidates][0], token_value_returned: true };
  }

  let screenshotCaptureState = null;

  function restoreScreenshotCapture() {
    const state = screenshotCaptureState;
    if (!state) return { action: "screenshot_restore", status: "idle", scroll_y: Math.round(window.scrollY) };
    for (const item of state.suppressed) {
      if (!item.element?.style) continue;
      if (item.value) item.element.style.setProperty("visibility", item.value, item.priority);
      else item.element.style.removeProperty("visibility");
    }
    state.stabilizer?.remove();
    screenshotCaptureState = null;
    if (state.inner && state.scroller) state.scroller.scrollTop = state.scrollerTop;
    window.scrollTo(state.scrollX, state.scrollY);
    return { action: "screenshot_restore", status: "restored", scroll_y: Math.round(state.scrollY) };
  }

  function screenshotMetrics() {
    if (window.top !== window) throw new Error("screenshot_top_frame_required");
    if (screenshotCaptureState) restoreScreenshotCapture();
    const root = document.documentElement;
    const body = document.body;
    const viewportWidth = Math.max(1, window.innerWidth || root.clientWidth || 0);
    const viewportHeight = Math.max(1, window.innerHeight || root.clientHeight || 0);
    const documentHeight = Math.max(
      viewportHeight,
      root.scrollHeight,
      root.offsetHeight,
      root.clientHeight,
      body?.scrollHeight ?? 0,
      body?.offsetHeight ?? 0,
      body?.clientHeight ?? 0,
    );
    const stabilizer = document.createElement("style");
    stabilizer.setAttribute("data-spiral-screenshot", "true");
    stabilizer.textContent = "html{scroll-behavior:auto!important}*{animation-play-state:paused!important;caret-color:transparent!important}";
    (document.head || root).appendChild(stabilizer);
    const scroller = globalThis.spiralPrimaryScroller?.(document, window) || document.scrollingElement || root;
    const inner = Boolean(
      scroller
      && scroller !== document.scrollingElement
      && scroller !== root
      && scroller !== body
    );
    const scrollerViewport = inner ? Math.max(1, scroller.clientHeight || 0) : viewportHeight;
    const scrollerHeight = inner
      ? Math.max(scrollerViewport, scroller.scrollHeight || 0)
      : documentHeight;
    screenshotCaptureState = {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      scroller,
      scrollerTop: Number(scroller.scrollTop) || 0,
      inner,
      stabilizer,
      suppressed: [],
      suppressedElements: new WeakSet(),
    };
    return {
      action: "screenshot_metrics",
      viewport_width: Math.round(viewportWidth),
      viewport_height: Math.round(scrollerViewport),
      document_height: Math.round(scrollerHeight),
      scroll_y: Math.round(inner ? scroller.scrollTop : window.scrollY),
      inner,
      device_pixel_ratio: Number(window.devicePixelRatio || 1),
    };
  }

  function suppressPinnedElements() {
    const state = screenshotCaptureState;
    if (!state) throw new Error("screenshot_state_missing");
    let inspected = 0;
    for (const element of document.querySelectorAll("body *")) {
      if (!(element instanceof HTMLElement) || inspected >= 5_000) break;
      inspected += 1;
      if (state.suppressedElements.has(element)) continue;
      const style = getComputedStyle(element);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      const rect = element.getBoundingClientRect();
      const pinned = style.position === "fixed" || rect.top <= 2 || rect.bottom >= window.innerHeight - 2;
      if (!pinned || rect.width <= 0 || rect.height <= 0) continue;
      state.suppressedElements.add(element);
      state.suppressed.push({
        element,
        value: element.style.getPropertyValue("visibility"),
        priority: element.style.getPropertyPriority("visibility"),
      });
      element.style.setProperty("visibility", "hidden", "important");
    }
  }

  async function screenshotScroll(rawY, suppressPinned) {
    if (!screenshotCaptureState) throw new Error("screenshot_state_missing");
    const requested = Number(rawY);
    if (!Number.isFinite(requested) || requested < 0) throw new Error("screenshot_scroll_invalid");
    const scroller = screenshotCaptureState.scroller || document.scrollingElement || document.documentElement;
    const viewport = screenshotCaptureState.inner ? Math.max(1, scroller.clientHeight || 0) : window.innerHeight;
    const height = screenshotCaptureState.inner
      ? Math.max(viewport, scroller.scrollHeight || 0)
      : Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const maximum = Math.max(0, height - viewport);
    const next = Math.min(maximum, requested);
    const waitFrame = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
    if (screenshotCaptureState.inner) {
      if (typeof globalThis.spiralWaitScroll === "function") {
        await globalThis.spiralWaitScroll(scroller, next, waitFrame, 400);
      } else {
        scroller.scrollTop = next;
        await waitFrame(180);
      }
    } else {
      window.scrollTo(0, next);
      const page = document.scrollingElement || document.documentElement;
      if (typeof globalThis.spiralWaitScroll === "function") {
        await globalThis.spiralWaitScroll(page, next, waitFrame, 400);
      } else {
        await waitFrame(180);
      }
    }
    if (suppressPinned === true) suppressPinnedElements();
    await waitFrame(40);
    const liveScroller = screenshotCaptureState.inner ? scroller : (document.scrollingElement || document.documentElement);
    return {
      action: "screenshot_scroll",
      status: "ready",
      scroll_y: Math.round(screenshotCaptureState.inner ? liveScroller.scrollTop : window.scrollY),
      document_height: Math.round(screenshotCaptureState.inner ? liveScroller.scrollHeight : Math.max(height, liveScroller.scrollHeight || 0)),
    };
  }

  function pointElement(x, y) {
    let element = null;
    try { element = document.elementFromPoint(x, y); } catch { element = null; }
    if (!element) throw new Error("control_missing");
    return element;
  }

  function firePointer(target, type, x, y, extra) {
    const EventType = type.startsWith("pointer") ? PointerEvent : type === "wheel" ? WheelEvent : MouseEvent;
    target.dispatchEvent(new EventType(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      pointerId: 1,
      isPrimary: true,
      pointerType: "mouse",
      button: extra?.button ?? 0,
      buttons: extra?.buttons ?? 0,
      deltaX: extra?.deltaX ?? 0,
      deltaY: extra?.deltaY ?? 0,
    }));
  }

  function dispatchTrustedPageInput(message) {
    if (message.action === "key") {
      const key = String(message.key ?? "");
      const codes = {
        Tab: { code: "Tab", vk: 9 },
        Enter: { code: "Enter", vk: 13 },
        Escape: { code: "Escape", vk: 27 },
        ArrowDown: { code: "ArrowDown", vk: 40 },
        ArrowUp: { code: "ArrowUp", vk: 38 },
        ArrowLeft: { code: "ArrowLeft", vk: 37 },
        ArrowRight: { code: "ArrowRight", vk: 39 },
        Home: { code: "Home", vk: 36 },
        End: { code: "End", vk: 35 },
      };
      const mapped = codes[key];
      if (!mapped) throw new Error("cdp_key_invalid");
      const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
      if (typeof target.focus === "function") {
        try { target.focus({ preventScroll: true }); } catch { /* non-focusable */ }
      }
      for (const type of ["keydown", "keyup"]) {
        target.dispatchEvent(new KeyboardEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          key,
          code: mapped.code,
          keyCode: mapped.vk,
          which: mapped.vk,
          view: window,
        }));
      }
      return { action: "key", status: "dispatched", key };
    }
    const x = Number(message.client_x);
    const y = Number(message.client_y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 100_000 || Math.abs(y) > 100_000) {
      throw new Error(message.action === "wheel" ? "cdp_scroll_delta_invalid" : "cdp_hover_point_invalid");
    }
    const element = pointElement(x, y);
    if (message.action === "hover") {
      for (const type of ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove", "pointermove"]) {
        firePointer(element, type, x, y, { button: -1, buttons: 0 });
      }
      return { action: "hover", status: "dispatched", client_x: Math.round(x), client_y: Math.round(y) };
    }
    if (message.action === "wheel") {
      const deltaX = Number(message.delta_x ?? 0);
      const deltaY = Number(message.delta_y ?? 0);
      if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || Math.abs(deltaX) > 100_000 || Math.abs(deltaY) > 100_000) {
        throw new Error("cdp_scroll_delta_invalid");
      }
      firePointer(element, "wheel", x, y, { button: -1, buttons: 0, deltaX, deltaY });
      return {
        action: "wheel",
        status: "dispatched",
        delta_x: deltaX,
        delta_y: deltaY,
        client_x: Math.round(x),
        client_y: Math.round(y),
      };
    }
    const host = (element.closest && element.closest("button, [role='button'], a, summary, input, [role='slider']")) || element;
    for (const type of ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove", "pointermove"]) {
      firePointer(host, type, x, y, { button: -1, buttons: 0 });
    }
    if (typeof host.focus === "function") {
      try { host.focus({ preventScroll: true }); } catch { /* non-focusable */ }
    }
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      firePointer(host, type, x, y, { button: 0, buttons: type === "pointerup" || type === "mouseup" || type === "click" ? 0 : 1 });
    }
    if (host && typeof host.click === "function") {
      try { host.click(); } catch { /* non-clickable */ }
    }
    return { action: "point_click", status: "dispatched", client_x: Math.round(x), client_y: Math.round(y) };
  }

  async function execute(message) {
    if (!message || message.protocol !== PROTOCOL) throw new Error("protocol_invalid");
    if (message.action === "screenshot_metrics") return screenshotMetrics();
    if (message.action === "screenshot_scroll") return screenshotScroll(message.y, message.suppress_pinned);
    if (message.action === "screenshot_restore") return restoreScreenshotCapture();
    if (message.action === "viewport_metrics") {
      // Fixed internal helper for normalized-coordinate dispatch: reports the
      // CURRENT viewport so the worker can denormalize 0-1 coordinates at
      // action time, immune to window resizes since the snapshot.
      return {
        action: "viewport_metrics",
        viewport_width: Math.round(window.innerWidth),
        viewport_height: Math.round(window.innerHeight),
      };
    }
    if (message.action === "page") {
      return {
        origin: location.origin,
        path: location.pathname,
        content_version: 111,
        diagnostics: formDiagnostics(),
        controls: safeControlRows(),
      };
    }
    if (message.action === "disassemble") return disassemblePage(message);
    if (message.action === "read_styles") return readStyles();
    if (message.action === "read_scripts") return readScripts();
    if (message.action === "read_text") {
      return pageText(
        message.max_chars,
        message.read_mode,
        message.long,
        message.background === true,
        message.awakened === true,
      );
    }
    if (message.action === "semantic_snapshot") return semanticSnapshot(message.max_elements);
    if (message.action === "capture_ga4_measurement_id") return captureGa4MeasurementId(message.stream_name, message.domain, message.identity_verified === true);
    if (message.action === "capture_clarity_project_id") return captureClarityProjectId(message.project_name, message.domain, message.identity_verified === true, message.project_id_hint);
    if (message.action === "capture_clarity_token") return clarityTokenCandidate();
    if (message.action === "open_clarity_settings") return openClaritySettings();
    if (message.action === "open_clarity_project") return openClarityProject(message.project_name);
    if (message.action === "clarity_project_identity") return clarityProjectIdentity(message.project_name, message.domain);
    if (message.action === "terms_diagnostics") return termsDiagnostics(message.provider);
    if (message.action === "accept_standard_terms") return acceptStandardTerms(message.provider);
    if (message.action === "accept_owner_authorized_terms") return acceptOwnerAuthorizedTerms(message.provider);
    if (message.action === "select_ga4_target") return selectGa4Target(message.target_name);
    if (message.action === "select_ga4_objective") return selectGa4Objective(message.objective_name);
    if (message.action === "hover" || message.action === "point_click" || message.action === "wheel" || message.action === "key") {
      return dispatchTrustedPageInput(message);
    }
    if (message.action === "click") {
      let element = null;
      let cx = 0;
      let cy = 0;
      const hasPoint = typeof message.screen_x === "number" && Number.isFinite(message.screen_x)
        && typeof message.screen_y === "number" && Number.isFinite(message.screen_y)
        && Math.abs(message.screen_x) <= 100_000 && Math.abs(message.screen_y) <= 100_000;
      if (hasPoint) {
        // Coordinate click: locate the exact point without a semantic name
        // (component selects without accessible names), used with the trusted
        // OS-click path after select_combobox reports the control's point.
        cx = message.screen_x - (window.screenX || 0);
        cy = message.screen_y - (window.screenY || 0);
        try { element = document.elementFromPoint(cx, cy); } catch { element = null; }
        if (!element) throw new Error("control_missing");
      } else {
        element = findControl(message.name, message.role, message.context, message.selector);
      }
      if (element.disabled || element.getAttribute("aria-disabled") === "true") throw new Error("control_disabled");
      flashActionIndicator(element, "click");
      // Hover pre-sequence: a real pointer stream always begins with
      // movement, and flyout/accordion apps open on mouseenter. Dispatch it
      // before any click so hover-revealed menus exist by the time the
      // second semantic click lands on the revealed item.
      {
        const hx = typeof message.screen_x === "number" && Number.isFinite(message.screen_x) ? message.screen_x : 0;
        const hy = typeof message.screen_y === "number" && Number.isFinite(message.screen_y) ? message.screen_y : 0;
        const hoverBox = element.getBoundingClientRect();
        const hoverX = hoverBox.width > 0 ? hoverBox.left + hoverBox.width / 2 : hx;
        const hoverY = hoverBox.height > 0 ? hoverBox.top + hoverBox.height / 2 : hy;
        for (const type of ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove", "pointermove"]) {
          const EventType = type.startsWith("pointer") ? PointerEvent : MouseEvent;
          element.dispatchEvent(new EventType(type, { bubbles: true, cancelable: true, composed: true, view: window, clientX: hoverX, clientY: hoverY, pointerId: 1, isPrimary: true, pointerType: "mouse", buttons: 0 }));
        }
      }
      if (element instanceof HTMLAnchorElement && message.foreground_confirmed !== true) {
        const rawHref = String(element.getAttribute("href") ?? "").trim();
        // SPA placeholders (javascript:void, "#") never navigate; the app
        // reacts to the synthetic pointer sequence below. Dispatched events
        // never execute the javascript: payload and never trigger the
        // default-action navigation of element.click().
        if (rawHref && !/^(?:javascript:|#)/i.test(rawHref)) {
          let target;
          try { target = new URL(element.href, location.href); } catch { throw new Error("link_target_invalid"); }
          if (target.origin !== location.origin) throw new Error("cross_origin_navigation_blocked");
          const previousTarget = element.target;
          if (previousTarget === "_blank") element.target = "_self";
          element.click();
          if (previousTarget === "_blank") element.target = previousTarget;
          return { action: "click", status: "same_tab_navigation_dispatched", value_returned: false };
        }
      }
      // Robust click for component libraries (Material Web, React pointer
      // handlers, Shadow DOM): full pointer/mouse sequence, composed events,
      // overlay-aware hit redirection, plus hit diagnostics.
      try { element.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch {}
      const rect = element.getBoundingClientRect();
      if (!hasPoint) {
        cx = rect.left + (rect.width > 0 ? rect.width / 2 : 0);
        cy = rect.top + (rect.height > 0 ? rect.height / 2 : 0);
      }
      let hit = null;
      try { hit = document.elementFromPoint(cx, cy); } catch { hit = null; }
      const hitInfo = {
        tag: hit ? hit.tagName : null,
        role: hit?.getAttribute ? hit.getAttribute("role") : null,
        name: hit?.getAttribute ? (hit.getAttribute("aria-label") || hit.textContent || "").trim().slice(0, 40) : null,
        inside_control: hit ? (element.contains(hit) || hit.contains(element)) : null,
        visible: rect.width > 0 && rect.height > 0,
        control_tag: element.tagName,
        control_rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        control_aria: element.getAttribute ? (element.getAttribute("aria-label") || element.getAttribute("aria-haspopup") || "") : null,
        control_disabled: element.disabled === true || element.getAttribute("aria-disabled") === "true",
        // The trusted OS-click path must not trust browser-reported screen
        // geometry (window.screenX/devicePixelRatio can drift on scaled or
        // Hackintosh displays). Report pure CSS viewport coordinates plus the
        // viewport size; the host measures the real Chrome window bounds via
        // System Events and converts with an empirically measured scale.
        client_x: Math.round(cx),
        client_y: Math.round(cy),
        viewport_width: Math.round(window.innerWidth),
        viewport_height: Math.round(window.innerHeight),
        dpr: window.devicePixelRatio || 1,
      };
      // An explicitly foreground-confirmed request must not first dispatch a
      // synthetic click: the host will perform exactly one trusted OS click at
      // this verified point after foregrounding the exact managed tab.
      if (message.foreground_confirmed === true) {
        return { action: "click", status: "trusted_click_required", value_returned: false, diagnostics: hitInfo };
      }
      const sequence = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
      const fire = (target) => {
        if (target && typeof target.focus === "function") {
          try { target.focus({ preventScroll: true }); } catch { /* non-focusable */ }
        }
        for (const type of sequence) {
          const eventInit = {
            bubbles: true, cancelable: true, composed: true, view: window,
            button: 0, buttons: type === "pointerup" || type === "mouseup" ? 0 : 1,
            clientX: cx, clientY: cy, screenX: cx, screenY: cy,
          };
          const EventType = type.startsWith("pointer") ? PointerEvent : MouseEvent;
          target.dispatchEvent(new EventType(type, { ...eventInit, pointerId: 1, isPrimary: true, pointerType: "mouse" }));
        }
      };
      fire(element);
      if (hit && hit !== element && !element.contains(hit)) fire(hit);
      // Native click() so Svelte/React delegated handlers activate even when
      // untrusted MouseEvent sequences are ignored. Prefer the nearest host.
      const host = (element.closest && element.closest("button, [role='button'], a, summary, input")) || element;
      let nativeClicked = false;
      if (host && typeof host.click === "function") {
        try {
          host.click();
          nativeClicked = true;
        } catch { /* non-clickable */ }
      }
      // React Select commits an option on pointer-down; a trailing synthetic
      // Enter can immediately clear the committed value after the menu closes.
      // Keep keyboard fallback when native click() is unavailable, never options.
      if (!nativeClicked && elementRole(element) !== "option") {
        const keyTarget = hit && hit !== element && !element.contains(hit) ? hit : element;
        if (typeof keyTarget.focus === "function") {
          try { keyTarget.focus({ preventScroll: true }); } catch { /* non-focusable */ }
        }
        for (const type of ["keydown", "keyup"]) {
          keyTarget.dispatchEvent(new KeyboardEvent(type, {
            bubbles: true, cancelable: true, composed: true, key: "Enter", code: "Enter", keyCode: 13, which: 13, view: window,
          }));
        }
      }
      return { action: "click", status: "dispatched", value_returned: false, diagnostics: hitInfo };
    }
    if (message.action === "press_enter") {
      const element = findControl(message.field, "textbox", message.context, message.selector);
      if (!fillableText(element)) throw new Error("control_not_pressable");
      element.focus({ preventScroll: true });
      for (const type of ["keydown", "keypress", "keyup"]) {
        element.dispatchEvent(new KeyboardEvent(type, {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          composed: true,
          cancelable: true,
        }));
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
      return {
        action: "press_enter",
        status: "dispatched",
        value_returned: false,
        nonempty_after: textValue(element).length > 0,
        value_length_after: textValue(element).length,
      };
    }
    if (message.action === "select_combobox") {
      let control = null;
      try { control = findControl(message.field, "combobox", message.context, message.selector); } catch { control = null; }
      let input = control && (control.matches('input[role="combobox"], textarea, input')
        ? control
        : control.querySelector('input[role="combobox"], input'));
      if (!input) {
        // Searchable component selects keep a visually hidden combobox input;
        // match it by exact aria-label across shadow roots and scope it to the
        // row that still shows an uncommitted placeholder.
        const expected = requestedName(message.field).toLowerCase();
        const roots = [document];
        const matches = [];
        for (let index = 0; index < roots.length && index < 64; index += 1) {
          const root = roots[index];
          for (const element of root.querySelectorAll('input[role="combobox"]')) {
            const label = normalize(element.getAttribute("aria-label") || "");
            if (label.toLowerCase() === expected) matches.push(element);
          }
          for (const element of root.querySelectorAll("*")) {
            if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
          }
        }
        const active = matches.filter((candidate) => {
          let row = candidate.parentElement;
          for (let depth = 0; row && depth < 6; depth += 1, row = row.parentElement) {
            if (/select\.\.\./i.test(normalize(row.innerText || row.textContent || ""))) return true;
          }
          return false;
        });
        const chosen = active.length === 1 ? active[0] : active.length > 1 && matches.length === 1 ? matches[0] : null;
        if (!chosen) throw new Error(active.length ? "control_ambiguous" : "control_missing");
        input = chosen;
      }
      if (!input || !fillableText(input)) throw new Error("control_not_fillable");
      const value = String(message.value ?? "");
      const invalidControl = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
      if (!value || value.length > 200 || /[\r\n]/.test(value) || invalidControl) throw new Error("select_value_invalid");
      // Searchable component selects (React Select and similar) commit their
      // highlighted option on keyboard Enter while the input is focused, even
      // when pointer events are synthetic. Type the filter, open the menu,
      // highlight the first match with ArrowDown, then commit with Enter.
      // Non-searchable selects keep a readOnly input and handle the keyboard
      // on the control container, so dispatch there as well and skip the query.
      input.focus({ preventScroll: true });
      if (!input.readOnly) setNativeValue(input, value);
      // The component control is the nearest visible non-input ancestor
      // (React Select's role=combobox lives on the input itself, so closest()
      // would wrongly return the input; the visible wrapper is the click and
      // keyboard target for the menu).
      let controlRoot = null;
      {
        let node = input.parentElement;
        for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
          if (node instanceof HTMLInputElement) continue;
          const box = node.getBoundingClientRect();
          if (box.width > 0 && box.height > 0) { controlRoot = node; break; }
        }
      }
      const targets = [input];
      if (controlRoot) targets.push(controlRoot);
      // Some component builds open the menu only on the control's pointer
      // events; open it synthetically first, then commit with the keyboard.
      if (controlRoot) {
        const rect = controlRoot.getBoundingClientRect();
        const cx = rect.left + (rect.width > 0 ? rect.width / 2 : 0);
        const cy = rect.top + (rect.height > 0 ? rect.height / 2 : 0);
        for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
          const eventInit = {
            bubbles: true, cancelable: true, composed: true, view: window,
            button: 0, buttons: type === "pointerup" || type === "mouseup" ? 0 : 1,
            clientX: cx, clientY: cy, pointerId: 1, isPrimary: true, pointerType: "mouse",
          };
          const EventType = type.startsWith("pointer") ? PointerEvent : MouseEvent;
          controlRoot.dispatchEvent(new EventType(type, eventInit));
        }
      }
      for (const key of ["ArrowDown", "Enter"]) {
        for (const type of ["keydown", "keyup"]) {
          for (const target of targets) {
            target.dispatchEvent(new KeyboardEvent(type, {
              key,
              code: key,
              bubbles: true,
              composed: true,
              cancelable: true,
            }));
          }
        }
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 120));
      const controlPoint = controlRoot
        ? (() => {
          const box = controlRoot.getBoundingClientRect();
          return {
            client_x: Math.round(box.left + (box.width > 0 ? box.width / 2 : 0)),
            client_y: Math.round(box.top + (box.height > 0 ? box.height / 2 : 0)),
            screen_x: Math.round(window.screenX + box.left + (box.width > 0 ? box.width / 2 : 0)),
            screen_y: Math.round(window.screenY + box.top + (box.height > 0 ? box.height / 2 : 0)),
          };
        })()
        : null;
      return {
        action: "select_combobox",
        status: "dispatched",
        value_returned: false,
        query_length_after: textValue(input).length,
        input_readonly: input.readOnly === true,
        ...(controlPoint
          ? {
            control_client_x: controlPoint.client_x,
            control_client_y: controlPoint.client_y,
            control_screen_x: controlPoint.screen_x,
            control_screen_y: controlPoint.screen_y,
          }
          : {}),
      };
    }
    if (message.action === "fill") {
      const element = findControl(message.field, "textbox", message.context, message.selector);
      if (!fillableText(element)) throw new Error("control_not_fillable");
      flashActionIndicator(element, "fill");
      const value = String(message.value ?? "");
      const multilinePublic = message.multiline_public === true;
      const invalidControl = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
      if (
        !value
        || value.length > (multilinePublic ? 8000 : 500)
        || (!multilinePublic && /[\r\n]/.test(value))
        || invalidControl
      ) throw new Error("fill_value_invalid");
      try { element.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch {}
      setNativeValue(element, value);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
      return {
        action: "fill",
        status: "dispatched",
        value_returned: false,
        nonempty_after: textValue(element).length > 0,
        value_length_after: textValue(element).length,
      };
    }
    if (message.action === "fill_form") {
      const entries = message.entries || message.elements || {};
      const results = [];
      function query(root, sel) {
        let el = root.querySelector(sel);
        if (el) return el;
        for (const item of root.querySelectorAll("*")) {
          if (item.shadowRoot) {
            const sub = query(item.shadowRoot, sel);
            if (sub) return sub;
          }
        }
        return null;
      }
      for (const [key, val] of Object.entries(entries)) {
        try {
          let element = null;
          try { element = query(document, key); } catch {}
          if (!element) {
            try { element = findControl(key, "textbox", message.context); } catch {}
          }
          if (element && fillableText(element)) {
            try { element.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch {}
            setNativeValue(element, String(val));
            results.push({ field: key, success: true });
          } else {
            results.push({ field: key, success: false, error: "not_fillable" });
          }
        } catch (err) {
          results.push({ field: key, success: false, error: err instanceof Error ? err.message : String(err) });
        }
      }
      return {
        action: "fill_form",
        status: "completed",
        results,
        filled_count: results.filter((r) => r.success).length,
      };
    }
    if (message.action === "annotate") {
      const mode = message.mode || "list";
      if (typeof globalThis.spiralAnnotationList !== "function") throw new Error("annotation_runtime_unavailable");
      if (mode === "start") return globalThis.spiralAnnotationStart();
      if (mode === "stop") return globalThis.spiralAnnotationStop();
      if (mode === "list") return globalThis.spiralAnnotationList();
      if (mode === "clear") return globalThis.spiralAnnotationClear();
      if (mode === "remove") return globalThis.spiralAnnotationRemove(String(message.value || message.name || ""));
      if (mode === "add") {
        let element = null;
        if (Number.isFinite(message.client_x) && Number.isFinite(message.client_y)) {
          try { element = document.elementFromPoint(message.client_x, message.client_y); } catch { element = null; }
        } else if (message.name || message.field) {
          try { element = findControl(message.name || message.field, message.role, message.context); } catch { element = null; }
        }
        if (!element || globalThis.spiralIsAnnotationHost?.(element)) throw new Error("annotation_target_missing");
        return globalThis.spiralAnnotationAdd(element, message.value);
      }
      throw new Error("annotation_mode_invalid");
    }
    if (message.action === "inspect_element") {
      const selector = message.selector;
      const field = message.field || message.name;
      function query(root, sel) {
        let el = root.querySelector(sel);
        if (el) return el;
        for (const item of root.querySelectorAll("*")) {
          if (item.shadowRoot) {
            const sub = query(item.shadowRoot, sel);
            if (sub) return sub;
          }
        }
        return null;
      }
      let element = null;
      if (selector) {
        try { element = query(document, selector); } catch {}
      } else if (field) {
        try { element = findControl(field, message.role, message.context); } catch {}
      }
      if (!element) {
        return { action: "inspect_element", found: false, selector: selector || field };
      }
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const isVisible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      const isEditable = element.isContentEditable || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
      let computedSelector = element.id ? `#${element.id}` : element.tagName.toLowerCase();
      if (!element.id && element.getAttribute("data-slot")) computedSelector += `[data-slot="${element.getAttribute("data-slot")}"]`;
      const isChecked = element instanceof HTMLInputElement ? element.checked : element.getAttribute("aria-checked") === "true";
      const isSelected = element.getAttribute("aria-selected") === "true";
      const isExpanded = element.getAttribute("aria-expanded") === "true";
      return {
        action: "inspect_element",
        found: true,
        tag: element.tagName.toLowerCase(),
        selector: computedSelector,
        path: elementHierarchyPath(element),
        role: element.getAttribute("role") || elementRole(element) || null,
        name: (element.getAttribute("aria-label") || element.innerText || "").trim().slice(0, 100) || null,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        viewport_position: {
          top_percent: window.innerHeight > 0 ? Math.round((rect.top / window.innerHeight) * 100) : 0,
          left_percent: window.innerWidth > 0 ? Math.round((rect.left / window.innerWidth) * 100) : 0,
        },
        styles: {
          display: style.display,
          color: style.color,
          background_color: style.backgroundColor,
          border_radius: style.borderRadius,
          font_size: style.fontSize,
          font_family: style.fontFamily,
          padding: style.padding,
          margin: style.margin,
          opacity: style.opacity,
          z_index: style.zIndex,
        },
        aria: {
          role: element.getAttribute("role") || elementRole(element) || null,
          label: element.getAttribute("aria-label") || null,
          expanded: element.hasAttribute("aria-expanded") ? isExpanded : undefined,
          checked: element.hasAttribute("aria-checked") || element instanceof HTMLInputElement ? isChecked : undefined,
          selected: element.hasAttribute("aria-selected") ? isSelected : undefined,
        },
        attributes: {
          id: element.id || undefined,
          data_slot: element.getAttribute("data-slot") || undefined,
          data_testid: element.getAttribute("data-testid") || undefined,
          type: element.getAttribute("type") || undefined,
          placeholder: element.getAttribute("placeholder") || undefined,
          href: element instanceof HTMLAnchorElement ? element.href : undefined,
        },
        state: {
          visible: isVisible,
          disabled: element.disabled === true || element.getAttribute("aria-disabled") === "true",
          focused: document.activeElement === element,
          editable: isEditable,
        },
      };
    }
    if (message.action === "read_markdown") {
      const maxChars = Number.isInteger(message.max_chars) && message.max_chars > 0 ? message.max_chars : 25000;
      function nodeToMd(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent.replace(/\s+/g, " ");
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return "";
        const el = node;
        const tag = el.tagName.toLowerCase();
        if (["script", "style", "noscript", "svg", "template"].includes(tag)) return "";
        const childMd = Array.from(el.childNodes).map(nodeToMd).join("");
        if (/^h[1-6]$/.test(tag)) {
          const lvl = Number(tag[1]);
          return `\n\n${"#".repeat(lvl)} ${childMd.trim()}\n\n`;
        }
        if (tag === "p") return `\n\n${childMd.trim()}\n\n`;
        if (tag === "a" && el.href) return `[${childMd.trim() || el.href}](${el.href})`;
        if (tag === "strong" || tag === "b") return `**${childMd.trim()}**`;
        if (tag === "em" || tag === "i") return `*${childMd.trim()}*`;
        if (tag === "code") {
          if (el.parentElement && el.parentElement.tagName.toLowerCase() === "pre") return childMd;
          return `\`${childMd.trim()}\``;
        }
        if (tag === "pre") {
          const code = el.querySelector("code");
          const lang = code ? (code.className.match(/language-(\w+)/)?.[1] || "") : "";
          return `\n\n\`\`\`${lang}\n${(code ? code.innerText : el.innerText).trim()}\n\`\`\`\n\n`;
        }
        if (tag === "blockquote") return `\n\n> ${childMd.trim().replace(/\n/g, "\n> ")}\n\n`;
        if (tag === "li") return `\n- ${childMd.trim()}`;
        if (tag === "ul" || tag === "ol") return `\n${childMd}\n`;
        if (tag === "table") {
          const rows = Array.from(el.querySelectorAll("tr"));
          if (rows.length === 0) return "";
          const tableLines = [];
          let headerPassed = false;
          for (const tr of rows) {
            const cells = Array.from(tr.querySelectorAll("th, td")).map((c) => (c.innerText || "").trim().replace(/\|/g, "\\|"));
            if (cells.length === 0) continue;
            tableLines.push(`| ${cells.join(" | ")} |`);
            if (!headerPassed) {
              headerPassed = true;
              tableLines.push(`| ${cells.map(() => "---").join(" | ")} |`);
            }
          }
          return `\n\n${tableLines.join("\n")}\n\n`;
        }
        if (tag === "hr") return "\n\n---\n\n";
        if (tag === "img") return `\n![${el.alt || "image"}](${el.src || ""})\n`;
        if (tag === "br") return "\n";
        return childMd;
      }
      const rootNode = document.querySelector("main, [role='main'], article") || document.body || document.documentElement;
      const raw = nodeToMd(rootNode);
      const cleaned = raw.replace(/\n{3,}/g, "\n\n").trim().slice(0, maxChars);
      return {
        action: "read_markdown",
        markdown: redact(cleaned),
        chars: cleaned.length,
      };
    }
    if (message.action === "performance_metrics") {
      const memory = window.performance && window.performance.memory ? {
        used_js_heap_bytes: window.performance.memory.usedJSHeapSize,
        total_js_heap_bytes: window.performance.memory.totalJSHeapSize,
        js_heap_size_limit_bytes: window.performance.memory.jsHeapSizeLimit,
      } : null;
      const navEntries = performance.getEntriesByType ? performance.getEntriesByType("navigation") : [];
      const nav = navEntries[0] || null;
      const timing = nav ? {
        dns_ms: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        connect_ms: Math.round(nav.connectEnd - nav.connectStart),
        ttfb_ms: Math.round(nav.responseStart - nav.requestStart),
        response_ms: Math.round(nav.responseEnd - nav.responseStart),
        dom_interactive_ms: Math.round(nav.domInteractive),
        dom_complete_ms: Math.round(nav.domComplete),
        load_event_ms: Math.round(nav.loadEventEnd),
      } : null;

      const paintEntries = performance.getEntriesByType ? performance.getEntriesByType("paint") : [];
      const fcp = paintEntries.find((p) => p.name === "first-contentful-paint");

      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio || 1,
        scroll_x: window.scrollX || 0,
        scroll_y: window.scrollY || 0,
        scroll_max_y: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      };

      return {
        action: "performance_metrics",
        dom_node_count: document.querySelectorAll("*").length,
        first_contentful_paint_ms: fcp ? Math.round(fcp.startTime) : undefined,
        viewport,
        memory,
        navigation_timing: timing,
      };
    }
    if (message.action === "hover") {
      const selector = message.selector;
      const field = message.field || message.name;
      function query(root, sel) {
        let el = root.querySelector(sel);
        if (el) return el;
        for (const item of root.querySelectorAll("*")) {
          if (item.shadowRoot) {
            const sub = query(item.shadowRoot, sel);
            if (sub) return sub;
          }
        }
        return null;
      }
      let el = null;
      if (selector) {
        try { el = query(document, selector); } catch {}
      } else if (field) {
        try { el = findControl(field, message.role, message.context); } catch {}
      }
      if (el) {
        try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch {}
        const rect = el.getBoundingClientRect();
        const clientX = message.client_x ?? Math.round(rect.x + rect.width / 2);
        const clientY = message.client_y ?? Math.round(rect.y + rect.height / 2);
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX, clientY }));
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, clientX, clientY }));
        return { action: "hover", status: "hovered", selector: selector || field, client_x: clientX, client_y: clientY };
      }
      return { action: "hover", status: "not_found", selector: selector || field };
    }
    if (message.action === "scroll") {
      if (message.selector) {
        const el = queryWithShadow(document, message.selector);
        if (el) {
          try { el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch {}
          return {
            action: "scroll",
            status: "scrolled_to_element",
            selector: message.selector,
            scroll_x: window.scrollX,
            scroll_y: window.scrollY,
          };
        }
      }
      if (message.position === "top") {
        window.scrollTo({ left: 0, top: 0, behavior: "smooth" });
      } else if (message.position === "bottom") {
        window.scrollTo({ left: 0, top: document.body.scrollHeight || document.documentElement.scrollHeight, behavior: "smooth" });
      } else if (message.position === "page_down") {
        window.scrollBy({ left: 0, top: window.innerHeight * 0.85, behavior: "smooth" });
      } else if (message.position === "page_up") {
        window.scrollBy({ left: 0, top: -window.innerHeight * 0.85, behavior: "smooth" });
      } else {
        const deltaX = message.delta_x ?? 0;
        const deltaY = message.delta_y ?? 0;
        window.scrollBy({ left: deltaX, top: deltaY, behavior: "instant" });
      }
      return {
        action: "scroll",
        status: "scrolled",
        scroll_x: window.scrollX,
        scroll_y: window.scrollY,
      };
    }
    if (message.action === "press_key") {
      let rawKey = String(message.key || "Enter");
      let shift = message.modifiers?.includes("Shift") ?? false;
      let alt = message.modifiers?.includes("Alt") ?? false;
      let ctrl = message.modifiers?.includes("Control") ?? false;
      let meta = message.modifiers?.includes("Meta") ?? false;
      if (rawKey.includes("+")) {
        const parts = rawKey.split("+");
        rawKey = parts.pop() || "Enter";
        for (const p of parts) {
          const lp = p.toLowerCase();
          if (lp === "ctrl" || lp === "control") ctrl = true;
          else if (lp === "shift") shift = true;
          else if (lp === "alt" || lp === "option") alt = true;
          else if (lp === "meta" || lp === "cmd" || lp === "command") meta = true;
        }
      }
      let target = document.activeElement;
      if (message.selector) {
        const el = queryWithShadow(document, message.selector);
        if (el) target = el;
      }
      if (!target) target = document.body;
      const eventInit = {
        key: rawKey,
        code: rawKey,
        bubbles: true,
        cancelable: true,
        composed: true,
        shiftKey: shift,
        altKey: alt,
        ctrlKey: ctrl,
        metaKey: meta,
      };
      target.dispatchEvent(new KeyboardEvent("keydown", eventInit));
      target.dispatchEvent(new KeyboardEvent("keypress", eventInit));
      target.dispatchEvent(new KeyboardEvent("keyup", eventInit));
      return { action: "press_key", status: "key_pressed", key: rawKey, modifiers: { shift, alt, ctrl, meta } };
    }
    if (message.action === "drag_and_drop") {
      let srcEl = null;
      let targetEl = null;
      if (message.source_selector || message.selector) {
        srcEl = queryWithShadow(document, message.source_selector || message.selector);
      }
      if (message.target_selector) {
        targetEl = queryWithShadow(document, message.target_selector);
      }
      if (!srcEl && (message.from_x === undefined || message.from_y === undefined)) {
        throw new Error("source element or coordinates required for drag");
      }
      const srcRect = srcEl ? srcEl.getBoundingClientRect() : null;
      const startX = srcRect ? Math.round(srcRect.left + srcRect.width / 2) : (message.from_x ?? 0);
      const startY = srcRect ? Math.round(srcRect.top + srcRect.height / 2) : (message.from_y ?? 0);

      const targetRect = targetEl ? targetEl.getBoundingClientRect() : null;
      const endX = targetRect ? Math.round(targetRect.left + targetRect.width / 2) : (message.to_x ?? startX);
      const endY = targetRect ? Math.round(targetRect.top + targetRect.height / 2) : (message.to_y ?? startY);

      if (srcEl) flashActionIndicator(srcEl, "click");

      const dt = typeof DataTransfer !== "undefined" ? new DataTransfer() : null;
      const dragTarget = srcEl || document.elementFromPoint(startX, startY) || document.body;
      const dropTarget = targetEl || document.elementFromPoint(endX, endY) || document.body;

      dragTarget.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: startX, clientY: startY, button: 0, buttons: 1, isPrimary: true, pointerId: 1, pointerType: "mouse" }));
      dragTarget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: startX, clientY: startY, button: 0, buttons: 1 }));
      if (dt) {
        dragTarget.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, clientX: startX, clientY: startY, dataTransfer: dt }));
      }

      const steps = 5;
      for (let i = 1; i <= steps; i++) {
        const cx = Math.round(startX + (endX - startX) * (i / steps));
        const cy = Math.round(startY + (endY - startY) * (i / steps));
        const currEl = document.elementFromPoint(cx, cy) || document.body;
        currEl.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, cancelable: true, clientX: cx, clientY: cy, buttons: 1, isPrimary: true, pointerId: 1, pointerType: "mouse" }));
        currEl.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: cx, clientY: cy, buttons: 1 }));
        if (dt) {
          currEl.dispatchEvent(new DragEvent("drag", { bubbles: true, cancelable: true, clientX: cx, clientY: cy, dataTransfer: dt }));
          currEl.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, clientX: cx, clientY: cy, dataTransfer: dt }));
        }
      }

      if (dt) {
        dropTarget.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, dataTransfer: dt }));
        dropTarget.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, dataTransfer: dt }));
        dropTarget.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, dataTransfer: dt }));
        dragTarget.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, dataTransfer: dt }));
      }
      dropTarget.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, button: 0, buttons: 0, isPrimary: true, pointerId: 1, pointerType: "mouse" }));
      dropTarget.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, button: 0, buttons: 0 }));

      if (targetEl) flashActionIndicator(targetEl, "fill");

      return {
        action: "drag_and_drop",
        status: "dragged",
        from: { x: startX, y: startY },
        to: { x: endX, y: endY },
      };
    }
    if (message.action === "upload_file") {
      let inputEl = null;
      if (message.selector) {
        inputEl = queryWithShadow(document, message.selector);
      } else {
        inputEl = document.querySelector("input[type='file']");
      }
      if (!inputEl) throw new Error("file_input_missing");
      const files = Array.isArray(message.files) ? message.files : [];
      if (files.length === 0 && message.file_name) {
        files.push({
          name: message.file_name,
          type: message.file_type || "text/plain",
          content: message.file_content || "",
        });
      }
      if (files.length === 0) throw new Error("no_files_provided");
      const dt = new DataTransfer();
      for (const f of files) {
        let blob;
        if (f.base64) {
          const byteChars = atob(f.base64);
          const byteNums = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
          blob = new Blob([new Uint8Array(byteNums)], { type: f.type || "application/octet-stream" });
        } else {
          blob = new Blob([f.content ?? ""], { type: f.type || "text/plain" });
        }
        const file = new File([blob], f.name || "upload.txt", { type: f.type || blob.type });
        dt.items.add(file);
      }
      inputEl.files = dt.files;
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      flashActionIndicator(inputEl, "fill");
      return {
        action: "upload_file",
        status: "uploaded",
        file_count: dt.files.length,
        files: Array.from(dt.files).map((f) => ({ name: f.name, size: f.size, type: f.type })),
      };
    }
    if (message.action === "read_console") {
      const level = typeof message.level === "string" ? message.level : undefined;
      const filtered = level ? consoleRecords.filter((r) => r.level === level) : consoleRecords;
      return {
        action: "read_console",
        messages: filtered.slice(-60),
        total_count: consoleRecords.length,
      };
    }
    if (message.action === "read_network") {
      const entries = performance.getEntriesByType ? performance.getEntriesByType("resource") : [];
      const resourceRecords = entries.slice(-40).map((e) => ({
        name: redact(e.name).slice(0, 300),
        initiatorType: e.initiatorType,
        duration_ms: Math.round(e.duration),
        transfer_bytes: e.transferSize,
        status: e.responseStatus || undefined,
      }));
      return {
        action: "read_network",
        in_flight_count: inFlightRequests,
        intercepted_requests: networkRecords.slice(-40),
        resource_timing_requests: resourceRecords,
        requests: networkRecords.length > 0 ? networkRecords.slice(-40) : resourceRecords,
        total_count: networkRecords.length + entries.length,
      };
    }
    if (message.action === "evaluate_script") {
      const script = String(message.script || "");
      if (!script || script.length > 50000) throw new Error("script_invalid");
      let evalResult;
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        let fn;
        try {
          fn = new AsyncFunction(`return (${script});`);
        } catch {
          fn = new AsyncFunction(script);
        }
        evalResult = await fn.call(window);
      } catch (err) {
        return {
          action: "evaluate_script",
          success: false,
          error: redact(err instanceof Error ? (err.stack || err.message) : String(err)),
        };
      }
      let serializable = evalResult;
      if (typeof evalResult === "object" && evalResult !== null) {
        if (evalResult instanceof Node) {
          const rect = evalResult instanceof Element ? evalResult.getBoundingClientRect() : null;
          serializable = {
            nodeType: evalResult.nodeType,
            nodeName: evalResult.nodeName,
            textContent: evalResult.textContent?.slice(0, 1000),
            id: evalResult instanceof Element ? evalResult.id : undefined,
            className: evalResult instanceof Element ? evalResult.className : undefined,
            rect: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } : undefined,
          };
        } else {
          try {
            serializable = JSON.parse(JSON.stringify(evalResult));
          } catch {
            serializable = String(evalResult);
          }
        }
      }
      return {
        action: "evaluate_script",
        success: true,
        result: serializable,
      };
    }
    if (message.action === "read_storage") {
      const local = {};
      const session = {};
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) local[k] = localStorage.getItem(k); } } catch {}
      try { for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if (k) session[k] = sessionStorage.getItem(k); } } catch {}
      return {
        action: "read_storage",
        local_storage: local,
        session_storage: session,
      };
    }
    if (message.action === "clear_storage") {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      return { action: "clear_storage", status: "storage_cleared" };
    }
    if (message.action === "wait_for") {
      const timeout = Number.isInteger(message.timeout_ms) && message.timeout_ms > 0 ? message.timeout_ms : 5000;
      const start = Date.now();
      const selector = message.selector;
      const script = message.script;
      const expectedText = message.text ? normalize(message.text).toLowerCase() : undefined;
      const condition = message.condition || (message.network_idle ? "network_idle" : expectedText ? "text" : "visible");

      if (!selector && !script && !expectedText && condition !== "network_idle") {
        throw new Error("selector_or_script_required");
      }

      while (Date.now() - start < timeout) {
        let ready = false;
        if (condition === "network_idle") {
          if (inFlightRequests === 0) {
            await new Promise((res) => setTimeout(res, 200));
            if (inFlightRequests === 0) ready = true;
          }
        } else if (selector) {
          const el = queryWithShadow(document, selector);
          if (condition === "hidden") {
            ready = !el || (el instanceof HTMLElement && (el.offsetWidth === 0 || el.offsetHeight === 0 || window.getComputedStyle(el).display === "none"));
          } else {
            if (el instanceof Element) {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              const isVisible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
              if (expectedText) {
                ready = isVisible && (el.textContent || "").toLowerCase().includes(expectedText);
              } else {
                ready = isVisible || condition === "attached";
              }
            }
          }
        } else if (expectedText) {
          ready = (document.body?.innerText || "").toLowerCase().includes(expectedText);
        } else if (script) {
          try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction(`return (${script});`);
            ready = Boolean(await fn.call(window));
          } catch {
            try { ready = Boolean(window.eval(script)); } catch {}
          }
        }
        if (ready) {
          return { action: "wait_for", status: "ready", condition, duration_ms: Date.now() - start };
        }
        await new Promise((res) => setTimeout(res, 80));
      }
      throw new Error(`wait_for_timeout_${timeout}ms`);
    }
    throw new Error("action_invalid");
  }

  function announceStripeFrame() {
    if (window.top === window || !/(?:^|\.)stripe\.com$/i.test(location.hostname)) return;
    try {
      const pending = chrome.runtime.sendMessage({ protocol: PROTOCOL, kind: "stripe_frame_ready" });
      if (pending && typeof pending.catch === "function") pending.catch(() => {});
    } catch { /* the top-level browser boundary still works */ }
  }

  announceStripeFrame();

  
  function readStyles() {
    // Read-only design-signature extraction from the rendered page and its
    // shadow roots: theme tokens plus representative element styles from the
    // component preview itself (radii, typography, spacing, card treatment).
    // No raw values, credentials, cookies or user content are returned.
    const style = getComputedStyle(document.documentElement);
    const tokens = {};
    for (const name of [
      "--background", "--foreground", "--card", "--card-foreground",
      "--primary", "--primary-foreground", "--secondary", "--secondary-foreground",
      "--muted", "--muted-foreground", "--accent", "--accent-foreground",
      "--border", "--input", "--ring", "--radius",
    ]) {
      const value = style.getPropertyValue(name).trim();
      if (value) tokens[name] = value;
    }
    const bodyStyle = getComputedStyle(document.body);
    const css = [];
    for (const sheet of [...document.styleSheets]) {
      try {
        for (const rule of [...sheet.cssRules]) {
          if (rule.selectorText && /^[a-z][a-z0-9_-]*(?:\s*,?\s*[a-z][a-z0-9_-]*)*$/i.test(rule.selectorText)) {
            const text = rule.cssText.slice(0, 300);
            if (/(?:background(?:-color|-image)?|color|border-radius|font-family|font-size|padding|gap|gradient|box-shadow)/i.test(text)) {
              css.push(text);
            }
          }
        }
      } catch {}
    }
    // Walk shadow roots and collect representative element styles: one entry
    // per distinct tag/class group with the resolved computed style that
    // defines the component's visual signature. Deep traversal reaches the
    // block preview inside nested shadow roots.
    const groups = new Map();
    function collect(root, depth) {
      if (depth > 14) return;
      const walker = document.createTreeWalker ? null : null;
      const nodes = root.querySelectorAll ? root.querySelectorAll("*") : [];
      for (const el of nodes) {
        if (!(el instanceof HTMLElement)) continue;
        const tag = el.tagName.toLowerCase();
        if (["script", "style", "noscript", "template", "link", "meta"].includes(tag)) continue;
        const box = el.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) continue;
        const cs = getComputedStyle(el);
        const key = tag + "." + String(el.className || "").split(/\s+/).filter(Boolean).slice(0, 2).join(".");
        if (!key || groups.has(key)) continue;
        // Skip generic chrome wrappers: no distinctive style beyond defaults.
        const distinctive = cs.fontSize !== "15px" || cs.fontWeight !== "400" || cs.borderRadius !== "0px"
          || (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)")
          || (cs.borderStyle && cs.borderStyle !== "none")
          || (cs.boxShadow && cs.boxShadow !== "none")
          || (cs.padding && cs.padding !== "0px" && cs.padding !== "5.25px 14px" && cs.padding !== "0px 10.5px")
          || (cs.gap && cs.gap !== "normal" && cs.gap !== "1px" && cs.gap !== "3.5px" && cs.gap !== "7px");
        if (!distinctive) continue;
        const record = {
          tag,
          cls: String(el.className || "").slice(0, 120),
          fontFamily: cs.fontFamily.slice(0, 120),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
          background: cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : "",
          borderRadius: cs.borderRadius !== "0px" ? cs.borderRadius : "",
          padding: cs.padding !== "0px" ? cs.padding : "",
          gap: cs.gap && cs.gap !== "normal" ? cs.gap : "",
          border: cs.borderStyle !== "none" ? cs.borderWidth + " " + cs.borderStyle + " " + cs.borderColor : "",
          boxShadow: cs.boxShadow !== "none" ? cs.boxShadow.slice(0, 120) : "",
          textAlign: cs.textAlign !== "start" ? cs.textAlign : "",
        };
        groups.set(key, record);
        if (groups.size >= 60) return;
      }
      for (const el of root.querySelectorAll ? root.querySelectorAll("*") : []) {
        if (el.shadowRoot) collect(el.shadowRoot, depth + 1);
        if (el.tagName === "PLASMO-CSUI" && el.shadowRoot) collect(el.shadowRoot, depth + 1);
      }
    }
    collect(document, 0);
    // Plasmo content-script UI hosts the block preview inside its shadow.
    for (const host of document.querySelectorAll("plasmo-csui")) {
      if (host.shadowRoot) collect(host.shadowRoot, 0);
    }
    const samples = [...groups.values()].slice(0, 60);
    return {
      action: "read_styles",
      tokens,
      body: {
        background: bodyStyle.backgroundColor,
        color: bodyStyle.color,
        fontFamily: bodyStyle.fontFamily.slice(0, 200),
        fontSize: bodyStyle.fontSize,
      },
      css_rules: [...new Set(css)].slice(0, 40),
      element_samples: samples,
      value_returned: true,
    };
  }

  function disassemblePage(options = {}) {
    const maxSections = options.max_sections || 20;
    const bodyStyle = window.getComputedStyle(document.body);
    
    // 1. Extract Global Design Tokens
    const colorMap = new Map();
    const radiusMap = new Map();
    const fontMap = new Map();
    
    function record(map, key) {
      if (!key || key === "transparent" || key === "rgba(0, 0, 0, 0)" || key === "none") return;
      map.set(key, (map.get(key) || 0) + 1);
    }

    const allElements = document.querySelectorAll("header, nav, main, section, article, footer, aside, h1, h2, h3, h4, p, button, a, input, [class*='card'], [class*='hero'], [class*='grid']");
    for (const el of allElements) {
      const s = window.getComputedStyle(el);
      record(colorMap, s.backgroundColor);
      record(colorMap, s.color);
      record(colorMap, s.borderColor);
      record(radiusMap, s.borderRadius);
      record(fontMap, s.fontFamily);
    }

    const topColors = [...colorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([c]) => c);
    const topRadii = [...radiusMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([r]) => r);
    const topFonts = [...fontMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f.slice(0, 120));

    // Typography scale
    const headings = {};
    for (let level = 1; level <= 6; level++) {
      const hEl = document.querySelector(`h${level}`);
      if (hEl) {
        const hs = window.getComputedStyle(hEl);
        headings[`h${level}`] = {
          fontSize: hs.fontSize,
          fontWeight: hs.fontWeight,
          lineHeight: hs.lineHeight,
          letterSpacing: hs.letterSpacing,
          fontFamily: hs.fontFamily.slice(0, 100),
          color: hs.color,
          sampleText: (hEl.textContent || "").trim().slice(0, 80),
        };
      }
    }

    const bodyTextSample = document.querySelector("p");
    const bodyTypography = bodyTextSample ? {
      fontSize: window.getComputedStyle(bodyTextSample).fontSize,
      lineHeight: window.getComputedStyle(bodyTextSample).lineHeight,
      fontWeight: window.getComputedStyle(bodyTextSample).fontWeight,
      color: window.getComputedStyle(bodyTextSample).color,
    } : {
      fontSize: bodyStyle.fontSize,
      lineHeight: bodyStyle.lineHeight,
      color: bodyStyle.color,
    };

    // 2. Structural Section Blueprint Breakdown
    const sections = [];
    const sectionCandidates = document.querySelectorAll("header, nav, section, [role='region'], main > div, footer");
    
    for (const sec of sectionCandidates) {
      if (sections.length >= maxSections) break;
      const rect = sec.getBoundingClientRect();
      if (rect.height < 50 || rect.width < 100) continue;

      const tagName = sec.tagName.toLowerCase();
      const h = sec.querySelector("h1, h2, h3, h4");
      const title = h ? (h.textContent || "").trim().slice(0, 100) : "";
      const p = sec.querySelector("p");
      const desc = p ? (p.textContent || "").trim().slice(0, 150) : "";
      
      const buttons = [...sec.querySelectorAll("button, a[class*='btn'], a[class*='button'], a[role='button']")].slice(0, 4).map(b => (b.textContent || "").trim().slice(0, 40)).filter(Boolean);
      const items = sec.querySelectorAll("[class*='card'], [class*='item'], li, article").length;
      
      let archetype = "content";
      const textSnippet = (sec.textContent || "").slice(0, 500).toLowerCase();
      
      if (tagName === "header" || tagName === "nav" || sec.getAttribute("role") === "navigation") archetype = "header";
      else if (tagName === "footer" || sec.getAttribute("role") === "contentinfo") archetype = "footer";
      else if (h?.tagName === "H1" || sec.classList.contains("hero") || (textSnippet.includes("get started") && sections.length <= 1)) archetype = "hero";
      else if (textSnippet.includes("pricing") || textSnippet.includes("per month") || textSnippet.includes("/mo")) archetype = "pricing";
      else if (textSnippet.includes("frequently asked") || textSnippet.includes("faq") || sec.querySelector("details")) archetype = "question";
      else if (textSnippet.includes("changelog") || textSnippet.includes("release notes")) archetype = "changelog";
      else if (textSnippet.includes("testimonial") || textSnippet.includes("what our customers say") || sec.querySelector("blockquote")) archetype = "testimonial";
      else if (textSnippet.includes("compare") || sec.querySelector("table")) archetype = "comparator";
      else if (items >= 3) archetype = "listing";

      sections.push({
        index: sections.length,
        archetype,
        tagName,
        title,
        description: desc,
        ctaButtons: buttons,
        itemsCount: items,
        computedStyles: {
          background: window.getComputedStyle(sec).backgroundColor,
          padding: `${window.getComputedStyle(sec).paddingTop} ${window.getComputedStyle(sec).paddingRight} ${window.getComputedStyle(sec).paddingBottom} ${window.getComputedStyle(sec).paddingLeft}`,
          display: window.getComputedStyle(sec).display,
          gridTemplateColumns: window.getComputedStyle(sec).gridTemplateColumns,
        },
      });
    }

    // 3. SVG & Icon Extraction
    const svgs = [];
    const svgNodes = document.querySelectorAll("svg");
    for (const svg of svgNodes) {
      if (svgs.length >= 15) break;
      const viewBox = svg.getAttribute("viewBox") || "";
      const width = svg.clientWidth || svg.getAttribute("width") || "";
      const height = svg.clientHeight || svg.getAttribute("height") || "";
      const ariaLabel = svg.getAttribute("aria-label") || svg.closest("button, a")?.getAttribute("aria-label") || "";
      svgs.push({ viewBox, width, height, label: ariaLabel });
    }

    // 4. CSS Custom Variables
    const cssVars = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === ":root" || rule.selectorText === "html" || rule.selectorText === "body") {
            const style = rule.style;
            for (let i = 0; i < style.length; i++) {
              const prop = style[i];
              if (prop.startsWith("--")) {
                cssVars[prop] = style.getPropertyValue(prop).trim().slice(0, 100);
              }
            }
          }
        }
      } catch { /* ignore cross-origin stylesheets */ }
    }

    return {
      action: "disassemble",
      url: location.href,
      title: document.title,
      theme: bodyStyle.backgroundColor.includes("rgb(0, 0, 0)") || bodyStyle.backgroundColor.includes("rgb(1") || bodyStyle.backgroundColor.includes("rgb(2") ? "dark" : "light",
      tokens: {
        body: {
          background: bodyStyle.backgroundColor,
          color: bodyStyle.color,
          fontFamily: bodyStyle.fontFamily.slice(0, 150),
        },
        typography: {
          headings,
          body: bodyTypography,
        },
        colors: topColors,
        radii: topRadii,
        fonts: topFonts,
        cssVariables: Object.entries(cssVars).slice(0, 30),
      },
      sections,
      svgCount: svgNodes.length,
      sampleSvgs: svgs,
      meta: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        timestamp: new Date().toISOString(),
      },
    };
  }

  function readScripts() {
    // Read-only script-signature extraction: src/type/module attributes,
    // inline size and async/defer flags for every script on the page and in
    // shadow roots. Script contents are never returned and nothing is
    // executed; hashes are computed from the element attributes only.
    const seen = new Set();
    const rows = [];
    function collect(root) {
      const nodes = root.querySelectorAll ? root.querySelectorAll("script") : [];
      for (const el of nodes) {
        if (!(el instanceof HTMLScriptElement)) continue;
        const src = el.src || "";
        const key = src || (el.textContent || "").slice(0, 64);
        if (seen.has(key)) continue;
        seen.add(key);
        const inline = src ? 0 : (el.textContent || "").length;
        rows.push({
          src: src.slice(0, 500),
          type: el.type || "classic",
          module: el.type === "module",
          async: el.async,
          defer: el.defer,
          inline_chars: inline > 0 ? inline : undefined,
          integrity: el.integrity ? "present" : undefined,
        });
        if (rows.length >= 100) return;
      }
      for (const el of root.querySelectorAll ? root.querySelectorAll("*") : []) {
        if (el.shadowRoot) collect(el.shadowRoot);
      }
    }
    collect(document);
    return { scripts: rows.slice(0, 100), script_count: rows.length, contents_returned: false };
  }


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return false;
    execute(message).then(
      (result) => sendResponse({ ok: true, result }),
      (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "content_failure" }),
    );
    return true;
  });
})();
