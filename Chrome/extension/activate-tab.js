(() => {
  const NORMAL_WEB_PROTOCOLS = new Set(["http:", "https:"]);

  function safeUrl(raw) {
    let url;
    try { url = new URL(String(raw)); } catch { throw new Error("url_invalid"); }
    if (!NORMAL_WEB_PROTOCOLS.has(url.protocol) || url.username || url.password) {
      throw new Error("origin_not_allowed");
    }
    return url;
  }

  /**
   * Prepare the managed tab for a host-side trusted click (isTrusted=true).
   *
   * Authorization model: the Owner granted macOS Accessibility to the host app
   * (permanent) and confirms each foregrounded action in chat
   * (foregroundConfirmed=true). No per-tab extension grant is required — this
   * action verifies the managed tab matches the target origin and returns its
   * identity. The caller may foreground only that identity and must restore
   * the prior tab/window after the trusted click.
   */
  function activateTarget(tab, rawUrl, confirmed) {
    if (confirmed !== true) throw new Error("activate_foreground_confirmation_required");
    if (!tab || !tab.id || !tab.url || !tab.windowId || typeof tab.index !== "number") {
      throw new Error("activate_target_not_active");
    }
    const target = safeUrl(rawUrl);
    let current;
    try { current = new URL(tab.url); } catch { throw new Error("activate_target_url_invalid"); }
    if (current.origin !== target.origin) throw new Error("activate_target_mismatch");
    return {
      status: "activated",
      tab_active: false,
      focus_changed: false, // this identity check alone never changes focus
      popup_opened: false,
      window_id: tab.windowId,
      tab_index: tab.index,
    };
  }

  globalThis.spiralActivateTarget = activateTarget;
})();
