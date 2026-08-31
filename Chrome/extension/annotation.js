(() => {
  const HOST_ATTR = "data-holar-annotation";
  const ELEMENT_ID_ATTR = "data-holar-element-id";
  const MAX_ITEMS = 24;
  const MAX_NOTE = 2000;
  const MAX_TEXT = 200;
  const MAX_ATTR = 200;
  const MAX_EXTRA = 8000;
  const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const TOKEN = /\b(?:ya29\.[A-Za-z0-9._~-]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g;
  const SECRET_ATTR = /^(?:value|password|token|secret|authorization|cookie|session)$/i;
  const PALETTE = ["#3a96dd", "#7c5cff", "#22c55e", "#f59e0b", "#22d3ee", "#e879f9", "#ef4444", "#eab308"];
  const HOVER = "#3a96dd";

  let picking = true;
  let listening = false;
  let lastPickAt = 0;
  let syncScheduled = false;
  let items = [];
  let prompt = "";
  let elementIdCounter = 0;
  let hoverTarget = null;
  let classVisible = false;
  let host = null;
  let highlight = null;
  let highlightLabel = null;
  let hud = null;

  function boundNote(raw) {
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    const value = String(raw ?? "")
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
      .replace(EMAIL, "[identity]")
      .replace(TOKEN, "[secret]")
      .trim()
      .slice(0, MAX_NOTE);
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    return value;
  }

  function boundText(raw, limit) {
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    const value = String(raw ?? "")
      .replace(/\s+/g, " ")
      .replace(EMAIL, "[identity]")
      .replace(TOKEN, "[secret]")
      .trim()
      .slice(0, limit ?? MAX_TEXT);
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    return value;
  }

  function classNameOf(element) {
    const value = element?.className;
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value.baseVal === "string" && value.baseVal.trim()) return value.baseVal;
    const attr = element?.getAttribute?.("class");
    if (typeof attr === "string" && attr.trim()) return attr;
    const list = element?.classList;
    if (list && typeof list.length === "number" && list.length > 0) return Array.from(list).join(" ");
    return "";
  }

  function slotOf(element) {
    return boundText(element?.getAttribute?.("data-slot") || "", 80);
  }

  function isUsefulSurface(element) {
    if (!element || typeof element.getAttribute !== "function") return false;
    if (slotOf(element)) return true;
    if (/\bvariant-/.test(classNameOf(element))) return true;
    const role = String(element.getAttribute("role") || "");
    if (/^(button|link|dialog|menu|tab|combobox|listbox|option)$/i.test(role)) return true;
    const tag = String(element.tagName || "").toLowerCase();
    return /^(button|a|input|select|textarea|summary)$/.test(tag);
  }

  function annotateTarget(node) {
    let current = node;
    let fallback = node;
    for (let hops = 0; current && hops < 12; hops += 1) {
      if (isAnnotationHost(current)) break;
      if (typeof current.tagName === "string") {
        fallback = current;
        if (isUsefulSurface(current)) return current;
      }
      current = current.parentElement;
    }
    return fallback;
  }

  function paletteColor(index) {
    return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
  }

  function itemForElement(element) {
    const uniqueId = element?.getAttribute?.(ELEMENT_ID_ATTR);
    if (!uniqueId) return null;
    return items.find((item) => item.uniqueId === uniqueId) || null;
  }

  function colorForElement(element) {
    return itemForElement(element)?.color || paletteColor(items.length);
  }

  function classPreview(className, limit) {
    const text = String(className || "").trim().replace(/\s+/g, " ");
    if (!text) return "";
    const cap = Number(limit) > 0 ? Number(limit) : 96;
    return text.length > cap ? `${text.slice(0, cap - 1)}…` : text;
  }

  function componentFromSlot(slot) {
    const parts = String(slot || "").trim().split("-").filter(Boolean);
    if (parts.length === 0) return "";
    const title = (word) => word.charAt(0).toUpperCase() + word.slice(1);
    if (parts.length === 1) return title(parts[0]);
    return `${title(parts[0])}.${parts.slice(1).map(title).join("")}`;
  }

  function identityCards(item) {
    const tag = String(item.tag || item.element || item.tagName || "div").toLowerCase();
    const htmlId = String(item.domId || "").trim();
    const element = htmlId ? `${tag}#${htmlId}` : tag || "—";
    const component = String(item.component || componentFromSlot(item.slot) || "").trim() || "—";
    const className = classPreview(item.className, 240) || "—";
    return { element, component, className };
  }

  function identityFromElement(element) {
    const react = spiralGetReactComponentInfo(element);
    return identityCards({
      tag: String(element?.tagName || "div").toLowerCase(),
      domId: element?.id || "",
      slot: slotOf(element),
      component: react?.name || "",
      className: classNameOf(element),
    });
  }

  function overlayFields(cards, revealClass) {
    const fields = [
      { key: "element", label: "Element", value: cards.element },
      { key: "component", label: "Component", value: cards.component },
    ];
    if (revealClass) fields.push({ key: "class", label: "Class", value: cards.className });
    return fields;
  }

  function chipLabel(item) {
    const cards = identityCards(item);
    const parts = [cards.element, cards.component];
    if (classVisible && cards.className && cards.className !== "—") parts.push(cards.className);
    return parts.filter((part) => part && part !== "—").join(" · ");
  }

  function clearNode(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function fillCardRow(row, cards, color) {
    clearNode(row);
    const fields = overlayFields(cards, classVisible);
    fields.forEach((field, index) => {
      const card = document.createElement("div");
      card.setAttribute(HOST_ATTR, `card-${field.key}`);
      card.style.cssText = [
        "min-width:0",
        "padding:8px 10px",
        index < fields.length - 1 ? "box-shadow:inset -1px 0 0 rgba(255,255,255,0.1)" : "",
      ].filter(Boolean).join(";");
      const caption = document.createElement("div");
      caption.setAttribute(HOST_ATTR, "card-label");
      caption.textContent = field.label;
      caption.style.cssText = "font:600 9px/1.2 ui-sans-serif,system-ui,sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px;";
      const value = document.createElement("div");
      value.setAttribute(HOST_ATTR, "card-value");
      const empty = !field.value || field.value === "—";
      const mono = field.key === "element" || field.key === "class";
      value.style.cssText = [
        empty ? "opacity:0.45" : "opacity:1",
        "color:#fff",
        mono
          ? "font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace"
          : "font:600 12px/1.35 ui-sans-serif,system-ui,sans-serif",
        "word-break:break-word",
        "max-height:4.5em",
        "overflow:hidden",
      ].join(";");
      if (field.key === "class" && !empty) {
        value.style.cssText += ";display:flex;flex-wrap:wrap;gap:4px;max-height:5.2em;";
        String(field.value).split(/\s+/).filter(Boolean).forEach((token) => {
          const pill = document.createElement("span");
          pill.setAttribute(HOST_ATTR, "class-token");
          pill.textContent = token;
          pill.style.cssText = "display:inline-block;padding:1px 5px;border-radius:4px;background:rgba(255,255,255,0.08);font:500 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;";
          value.appendChild(pill);
        });
      } else {
        value.textContent = field.value;
      }
      card.appendChild(caption);
      card.appendChild(value);
      row.appendChild(card);
    });
    row.style.boxShadow = `0 12px 40px rgba(15,23,42,0.28), inset 0 2px 0 ${color}`;
  }

  function placeCardRow(row, rect, color, cards) {
    const viewportWidth = Number(window.innerWidth) || 800;
    const viewportHeight = Number(window.innerHeight) || 600;
    const columns = classVisible ? 3 : 2;
    const width = Math.min(
      Math.max(Number(rect.width) || 0, columns === 3 ? 420 : 300),
      Math.max(280, viewportWidth - 24),
    );
    row.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "visibility:hidden",
      `width:${width}px`,
      "display:grid",
      `grid-template-columns:repeat(${columns}, minmax(0, 1fr))`,
      "align-items:stretch",
      "background:rgba(15,23,42,0.92)",
      "color:#fff",
      "border-radius:12px",
      "overflow:hidden",
      "pointer-events:none",
      "z-index:2147483647",
      "box-sizing:border-box",
      "backdrop-filter:blur(16px)",
      "-webkit-backdrop-filter:blur(16px)",
    ].join(";");
    fillCardRow(row, cards, color);
    let height = columns === 3 ? 92 : 60;
    try {
      const box = typeof row.getBoundingClientRect === "function" ? row.getBoundingClientRect() : null;
      if (box && box.height > 0) height = box.height;
    } catch {}
    const left = Math.min(Math.max(12, Number(rect.x ?? rect.left) || 0), Math.max(12, viewportWidth - width - 12));
    const above = (Number(rect.y ?? rect.top) || 0) - height - 8;
    const below = (Number(rect.y ?? rect.top) || 0) + (Number(rect.height) || 0) + 8;
    const top = above >= 12
      ? above
      : Math.min(below, Math.max(12, viewportHeight - height - 12));
    row.style.left = `${left}px`;
    row.style.top = `${top}px`;
    row.style.visibility = "visible";
  }

  function serializeValue(value, depth, seen) {
    if (value == null) return value;
    const kind = typeof value;
    if (kind === "string") return boundText(value, 200);
    if (kind === "number" || kind === "boolean") return value;
    if (kind === "function") return "[Function]";
    if (typeof Node !== "undefined" && value instanceof Node) return "[DOM Node]";
    if (typeof Window !== "undefined" && value instanceof Window) return "[DOM Node]";
    if (value && kind === "object" && value.$$typeof) return "[React Element]";
    if (depth >= 4) return Array.isArray(value) ? `[Array: ${value.length}]` : "[Object]";
    if (kind === "object") {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    if (Array.isArray(value)) {
      return value.slice(0, 20).map((entry) => serializeValue(entry, depth + 1, seen));
    }
    if (kind === "object") {
      const result = {};
      const keys = Object.keys(value).slice(0, 24);
      for (const key of keys) {
        if (SECRET_ATTR.test(key)) continue;
        try {
          result[key] = serializeValue(value[key], depth + 1, seen);
        } catch {
          result[key] = "[Error]";
        }
      }
      return result;
    }
    return String(value);
  }

  function spiralGetReactComponentInfo(element) {
    if (!element || typeof element !== "object") return null;
    try {
      const reactKey = Object.keys(element).find((key) => (
        key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")
      ));
      if (reactKey) {
        let fiber = element[reactKey];
        while (fiber) {
          const typeToCheck = fiber.elementType || fiber.type;
          let name = null;
          if (typeof typeToCheck === "function") {
            name = typeToCheck.displayName || typeToCheck.name || null;
          } else if (typeToCheck && typeof typeToCheck === "object") {
            if (typeToCheck.render) name = typeToCheck.render.displayName || typeToCheck.render.name || "ForwardRef";
            else if (typeToCheck.displayName || typeToCheck.name) name = typeToCheck.displayName || typeToCheck.name;
          }
          if (name && name.length > 1 && /^[A-Z]/.test(name)) {
            const props = fiber.memoizedProps || fiber.pendingProps || null;
            return {
              name,
              props: props ? serializeValue(props, 0, new WeakSet()) : null,
            };
          }
          fiber = fiber.return;
        }
      }
      let node = element;
      while (node && node !== document?.documentElement) {
        const vue = node.__vueParentComponent || node.__vue__;
        const vueName = vue?.type?.displayName || vue?.type?.name || vue?.type?.__name || vue?.$options?.name;
        if (vueName && vueName.length > 1 && /^[A-Z]/.test(vueName)) {
          return { name: vueName, props: serializeValue(vue?.props || vue?.$props || null, 0, new WeakSet()) };
        }
        const svelte = node.__svelte_meta?.component?.constructor
          || node.__svelte_meta?.parent?.component?.constructor;
        const svelteName = svelte?.displayName || svelte?.name;
        if (svelteName && svelteName.length > 1 && /^[A-Z]/.test(svelteName)) {
          return { name: svelteName, props: null };
        }
        node = node.parentElement;
      }
    } catch {
      return null;
    }
    return null;
  }

  function spiralGetElementPath(element) {
    const path = [];
    let current = element;
    while (current && current !== document?.body && current !== document?.documentElement) {
      if (!current.tagName) break;
      let selector = String(current.tagName).toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
      } else {
        const classes = classNameOf(current).trim().split(/\s+/).filter((item) => item);
        if (classes.length > 0) selector += `.${classes.join(".")}`;
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children || []).filter((sibling) => {
            if (sibling.tagName !== current.tagName) return false;
            const siblingClasses = classNameOf(sibling).trim().split(/\s+/).filter((item) => item).sort().join(".");
            const currentClasses = classes.slice().sort().join(".");
            return siblingClasses === currentClasses;
          });
          if (siblings.length > 1) {
            selector += `[${siblings.indexOf(current)}]`;
          }
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(" > ");
  }

  function assignElementId(element) {
    if (!element) return null;
    if (element.nodeType != null && element.nodeType !== 1) return null;
    let id = element.getAttribute?.(ELEMENT_ID_ATTR);
    if (!id) {
      id = `holar-el-${++elementIdCounter}`;
      try { element.setAttribute?.(ELEMENT_ID_ATTR, id); } catch {}
    }
    return id;
  }

  function attributeList(element) {
    const raw = element.attributes;
    const list = raw && typeof raw.length === "number"
      ? Array.from(raw)
      : [];
    const seen = new Set();
    const result = [];
    if (element.id && !list.some((item) => item.name === "id")) list.push({ name: "id", value: element.id });
    const className = classNameOf(element);
    if (className && !list.some((item) => item.name === "class")) list.push({ name: "class", value: className });
    for (const item of list) {
      const name = String(item?.name || "");
      if (!name || seen.has(name) || name === HOST_ATTR || name === ELEMENT_ID_ATTR || SECRET_ATTR.test(name)) continue;
      seen.add(name);
      result.push({ name, value: boundText(item.value, MAX_ATTR) });
    }
    return result;
  }

  function fingerprint(element) {
    const uniqueId = element.getAttribute?.(ELEMENT_ID_ATTR);
    if (uniqueId) return uniqueId;
    const tag = String(element.tagName || "div").toLowerCase();
    const role = String(element.getAttribute?.("role") || "");
    const slot = String(element.getAttribute?.("data-slot") || "");
    const testid = String(element.getAttribute?.("data-testid") || "");
    const name = String(element.getAttribute?.("aria-label") || "").slice(0, 80);
    return `${tag}|${role}|${slot}|${testid}|${name}|${spiralGetElementPath(element)}`;
  }

  function spiralDescribeElement(element, index) {
    const rect = typeof element.getBoundingClientRect === "function"
      ? element.getBoundingClientRect()
      : { x: 0, y: 0, top: 0, left: 0, width: 0, height: 0 };
    const tag = String(element.tagName || "div").toLowerCase();
    const textContent = boundText(element.innerText || element.textContent || "", MAX_TEXT);
    const name = boundText(element.getAttribute?.("aria-label") || textContent, 80) || null;
    const react = spiralGetReactComponentInfo(element);
    const uniqueId = assignElementId(element);
    const hueIndex = index;
    const width = Math.round(rect.width || 0);
    const height = Math.round(rect.height || 0);
    let selector = element.id ? `#${element.id}` : tag;
    if (!element.id && element.getAttribute?.("data-slot")) selector += `[data-slot="${element.getAttribute("data-slot")}"]`;
    else if (!element.id && element.getAttribute?.("data-testid")) selector += `[data-testid="${element.getAttribute("data-testid")}"]`;

    const extraObject = {
      id: element.id || "",
      selector,
      className: classNameOf(element),
      attributes: attributeList(element),
      styles: {},
      rect: {
        top: Math.round(rect.top ?? rect.y ?? 0),
        left: Math.round(rect.left ?? rect.x ?? 0),
        width,
        height,
      },
      token_discipline: {
        modulus_4px_width: width % 4 === 0,
        modulus_4px_height: height % 4 === 0,
        touch_target_accessible: width >= 32 && height >= 32,
      },
      reactComponent: react,
      uniqueId,
      hueIndex,
    };
    try {
      const style = typeof window !== "undefined" && window.getComputedStyle
        ? window.getComputedStyle(element)
        : null;
      if (style) {
        extraObject.styles = {
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          borderRadius: style.borderRadius,
          padding: style.padding,
          margin: style.margin,
          display: style.display,
          position: style.position,
        };
      }
    } catch {}
    let extra = "";
    try {
      extra = JSON.stringify(extraObject).slice(0, MAX_EXTRA);
    } catch {
      extra = JSON.stringify({ uniqueId, hueIndex });
    }
    return {
      id: `an-${index + 1}`,
      element: tag,
      tag,
      role: element.getAttribute?.("role") || null,
      name,
      slot: element.getAttribute?.("data-slot") || null,
      testid: element.getAttribute?.("data-testid") || null,
      fingerprint: uniqueId || fingerprint(element),
      uniqueId,
      xpath: spiralGetElementPath(element),
      textContent,
      extra,
      className: classNameOf(element),
      domId: element.id || "",
      component: react?.name || "",
      componentPropsJson: react?.props ? JSON.stringify(react.props).slice(0, MAX_EXTRA) : "",
      color: paletteColor(hueIndex),
      hueIndex,
      rect: {
        x: Math.round(rect.x ?? rect.left ?? 0),
        y: Math.round(rect.y ?? rect.top ?? 0),
        width: Math.round(rect.width || 0),
        height: Math.round(rect.height || 0),
      },
    };
  }

  function isAnnotationHost(node) {
    if (!node || typeof node.getAttribute !== "function") return false;
    if (node.getAttribute(HOST_ATTR) != null) return true;
    return typeof node.closest === "function" && node.closest(`[${HOST_ATTR}]`) != null;
  }

  function publicItems() {
    return items.map((item) => ({
      id: item.id,
      element: item.element,
      tag: item.tag,
      role: item.role,
      name: item.name,
      slot: item.slot,
      testid: item.testid,
      fingerprint: item.fingerprint,
      uniqueId: item.uniqueId,
      xpath: item.xpath,
      textContent: item.textContent,
      extra: item.extra,
      className: item.className,
      domId: item.domId || "",
      component: item.component,
      componentPropsJson: item.componentPropsJson,
      color: item.color,
      hueIndex: item.hueIndex,
      rect: item.rect,
      visible: item.visible !== false,
      note: item.note,
    }));
  }

  function liveRect(element) {
    const box = typeof element.getBoundingClientRect === "function"
      ? element.getBoundingClientRect()
      : { x: 0, y: 0, top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 };
    const x = Math.round(box.x ?? box.left ?? 0);
    const y = Math.round(box.y ?? box.top ?? 0);
    const width = Math.round(box.width || 0);
    const height = Math.round(box.height || 0);
    return {
      x,
      y,
      width,
      height,
      top: Math.round(box.top ?? y),
      left: Math.round(box.left ?? x),
      bottom: Math.round(box.bottom ?? (y + height)),
      right: Math.round(box.right ?? (x + width)),
    };
  }

  function isRectVisible(rect, element) {
    const viewportWidth = Number(window.innerWidth) || 0;
    const viewportHeight = Number(window.innerHeight) || 0;
    if ((rect.width || 0) === 0 && (rect.height || 0) === 0) return false;
    const top = rect.top ?? rect.y ?? 0;
    const left = rect.left ?? rect.x ?? 0;
    const bottom = rect.bottom ?? top + (rect.height || 0);
    const right = rect.right ?? left + (rect.width || 0);
    if (viewportWidth && viewportHeight && (bottom <= 0 || top >= viewportHeight || right <= 0 || left >= viewportWidth)) {
      return false;
    }
    let parent = element && element.parentElement;
    let hops = 0;
    while (parent && hops < 16) {
      hops += 1;
      let overflow = "";
      try {
        if (typeof window.getComputedStyle === "function") {
          const style = window.getComputedStyle(parent);
          overflow = `${style.overflow || ""} ${style.overflowY || ""} ${style.overflowX || ""}`;
        }
      } catch {
        overflow = "";
      }
      if (/(auto|scroll|hidden|clip|overlay)/.test(overflow) && typeof parent.getBoundingClientRect === "function") {
        const box = parent.getBoundingClientRect();
        const boxTop = box.top ?? box.y ?? 0;
        const boxLeft = box.left ?? box.x ?? 0;
        const boxBottom = box.bottom ?? boxTop + (box.height || 0);
        const boxRight = box.right ?? boxLeft + (box.width || 0);
        if (bottom <= boxTop || top >= boxBottom || right <= boxLeft || left >= boxRight) return false;
      }
      parent = parent.parentElement;
    }
    return true;
  }

  function resolveNode(item) {
    if (item.node && item.node.isConnected !== false) return item.node;
    if (item.uniqueId && typeof document.querySelector === "function") {
      try {
        const found = document.querySelector(`[${ELEMENT_ID_ATTR}="${item.uniqueId}"]`);
        if (found) return found;
      } catch {}
    }
    return item.node && item.node.isConnected !== false ? item.node : null;
  }

  function spiralAnnotationSync() {
    items = items.map((item) => {
      const node = resolveNode(item);
      if (!node || typeof node.getBoundingClientRect !== "function") {
        return { ...item, node: node || item.node, visible: false };
      }
      const rect = liveRect(node);
      return { ...item, node, rect, visible: isRectVisible(rect, node) };
    });
    if (hoverTarget && highlight && highlight.style.display !== "none") {
      if (hoverTarget.isConnected === false) hideHighlight();
      else {
        const hoverRect = liveRect(hoverTarget);
        highlight.style.left = `${hoverRect.x}px`;
        highlight.style.top = `${hoverRect.y}px`;
        highlight.style.width = `${hoverRect.width}px`;
        highlight.style.height = `${hoverRect.height}px`;
      }
    }
    renderPins();
    return spiralAnnotationList();
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    const raf = typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (callback) => setTimeout(callback, 16);
    raf(() => {
      syncScheduled = false;
      spiralAnnotationSync();
    });
  }

  function ensureHost() {
    if (host && host.isConnected) return host;
    host = document.createElement("div");
    host.setAttribute(HOST_ATTR, "host");
    host.style.cssText = "position:fixed;inset:0;z-index:2147483646;pointer-events:none;font:12px/1.4 ui-sans-serif,system-ui,sans-serif;";
    highlight = document.createElement("div");
    highlight.setAttribute(HOST_ATTR, "hover");
    highlight.style.cssText = `position:fixed;border:2px solid ${HOVER};border-radius:4px;pointer-events:none;display:none;z-index:2147483647;box-sizing:border-box;`;
    highlightLabel = document.createElement("div");
    highlightLabel.setAttribute(HOST_ATTR, "hover-label");
    highlightLabel.style.cssText = "position:fixed;display:none;z-index:2147483647;pointer-events:none;";
    host.appendChild(highlight);
    host.appendChild(highlightLabel);
    const root = document.documentElement || document.body;
    root?.appendChild(host);
    return host;
  }

  function renderPins() {
    if (!host) return;
    for (const node of [...(host.querySelectorAll?.(`[${HOST_ATTR}="pin"]`) || [])]) node.remove();
    items.forEach((item) => {
      if (item.visible === false) return;
      const pin = document.createElement("div");
      pin.setAttribute(HOST_ATTR, "pin");
      pin.style.cssText = [
        "position:fixed",
        `left:${item.rect.x}px`,
        `top:${item.rect.y}px`,
        `width:${Math.max(0, item.rect.width)}px`,
        `height:${Math.max(0, item.rect.height)}px`,
        `border:2px solid ${item.color}`,
        "border-radius:4px",
        `background:${item.color}14`,
        "pointer-events:none",
        "box-sizing:border-box",
        "z-index:2147483646",
      ].join(";");
      host.appendChild(pin);
    });
    renderDetail();
    renderHud();
  }

  function renderDetail() {
    if (!highlightLabel) return;
    if (hoverTarget) {
      const rect = liveRect(hoverTarget);
      placeCardRow(highlightLabel, rect, colorForElement(hoverTarget), identityFromElement(hoverTarget));
      return;
    }
    const last = [...items].reverse().find((item) => item.visible !== false) || items[items.length - 1];
    if (!last) {
      highlightLabel.style.display = "none";
      return;
    }
    placeCardRow(highlightLabel, last.rect, last.color, identityCards(last));
  }

  function renderHud() {
    if (!host) return;
    if (hud) {
      hud.remove();
      hud = null;
    }
    if (items.length === 0) return;
    hud = document.createElement("div");
    hud.setAttribute(HOST_ATTR, "hud");
    hud.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:20px",
      "transform:translateX(-50%)",
      "display:flex",
      "align-items:center",
      "gap:12px",
      "padding:8px 8px 8px 12px",
      "background:rgba(255,255,255,0.94)",
      "color:#0f172a",
      "border-radius:14px",
      "box-shadow:0 12px 40px rgba(15,23,42,0.18)",
      "pointer-events:auto",
      "z-index:2147483647",
      "width:min(560px, calc(100vw - 24px))",
      "box-sizing:border-box",
      "backdrop-filter:blur(16px)",
      "-webkit-backdrop-filter:blur(16px)",
    ].join(";");
    const chips = document.createElement("div");
    chips.setAttribute(HOST_ATTR, "chips");
    chips.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:40%;";
    items.forEach((item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.setAttribute(HOST_ATTR, "chip");
      chip.style.cssText = [
        "display:flex",
        "align-items:center",
        "gap:6px",
        "border:0",
        "background:transparent",
        "padding:0",
        "font:12px/1.2 system-ui,sans-serif",
        "color:#0f172a",
        "cursor:pointer",
      ].join(";");
      const mark = document.createElement("span");
      mark.setAttribute(HOST_ATTR, "chip-mark");
      mark.style.cssText = `width:10px;height:10px;border-radius:2px;background:${item.color};display:inline-block;`;
      const label = document.createElement("span");
      label.textContent = identityCards(item).element;
      chip.appendChild(mark);
      chip.appendChild(label);
      chip.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        spiralAnnotationRemove(item.id);
      });
      chips.appendChild(chip);
    });
    const form = document.createElement("form");
    form.setAttribute(HOST_ATTR, "prompt");
    form.style.cssText = "display:flex;align-items:center;gap:8px;min-width:180px;flex:1;";
    const input = document.createElement("input");
    input.setAttribute(HOST_ATTR, "prompt-input");
    input.type = "text";
    input.placeholder = "Describe what should change";
    input.value = prompt;
    input.style.cssText = "border:0;outline:0;min-width:140px;flex:1;font:12px/1.2 system-ui,sans-serif;background:transparent;";
    const send = document.createElement("button");
    send.type = "submit";
    send.setAttribute(HOST_ATTR, "send");
    send.textContent = "Send";
    send.style.cssText = "border:0;background:#0f172a;color:#fff;border-radius:10px;padding:7px 12px;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer;";
    form.appendChild(input);
    form.appendChild(send);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (send.disabled) return;
      send.disabled = true;
      send.textContent = "Sending";
      const result = spiralAnnotationSubmit(input.value, (settled) => {
        if (settled.delivered) return;
        send.disabled = false;
        send.textContent = "Send";
      });
      if (result.status === "empty") {
        send.disabled = false;
        send.textContent = "Send";
        showToast("Select an element first");
      }
    });
    hud.appendChild(chips);
    hud.appendChild(form);
    host.appendChild(hud);
    try { input.focus(); } catch {}
  }

  function showToast(message) {
    if (!host) return;
    for (const node of [...(host.querySelectorAll?.(`[${HOST_ATTR}="toast"]`) || [])]) node.remove();
    const toast = document.createElement("div");
    toast.setAttribute(HOST_ATTR, "toast");
    toast.textContent = message;
    toast.style.cssText = "position:fixed;bottom:16px;right:16px;background:rgba(15,23,42,0.92);color:#fff;padding:8px 12px;border-radius:6px;pointer-events:none;z-index:2147483647;";
    host.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2400);
  }

  function spiralAnnotationComposeMessage(url, title, note, annotations) {
    const lines = [];
    const body = String(note || "").trim();
    if (body) lines.push(body);
    if (url) lines.push(String(url).slice(0, 300));
    if (title) lines.push(String(title).slice(0, 120));
    const rows = Array.isArray(annotations) ? annotations.slice(0, 12) : [];
    if (rows.length > 0) {
      if (lines.length > 0) lines.push("");
      for (const item of rows) {
        const cards = identityCards(item);
        const text = String(item.textContent || item.name || "").slice(0, 80);
        const path = String(item.xpath || "").slice(0, 160);
        lines.push(`- element=${cards.element} component=${cards.component} class=${cards.className} xpath=${path}${text ? ` text=${text}` : ""}`);
      }
    }
    return lines.join("\n").trim().slice(0, 2000);
  }

  function spiralAnnotationFinish() {
    picking = false;
    items = [];
    prompt = "";
    detach();
    hideHighlight();
    if (host) host.remove();
    host = null;
    highlight = null;
    highlightLabel = null;
    hud = null;
    return { action: "annotate", status: "idle", picking: false, prompt: "", count: 0, annotations: [] };
  }

  function spiralAnnotationSubmit(rawPrompt, onSettled) {
    prompt = boundNote(rawPrompt ?? prompt);
    items = items.map((item) => (item.note ? item : { ...item, note: prompt }));
    renderPins();
    if (items.length === 0) {
      onSettled?.({ delivered: false });
      return { action: "annotate", status: "empty", picking, prompt, count: 0 };
    }
    const url = typeof location !== "undefined" ? String(location.href || "").slice(0, 300) : "";
    const title = typeof document !== "undefined" ? String(document.title || "").slice(0, 120) : "";
    const payload = {
      protocol: "spiral.browser.v1",
      action: "annotation_submit",
      url,
      title,
      prompt,
      message: spiralAnnotationComposeMessage(url, title, prompt, publicItems()),
      annotations: publicItems(),
    };
    const result = { action: "annotate", status: "submitted", picking, prompt, count: items.length, message: payload.message, delivered: false };
    const settle = (delivered) => {
      result.delivered = delivered;
      if (delivered) {
        showToast("Sent to the agent");
        spiralAnnotationFinish();
      } else {
        showToast("Send failed");
      }
      onSettled?.({ delivered });
    };
    if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.sendMessage === "function") {
      try {
        chrome.runtime.sendMessage(payload, (response) => {
          const failed = Boolean(chrome.runtime.lastError) || response?.ok === false;
          settle(!failed && response?.result?.delivered === true);
        });
        return result;
      } catch {}
    }
    settle(false);
    return result;
  }

  function spiralAnnotationShouldPick(event) {
    return picking === true && event?.altKey === true && event?.button !== 2;
  }

  function tryPick(event) {
    if (isAnnotationHost(event.target)) return false;
    if (!spiralAnnotationShouldPick(event)) return false;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const element = targetFromEvent(event);
    if (!element) return false;
    ensureHost();
    spiralAnnotationPick(element);
    lastPickAt = Date.now();
    return true;
  }

  function hideHighlight() {
    if (highlight) highlight.style.display = "none";
    hoverTarget = null;
    renderDetail();
  }

  function hoverLabelFor(element) {
    const cards = identityFromElement(element);
    const parts = [cards.element, cards.component];
    if (classVisible && cards.className && cards.className !== "—") parts.push(cards.className);
    return parts.filter((part) => part && part !== "—").join(" · ");
  }

  function onPointerMove(event) {
    classVisible = Boolean(event.ctrlKey);
    if (!picking) return;
    if (!event.altKey) {
      hideHighlight();
      return;
    }
    ensureHost();
    const element = targetFromEvent(event);
    hoverTarget = element;
    if (!highlight) return;
    if (!element) {
      hideHighlight();
      return;
    }
    const color = colorForElement(element);
    const rect = element.getBoundingClientRect();
    highlight.style.display = "block";
    highlight.style.borderColor = color;
    highlight.style.background = `${color}14`;
    highlight.style.left = `${rect.x}px`;
    highlight.style.top = `${rect.y}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    renderDetail();
  }

  function onPointerDown(event) {
    tryPick(event);
  }

  function onClick(event) {
    if (Date.now() - lastPickAt < 500) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    tryPick(event);
  }

  function onKey(event) {
    if (event.key === "Escape") {
      const hadItems = items.length > 0;
      const hoverVisible = highlight && highlight.style.display !== "none";
      if (hadItems) {
        items = [];
        prompt = "";
        renderPins();
      }
      hideHighlight();
      if (hadItems || hoverVisible) event.preventDefault();
      return;
    }
    if (event.key === "Control") {
      classVisible = event.type === "keydown";
      renderDetail();
      return;
    }
    if (event.key === "Alt" && event.type === "keyup") hideHighlight();
  }

  function targetFromEvent(event) {
    let point = null;
    try {
      if (typeof document.elementFromPoint === "function" && Number.isFinite(event.clientX)) {
        point = document.elementFromPoint(event.clientX, event.clientY);
      }
    } catch {
      point = null;
    }
    const path = typeof event.composedPath === "function" ? event.composedPath() : [point || event.target];
    if (point) path.unshift(point);
    for (const node of path) {
      if (!node || node === document || node === document.documentElement || node === document.body) continue;
      if (typeof node.tagName !== "string") continue;
      if (isAnnotationHost(node)) continue;
      return annotateTarget(node);
    }
    return null;
  }

  function attach() {
    if (listening) return;
    listening = true;
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("keyup", onKey, true);
    document.addEventListener("scroll", scheduleSync, { capture: true, passive: true });
    window.addEventListener("scroll", scheduleSync, { capture: true, passive: true });
    window.addEventListener("resize", scheduleSync);
  }

  function detach() {
    if (!listening) return;
    listening = false;
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("keyup", onKey, true);
    document.removeEventListener("scroll", scheduleSync, { capture: true });
    window.removeEventListener("scroll", scheduleSync, { capture: true });
    window.removeEventListener("resize", scheduleSync);
    hideHighlight();
  }

  function spiralAnnotationList() {
    return {
      action: "annotate",
      picking,
      count: items.length,
      prompt,
      annotations: publicItems(),
    };
  }

  function spiralAnnotationStart() {
    picking = true;
    attach();
    renderPins();
    return { ...spiralAnnotationList(), status: "picking" };
  }

  function spiralAnnotationStop() {
    picking = false;
    detach();
    renderPins();
    return { ...spiralAnnotationList(), status: "idle" };
  }

  function spiralAnnotationPick(element, note) {
    const uniqueId = assignElementId(element);
    const existing = items.findIndex((item) => item.uniqueId && uniqueId && item.uniqueId === uniqueId);
    if (existing >= 0 && !note) {
      return spiralAnnotationRemove(items[existing].id);
    }
    return spiralAnnotationAdd(element, note);
  }

  function spiralAnnotationAdd(element, note) {
    const text = boundNote(note);
    if (items.length >= MAX_ITEMS) {
      const error = new Error("annotation_limit");
      error.code = "annotation_limit";
      throw error;
    }
    const described = spiralDescribeElement(element, items.length);
    const item = { ...described, note: text, node: element, visible: isRectVisible(described.rect, element) };
    items.push(item);
    renderPins();
    return { action: "annotate", status: "added", annotation: item, count: items.length, picking, prompt };
  }

  function spiralAnnotationRemove(id) {
    const next = items.filter((item) => item.id !== id);
    const removed = next.length !== items.length;
    items = next.map((item, index) => ({
      ...item,
      id: `an-${index + 1}`,
      hueIndex: index,
      color: paletteColor(index),
    }));
    renderPins();
    return { action: "annotate", status: removed ? "removed" : "missing", count: items.length, picking, prompt };
  }

  function spiralAnnotationClear() {
    items = [];
    prompt = "";
    if (host) host.remove();
    host = null;
    highlight = null;
    highlightLabel = null;
    hud = null;
    return { action: "annotate", status: "cleared", count: 0, picking, prompt: "", annotations: [] };
  }

  globalThis.spiralDescribeElement = spiralDescribeElement;
  globalThis.spiralGetElementPath = spiralGetElementPath;
  globalThis.spiralGetReactComponentInfo = spiralGetReactComponentInfo;
  globalThis.spiralAnnotationChipLabel = chipLabel;
  globalThis.spiralAnnotationIdentityCards = identityCards;
  globalThis.spiralAnnotationOverlayFields = overlayFields;
  globalThis.spiralAnnotationSetClassVisible = (value) => {
    classVisible = Boolean(value);
    return classVisible;
  };
  globalThis.spiralAnnotationHoverLabelFor = hoverLabelFor;
  globalThis.spiralAnnotationTarget = annotateTarget;
  globalThis.spiralAnnotationColorForElement = colorForElement;
  globalThis.spiralAnnotationList = spiralAnnotationList;
  globalThis.spiralAnnotationStart = spiralAnnotationStart;
  globalThis.spiralAnnotationStop = spiralAnnotationStop;
  globalThis.spiralAnnotationFinish = spiralAnnotationFinish;
  globalThis.spiralAnnotationAdd = spiralAnnotationAdd;
  globalThis.spiralAnnotationPick = spiralAnnotationPick;
  globalThis.spiralAnnotationRemove = spiralAnnotationRemove;
  globalThis.spiralAnnotationClear = spiralAnnotationClear;
  globalThis.spiralAnnotationBoundNote = boundNote;
  globalThis.spiralAnnotationComposeMessage = spiralAnnotationComposeMessage;
  globalThis.spiralAnnotationSubmit = spiralAnnotationSubmit;
  globalThis.spiralIsAnnotationHost = isAnnotationHost;
  globalThis.spiralAnnotationShouldPick = spiralAnnotationShouldPick;
  globalThis.spiralAnnotationSync = spiralAnnotationSync;
  attach();
})();
