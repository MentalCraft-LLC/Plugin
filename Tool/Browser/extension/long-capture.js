(() => {
  const MAX_STEPS = 160;
  const FRAME_MS = 16;
  const SETTLE_FRAMES = 4;
  const MAX_SCROLL_WAIT_MS = 400;
  const TOP_WAIT_MS = 4_000;
  const TOP_HOLD_MS = 1_200;
  const TOP_SEEK_ATTEMPTS = 6;
  const DEFAULT_DEADLINE_MS = 85_000;
  const USER_TURN_CHARS = 3_000;
  const MODEL_TURN_CHARS = 1_800;
  const BLOCK_TURN_CHARS = 800;
  const PRIMARY_TURN_SELECTORS = [
    "user-query",
    "model-response",
    "[data-message-author-role]",
  ].join(", ");
  const SECONDARY_TURN_SELECTORS = [
    "[data-message-id]",
    "[data-turn-id]",
    "[data-testid='conversation-turn']",
    "[data-testid='user-message']",
    "[data-testid='bot-message']",
    "[data-testid='assistant-message']",
    "article[data-testid]",
  ].join(", ");
  const SCROLLER_HINT = /chat|history|infinite|virtual|message|conversation|transcript|scroller|thread/i;
  const LOAD_ERROR = /无法连接|重新加载|unable to connect|couldn['’]t connect|failed to load/i;

  function overflowScrollable(element, win) {
    if (!element || typeof win.getComputedStyle !== "function") return false;
    try {
      const style = win.getComputedStyle(element);
      const overflow = `${style.overflowY || ""} ${style.overflow || ""}`;
      return /(auto|scroll|overlay)/.test(overflow);
    } catch {
      return false;
    }
  }

  function attr(node, name) {
    if (!node || typeof node.getAttribute !== "function") return "";
    try {
      return String(node.getAttribute(name) || "");
    } catch {
      return "";
    }
  }

  function roleOf(node) {
    const tagged = String(
      attr(node, "data-message-author-role")
      || attr(node, "data-author-role")
      || attr(node, "data-role")
      || attr(node, "data-author"),
    ).toLowerCase();
    if (["user", "human", "you"].includes(tagged)) return "user";
    if (["model", "assistant", "bot", "ai", "system"].includes(tagged)) return "model";
    const name = String(node?.tagName || "").toLowerCase();
    if (name === "user-query") return "user";
    if (name === "model-response") return "model";
    const hint = `${name} ${node?.className || ""} ${attr(node, "data-testid")}`;
    if (/user-query|user-message|human-message/.test(hint)) return "user";
    if (/model-response|assistant-message|bot-message|ai-message/.test(hint)) return "model";
    return "block";
  }

  function containsNode(parent, child) {
    if (!parent || !child || parent === child) return false;
    if (typeof parent.contains === "function") {
      try {
        return parent.contains(child) === true;
      } catch {
        return false;
      }
    }
    return false;
  }

  function querySelectorList(root, selector) {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    try {
      return [...root.querySelectorAll(selector)];
    } catch {
      return [];
    }
  }

  function queryTurns(root) {
    const primary = querySelectorList(root, PRIMARY_TURN_SELECTORS);
    if (primary.length > 0) return primary;
    return querySelectorList(root, SECONDARY_TURN_SELECTORS);
  }

  function spiralConversationNodes(root) {
    const nodes = queryTurns(root);
    if (nodes.length === 0) return [];
    const roleBearing = nodes.filter((node) => {
      const role = roleOf(node);
      return role === "user" || role === "model";
    });
    const pool = roleBearing.length > 0 ? roleBearing : nodes;
    if (pool.length <= 1) return pool;
    return pool.filter((node) => !pool.some((other) => containsNode(other, node)));
  }

  function conversationCount(root) {
    return spiralConversationNodes(root).length;
  }

  function scorer(element, win) {
    const client = Number(element?.clientHeight) || 0;
    const scroll = Number(element?.scrollHeight) || 0;
    const scrolling = element === win.document?.scrollingElement
      || element === win.document?.documentElement
      || element === win.document?.body;
    const turns = conversationCount(element);
    if (turns === 0) {
      if (client < 80 || scroll <= client + 8) return 0;
      if (!scrolling && !overflowScrollable(element, win)) return 0;
    }
    let score = Math.max(0, scroll - client);
    const hint = `${element.tagName || ""} ${element.className || ""}`;
    if (SCROLLER_HINT.test(hint)) score += 10_000;
    if (String(element.tagName || "").toUpperCase() === "INFINITE-SCROLLER") score += 20_000;
    if (/chat-history/i.test(hint)) score += 50_000;
    if (turns > 0 && !scrolling) score += 100_000 + Math.min(turns, 80) * 1_000;
    return score;
  }

  function spiralPrimaryScroller(doc, win) {
    const fallback = doc.scrollingElement || doc.documentElement || doc.body;
    let best = fallback;
    let bestScore = scorer(fallback, win);
    const consider = (element) => {
      if (!element) return;
      const score = scorer(element, win);
      if (score > bestScore) {
        best = element;
        bestScore = score;
      }
    };
    if (doc.querySelectorAll) {
      for (const element of doc.querySelectorAll("infinite-scroller")) consider(element);
      for (const turn of queryTurns(doc)) {
        let node = turn.parentElement;
        let hops = 0;
        while (node && hops < 24) {
          consider(node);
          node = node.parentElement;
          hops += 1;
        }
      }
    }
    return best || fallback;
  }

  function spiralScrollerVirtualized(scroller, win) {
    if (!scroller) return false;
    const hint = `${scroller.tagName || ""} ${scroller.className || ""}`;
    if (SCROLLER_HINT.test(hint) && (Number(scroller.scrollHeight) || 0) > (Number(scroller.clientHeight) || 0) + 8) return true;
    const client = Number(scroller.clientHeight) || 0;
    const scroll = Number(scroller.scrollHeight) || 0;
    if (client < 80 || scroll < client * 1.5) return false;
    const children = scroller.children || [];
    let covered = 0;
    const max = Math.min(children.length, 80);
    for (let index = 0; index < max; index += 1) {
      const child = children[index];
      try {
        const rect = child.getBoundingClientRect?.();
        covered += Math.max(0, rect?.height || child.clientHeight || 0);
      } catch {
        covered += Number(child.clientHeight) || 0;
      }
    }
    return covered + 24 < scroll * 0.7;
  }

  function spiralShouldLongRead(longFlag, scroller, win) {
    if (longFlag === false) return false;
    if (longFlag === true) return true;
    return spiralScrollerVirtualized(scroller, win) || conversationCount(scroller) > 0;
  }

  function spiralPageBanners(doc, boundPublicText) {
    const bound = typeof boundPublicText === "function" ? boundPublicText : (value) => String(value ?? "");
    const raw = bound(doc.body?.textContent || doc.documentElement?.textContent || "", 4_000);
    const match = raw.match(LOAD_ERROR);
    return match ? [match[0]] : [];
  }

  function timersThrottled(doc) {
    try {
      return doc?.hidden === true;
    } catch {
      return false;
    }
  }

  function spiralWakeDocument(doc, win) {
    if (!doc) return false;
    try {
      Object.defineProperty(doc, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(doc, "visibilityState", { configurable: true, get: () => "visible" });
    } catch {}
    try {
      doc.hasFocus = () => true;
    } catch {}
    try { doc.dispatchEvent(new Event("visibilitychange")); } catch {}
    try { win?.dispatchEvent(new Event("focus")); } catch {}
    try { doc.dispatchEvent(new Event("focus")); } catch {}
    return true;
  }

  function nextTask() {
    return new Promise((resolve) => {
      try {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(0);
      } catch {
        setTimeout(resolve, 0);
      }
    });
  }

  async function wallWait(ms) {
    const budget = Math.max(0, Number(ms) || 0);
    if (budget <= 0) return;
    const started = Date.now();
    let hops = 0;
    while (Date.now() - started < budget && hops < 800) {
      hops += 1;
      await nextTask();
    }
  }

  function collapseDoubled(body) {
    const value = String(body ?? "").trim();
    if (value.length < 8) return value;
    if (value.length % 2 === 1) {
      const mid = Math.floor(value.length / 2);
      if (value[mid] === " " && value.slice(0, mid) === value.slice(mid + 1)) return value.slice(0, mid);
    }
    if (value.length % 2 === 0) {
      const half = value.length / 2;
      const left = value.slice(0, half).trim();
      const right = value.slice(half).trim();
      if (left && left === right) return left;
    }
    return value;
  }

  function spiralCompactTurnText(raw) {
    const value = String(raw ?? "").replace(/\s+/g, " ").trim();
    if (!value) return "";
    const prefixMatch = value.match(/^(你说|you said)\s+/i);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const body = prefix ? value.slice(prefix.length).trim() : value;
    return `${prefix}${collapseDoubled(body)}`.replace(/\s+/g, " ").trim();
  }

  function boundedNodeText(node, max) {
    const limit = Number.isInteger(max) && max > 0 ? Math.min(max, 100000) : 0;
    if (limit === 0 || !node) return "";
    let out = "";
    let visits = 0;
    const walk = (current) => {
      if (out.length >= limit || !current || visits > 2_000) return;
      visits += 1;
      const type = Number(current.nodeType);
      if (type === 3 || type === 4) {
        out += String(current.textContent || "");
        return;
      }
      if (type !== 1 && type !== 11) return;
      const tag = String(current.tagName || "").toLowerCase();
      if (tag && ["script", "style", "noscript", "svg", "canvas", "template"].includes(tag)) return;
      try {
        if (current.shadowRoot) walk(current.shadowRoot);
      } catch {}
      const kids = current.childNodes;
      if (!kids || typeof kids.length !== "number") return;
      for (let index = 0; index < kids.length; index += 1) {
        walk(kids[index]);
        if (out.length >= limit) return;
      }
    };
    walk(node);
    if (visits > 1) return out.slice(0, limit);
    return String(node.textContent || "").slice(0, limit);
  }

  function turnCap(role) {
    if (role === "user") return USER_TURN_CHARS;
    if (role === "model") return MODEL_TURN_CHARS;
    return BLOCK_TURN_CHARS;
  }

  function fingerprint(tag, text) {
    return `${String(tag || "block").toUpperCase()}:${String(text || "").replace(/\s+/g, " ").trim().slice(0, 160)}`;
  }

  function nodeKey(node) {
    const tag = String(node?.tagName || "block").toUpperCase();
    const parts = [
      attr(node, "data-message-id"),
      attr(node, "data-turn-id"),
      attr(node, "data-message-index"),
      node?.id,
    ].filter(Boolean);
    if (parts.length === 0) return null;
    return `${tag}:${parts.join(":")}`;
  }

  function spiralScrollerGeometry(scroller) {
    const height = Number(scroller?.scrollHeight) || 0;
    const client = Math.max(1, Number(scroller?.clientHeight) || 0);
    const top = Number(scroller?.scrollTop) || 0;
    return {
      height,
      client,
      top,
      atTop: top <= 1,
      atBottom: top + client >= height - 2,
      maxTop: Math.max(0, height - client),
    };
  }

  function spiralApplyScroll(scroller, y) {
    const next = Math.max(0, Number(y) || 0);
    if (!scroller) return next;
    try {
      if (typeof scroller.scrollTo === "function") {
        try {
          scroller.scrollTo({ top: next, left: 0, behavior: "instant" });
        } catch {
          scroller.scrollTo(0, next);
        }
      }
    } catch {}
    scroller.scrollTop = next;
    if (next === 0 && Number(scroller.scrollTop) > 1) {
      try {
        if (typeof scroller.scrollBy === "function") scroller.scrollBy(0, -(Number(scroller.scrollTop) || 0));
      } catch {}
      scroller.scrollTop = 0;
    }
    try {
      if (typeof Event === "function" && typeof scroller.dispatchEvent === "function") {
        scroller.dispatchEvent(new Event("scroll"));
      }
    } catch {}
    try { void scroller.offsetHeight; } catch {}
    return Number(scroller.scrollTop) || 0;
  }

  function spiralSeekTop(scroller) {
    const first = spiralConversationNodes(scroller)[0];
    try {
      if (first && typeof first.scrollIntoView === "function") {
        first.scrollIntoView({ block: "start", inline: "nearest" });
      }
    } catch {}
    return spiralApplyScroll(scroller, 0);
  }

  async function spiralWaitScroll(scroller, requested, wait, budgetMs, probe, minHoldMs) {
    const targetY = Math.max(0, Number(requested) || 0);
    const frame = typeof wait === "function" ? wait : (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const budget = Number(budgetMs);
    const hold = Number(minHoldMs) > 0 ? Number(minHoldMs) : 0;
    if (targetY <= 0) spiralSeekTop(scroller);
    else spiralApplyScroll(scroller, targetY);
    if (!Number.isFinite(budget) || budget <= 0) {
      await frame(0);
      return spiralScrollerGeometry(scroller);
    }
    const started = Date.now();
    let stable = 0;
    let quietSince = Date.now();
    let lastHeight = -1;
    let lastTop = -1;
    let lastProbe = probe ? probe() : 0;
    while (true) {
      const geo = spiralScrollerGeometry(scroller);
      const target = Math.min(targetY, geo.maxTop);
      const atTarget = Math.abs(geo.top - target) <= 1 || (targetY >= geo.maxTop && geo.atBottom);
      const probeValue = probe ? probe() : lastProbe;
      const changed = geo.height !== lastHeight || geo.top !== lastTop || probeValue !== lastProbe;
      if (changed) {
        stable = 0;
        quietSince = Date.now();
      } else {
        stable += 1;
      }
      lastHeight = geo.height;
      lastTop = geo.top;
      lastProbe = probeValue;
      if (atTarget && stable >= SETTLE_FRAMES && Date.now() - quietSince >= hold) return geo;
      if (Date.now() - started >= budget) return geo;
      if (Math.abs(geo.top - target) > 1) {
        if (targetY <= 0) spiralSeekTop(scroller);
        else spiralApplyScroll(scroller, target);
      }
      await frame(FRAME_MS);
    }
  }

  function spiralHarvestRecords(root, boundPublicText, seenIds, seenNodes) {
    const bound = typeof boundPublicText === "function" ? boundPublicText : (value, max) => String(value ?? "").slice(0, max ?? 100000);
    const records = [];
    const nodes = spiralConversationNodes(root);
    if (nodes.length === 0) return records;
    for (const node of nodes) {
      if (seenNodes && seenNodes.has(node)) continue;
      const key = nodeKey(node);
      if (key && seenIds && seenIds.has(key)) {
        seenNodes?.add(node);
        continue;
      }
      const role = roleOf(node);
      const cap = turnCap(role);
      const raw = boundedNodeText(node, cap + 64);
      const trimmed = spiralCompactTurnText(bound(raw, cap));
      if (!trimmed) continue;
      const id = key || fingerprint(node.tagName, trimmed);
      if (seenIds && seenIds.has(id)) {
        seenNodes?.add(node);
        continue;
      }
      records.push({
        id,
        role,
        text: trimmed.slice(0, cap),
      });
      seenNodes?.add(node);
    }
    return records;
  }

  function collectRecords(seen, ordered, incoming, rankBase) {
    const added = [];
    for (let index = 0; index < incoming.length; index += 1) {
      const record = incoming[index];
      if (seen.has(record.id)) continue;
      seen.add(record.id);
      const row = { role: record.role, text: record.text, id: record.id, rank: rankBase + index };
      ordered.push(row);
      added.push(row);
    }
    return added;
  }

  function composeConversation(records, limit) {
    const sorted = [...records].sort((left, right) => {
      const rank = (left.rank || 0) - (right.rank || 0);
      return rank !== 0 ? rank : 0;
    });
    const turns = sorted
      .filter((item) => item.role === "user" || item.role === "model")
      .map((item) => ({ role: item.role, text: item.text }));
    const pieces = [];
    let chars = 0;
    let truncated = false;
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      const record = sorted[index];
      const separator = pieces.length ? 1 : 0;
      const room = limit - chars - separator;
      if (room <= 0) {
        truncated = true;
        break;
      }
      if (record.text.length + separator > room && pieces.length > 0) {
        truncated = true;
        break;
      }
      const text = record.text.slice(0, room);
      if (text.length < record.text.length) truncated = true;
      pieces.unshift(text);
      chars += separator + text.length;
    }
    return {
      text: pieces.join("\n"),
      turns,
      truncated,
      chars,
    };
  }

  async function resolveConversationScroller(doc, win, wait) {
    let scroller = spiralPrimaryScroller(doc, win);
    if (conversationCount(scroller) > 0) return scroller;
    for (let index = 0; index < 8; index += 1) {
      await wait(50);
      scroller = spiralPrimaryScroller(doc, win);
      if (conversationCount(scroller) > 0) return scroller;
    }
    return scroller;
  }

  async function spiralLongRead(options) {
    const doc = options.document;
    const win = options.window;
    const bound = options.boundPublicText;
    const limit = Number.isInteger(options.maxChars) && options.maxChars > 0 && options.maxChars <= 100000 ? options.maxChars : 20000;
    const background = options.background === true;
    if (background) spiralWakeDocument(doc, win);
    const throttled = background || timersThrottled(doc);
    const wait = options.wait || (throttled
      ? wallWait
      : ((ms) => new Promise((resolve) => setTimeout(resolve, ms))));
    const scroller = options.scroller || await resolveConversationScroller(doc, win, wait);
    const harvestRoot = scroller;
    const banners = spiralPageBanners(doc, bound);
    const seen = new Set();
    const seenNodes = typeof WeakSet === "function" ? new WeakSet() : null;
    const ordered = [];
    const originalTop = Number(scroller.scrollTop) || 0;
    const scrollWait = options.settleMs === 0 ? 0 : (throttled ? 40 : (Number.isInteger(options.settleMs) ? options.settleMs : MAX_SCROLL_WAIT_MS));
    const virtualized = spiralScrollerVirtualized(scroller, win);
    const topBudget = options.settleMs === 0 ? 0 : (virtualized ? (throttled ? 1_500 : TOP_WAIT_MS) : scrollWait);
    const topHold = options.settleMs === 0 ? 0 : (virtualized ? (throttled ? 500 : TOP_HOLD_MS) : 0);
    const deadlineMs = Number.isInteger(options.deadlineMs) && options.deadlineMs > 0 ? options.deadlineMs : DEFAULT_DEADLINE_MS;
    const started = Date.now();
    const remain = () => Math.max(0, deadlineMs - (Date.now() - started) - 400);
    const mountedOf = () => conversationCount(harvestRoot);
    const geometryProbe = () => {
      const geo = spiralScrollerGeometry(scroller);
      return geo.height * 1_000_000 + geo.top;
    };
    let truncated = false;
    let steps = 0;
    let reachedBottom = false;
    let heldTop = 0;
    const harvestAt = (geo) => {
      const incoming = spiralHarvestRecords(harvestRoot, bound, seen, seenNodes);
      collectRecords(seen, ordered, incoming, (Number(geo?.top) || 0) * 10_000);
    };
    try {
      let descending = false;
      let lastTopHeight = -1;
      let lastTopTurns = -1;
      let lastSeen = -1;
      let extraTop = false;
      let topAttempts = 0;
      const newestGeo = spiralScrollerGeometry(scroller);
      await spiralWaitScroll(scroller, newestGeo.maxTop, wait, Math.min(Math.max(scrollWait, topHold), remain()), geometryProbe);
      harvestAt(spiralScrollerGeometry(scroller));
      steps += 1;
      await spiralWaitScroll(scroller, 0, wait, Math.min(topBudget, remain()), geometryProbe, Math.min(topHold, remain()));
      while (steps < MAX_STEPS) {
        if (remain() <= 0) {
          truncated = true;
          break;
        }
        const geo = spiralScrollerGeometry(scroller);
        steps += 1;
        if (!descending && !geo.atTop && topAttempts < TOP_SEEK_ATTEMPTS) {
          topAttempts += 1;
          await spiralWaitScroll(scroller, 0, wait, Math.min(topBudget, remain()), geometryProbe, Math.min(topHold, remain()));
          continue;
        }
        harvestAt(geo);
        const mounted = mountedOf();
        if (!descending) {
          if (!geo.atTop) {
            descending = true;
          } else {
          const grew = geo.height > lastTopHeight || mounted > lastTopTurns || seen.size > lastSeen;
          if (geo.height > lastTopHeight) lastTopHeight = geo.height;
          if (mounted > lastTopTurns) lastTopTurns = mounted;
          if (seen.size > lastSeen) lastSeen = seen.size;
          heldTop += 1;
          if (grew) {
            extraTop = false;
            await spiralWaitScroll(scroller, 0, wait, Math.min(topBudget, remain()), geometryProbe, Math.min(topHold, remain()));
            continue;
          }
          if (!extraTop) {
            extraTop = true;
            await spiralWaitScroll(scroller, 0, wait, Math.min(topBudget, remain()), geometryProbe, Math.min(topHold, remain()));
            continue;
          }
          if (geo.atBottom || geo.height <= geo.client + 8) {
            reachedBottom = true;
            break;
          }
          descending = true;
          }
        }
        if (geo.atBottom) {
          reachedBottom = true;
          break;
        }
        const next = Math.min(geo.maxTop, geo.top + Math.floor(geo.client * 0.7));
        if (next <= geo.top) {
          reachedBottom = geo.atBottom;
          break;
        }
        await spiralWaitScroll(scroller, next, wait, Math.min(scrollWait, remain()), geometryProbe);
      }
    } finally {
      spiralApplyScroll(scroller, originalTop);
    }
    const composed = composeConversation(ordered, limit);
    truncated = truncated || composed.truncated;
    const text = composed.text;
    const turns = composed.turns;
    return {
      action: "read_text",
      chars: text.length,
      text,
      value_returned: true,
      capture_mode: turns.length > 0 ? "conversation" : "long",
      complete: banners.length === 0 && reachedBottom,
      truncated,
      load_error: banners.length > 0,
      banners,
      steps,
      records: seen.size,
      turns,
      scroller: {
        tag: String(scroller.tagName || "document"),
        className: String(scroller.className || "").slice(0, 80),
        virtualized: spiralScrollerVirtualized(scroller, win),
        held_top: heldTop,
        hidden: throttled,
        background,
      },
    };
  }

  globalThis.spiralPrimaryScroller = spiralPrimaryScroller;
  globalThis.spiralScrollerVirtualized = spiralScrollerVirtualized;
  globalThis.spiralShouldLongRead = spiralShouldLongRead;
  globalThis.spiralPageBanners = spiralPageBanners;
  globalThis.spiralHarvestRecords = spiralHarvestRecords;
  globalThis.spiralComposeConversation = composeConversation;
  globalThis.spiralCompactTurnText = spiralCompactTurnText;
  globalThis.spiralWakeDocument = spiralWakeDocument;
  globalThis.spiralSeekTop = spiralSeekTop;
  globalThis.spiralConversationCount = conversationCount;
  globalThis.spiralConversationNodes = spiralConversationNodes;
  globalThis.spiralTurnRole = roleOf;
  globalThis.spiralScrollerGeometry = spiralScrollerGeometry;
  globalThis.spiralApplyScroll = spiralApplyScroll;
  globalThis.spiralWaitScroll = spiralWaitScroll;
  globalThis.spiralLongRead = spiralLongRead;
})();
