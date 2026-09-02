(() => {
  const PROTOCOL = "spiral.browser.v1";
  const NORMAL_WEB_PROTOCOLS = new Set(["http:", "https:"]);
  const GRANT_KEY = "foregroundScreenshotGrant";
  const MAX_CSS_HEIGHT = 24_000;
  const MAX_TILES = 32;
  const MAX_CANVAS_WIDTH = 1_600;
  const MAX_CANVAS_HEIGHT = 30_000;
  const MAX_JPEG_BYTES = 700_000;
  const MAX_TILE_DATA_URL = 1_000_000;

  function safeForegroundUrl(raw) {
    let url;
    try { url = new URL(String(raw)); } catch { throw new Error("url_invalid"); }
    if (!NORMAL_WEB_PROTOCOLS.has(url.protocol) || url.username || url.password) {
      throw new Error("foreground_origin_not_allowed");
    }
    return url;
  }

  function boundedInteger(value, minimum, maximum, error) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum || number > maximum) throw new Error(error);
    return Math.round(number);
  }

  async function contentCommand(tabId, action, values = {}) {
    let response;
    try {
      response = await chrome.tabs.sendMessage(tabId, { protocol: PROTOCOL, action, ...values }, { frameId: 0 });
    } catch {
      throw new Error("screenshot_content_unavailable");
    }
    if (!response?.ok) throw new Error(response?.error || "screenshot_content_failure");
    return response.result;
  }

  async function assertStillActive(tabId, target) {
    const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const active = activeTabs[0];
    if (active?.id !== tabId || !active.url) throw new Error("screenshot_target_no_longer_active");
    let current;
    try { current = new URL(active.url); } catch { throw new Error("screenshot_target_url_invalid"); }
    if (current.origin !== target.origin || current.pathname !== target.pathname) throw new Error("screenshot_target_mismatch");
    return active;
  }

  async function bitmapFromDataUrl(dataUrl) {
    if (typeof dataUrl !== "string" || dataUrl.length > MAX_TILE_DATA_URL || !dataUrl.startsWith("data:image/")) {
      throw new Error("screenshot_tile_invalid");
    }
    let response;
    try { response = await fetch(dataUrl); } catch { throw new Error("screenshot_tile_decode_failed"); }
    if (!response.ok) throw new Error("screenshot_tile_decode_failed");
    try { return await createImageBitmap(await response.blob()); }
    catch { throw new Error("screenshot_tile_decode_failed"); }
  }

  function canvasContext(canvas) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("screenshot_canvas_unavailable");
    return context;
  }

  async function boundedJpeg(canvas) {
    let current = canvas;
    const qualities = [0.58, 0.45, 0.32];
    for (let scalePass = 0; scalePass < 4; scalePass += 1) {
      for (const quality of qualities) {
        let blob;
        try { blob = await current.convertToBlob({ type: "image/jpeg", quality }); }
        catch { throw new Error("screenshot_encode_failed"); }
        if (blob.size > 0 && blob.size <= MAX_JPEG_BYTES) return { blob, canvas: current };
      }
      if (current.width <= 480 || current.height <= 480) break;
      const scaled = new OffscreenCanvas(Math.max(1, Math.floor(current.width * 0.8)), Math.max(1, Math.floor(current.height * 0.8)));
      canvasContext(scaled).drawImage(current, 0, 0, scaled.width, scaled.height);
      current = scaled;
    }
    throw new Error("screenshot_payload_too_large");
  }

  async function dataUrlFromBlob(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  }

  function captureOffsets(captureHeight, viewportHeight) {
    const maximumScroll = Math.max(0, captureHeight - viewportHeight);
    const offsets = [];
    for (let offset = 0; offset < maximumScroll && offsets.length < MAX_TILES - 1; offset += viewportHeight) offsets.push(offset);
    if (offsets.length === 0 || offsets[offsets.length - 1] !== maximumScroll) offsets.push(maximumScroll);
    return [...new Set(offsets)];
  }

  async function captureForegroundScreenshot(rawUrl, confirmed) {
    if (confirmed !== true) throw new Error("screenshot_foreground_confirmation_required");
    const target = safeForegroundUrl(rawUrl);
    const stored = await chrome.storage.session.get(GRANT_KEY);
    const grant = stored[GRANT_KEY];
    const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const active = activeTabs[0];
    if (!grant || grant.tab_id !== active?.id) throw new Error("screenshot_foreground_grant_missing");
    if (!Number.isInteger(grant.granted_at) || Date.now() - grant.granted_at > 120_000) throw new Error("screenshot_foreground_grant_expired");
    if (!active?.id || !active.url) throw new Error("screenshot_target_not_active");
    let current;
    try { current = new URL(active.url); } catch { throw new Error("screenshot_target_url_invalid"); }
    if (current.origin !== target.origin || current.pathname !== target.pathname || grant.origin !== current.origin || grant.pathname !== current.pathname) {
      throw new Error("screenshot_target_mismatch");
    }

    let metrics;
    let restored = false;
    try {
      metrics = await contentCommand(active.id, "screenshot_metrics");
      const viewportHeight = boundedInteger(metrics?.viewport_height, 100, 10_000, "screenshot_viewport_invalid");
      let documentHeight = boundedInteger(metrics?.document_height, viewportHeight, 2_000_000, "screenshot_document_invalid");
      let captureHeight = Math.min(documentHeight, MAX_CSS_HEIGHT, viewportHeight * MAX_TILES);
      let offsets = captureOffsets(captureHeight, viewportHeight);
      let canvas;
      let context;
      let imageWidth = 0;
      let imageHeight = 0;
      let pixelPerCss = 1;
      let outputScale = 1;
      let tileCount = 0;

      for (let index = 0; index < offsets.length && index < MAX_TILES; index += 1) {
        await assertStillActive(active.id, target);
        const scroll = await contentCommand(active.id, "screenshot_scroll", { y: offsets[index], suppress_pinned: index > 0 });
        const liveHeight = boundedInteger(scroll?.document_height ?? documentHeight, viewportHeight, 2_000_000, "screenshot_document_invalid");
        if (liveHeight > documentHeight) {
          documentHeight = liveHeight;
          captureHeight = Math.min(documentHeight, MAX_CSS_HEIGHT, viewportHeight * MAX_TILES);
          offsets = captureOffsets(captureHeight, viewportHeight);
        }
        const actualY = boundedInteger(scroll?.scroll_y, 0, documentHeight, "screenshot_scroll_invalid");
        const foreground = await assertStillActive(active.id, target);
        let tileDataUrl;
        try { tileDataUrl = await chrome.tabs.captureVisibleTab(foreground.windowId, { format: "jpeg", quality: 60 }); }
        catch { throw new Error("screenshot_capture_unavailable"); }
        const bitmap = await bitmapFromDataUrl(tileDataUrl);
        try {
          if (!canvas) {
            imageWidth = boundedInteger(bitmap.width, 100, 20_000, "screenshot_tile_dimensions_invalid");
            imageHeight = boundedInteger(bitmap.height, 100, 20_000, "screenshot_tile_dimensions_invalid");
            pixelPerCss = imageHeight / viewportHeight;
            const naturalHeight = Math.max(1, Math.ceil(captureHeight * pixelPerCss));
            outputScale = Math.min(1, MAX_CANVAS_WIDTH / imageWidth, MAX_CANVAS_HEIGHT / naturalHeight);
            canvas = new OffscreenCanvas(
              Math.max(1, Math.floor(imageWidth * outputScale)),
              Math.max(1, Math.floor(naturalHeight * outputScale)),
            );
            context = canvasContext(canvas);
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
          } else if (bitmap.width !== imageWidth || bitmap.height !== imageHeight) {
            throw new Error("screenshot_viewport_changed");
          }
          const remainingCss = Math.max(0, captureHeight - actualY);
          const sourceHeight = Math.min(imageHeight, Math.ceil(remainingCss * pixelPerCss));
          if (sourceHeight <= 0) continue;
          const destinationY = Math.round(actualY * pixelPerCss * outputScale);
          const destinationHeight = Math.min(canvas.height - destinationY, Math.ceil(sourceHeight * outputScale));
          if (destinationHeight <= 0) continue;
          context.drawImage(bitmap, 0, 0, imageWidth, sourceHeight, 0, destinationY, canvas.width, destinationHeight);
          tileCount += 1;
        } finally {
          if (typeof bitmap.close === "function") bitmap.close();
        }
      }

      if (!canvas || tileCount === 0) throw new Error("screenshot_capture_empty");
      const encoded = await boundedJpeg(canvas);
      const dataUrl = await dataUrlFromBlob(encoded.blob);
      await contentCommand(active.id, "screenshot_restore").catch(() => undefined);
      restored = true;
      return {
        status: "captured",
        capture_mode: "full_page",
        data_url: dataUrl,
        document_height: documentHeight,
        captured_height: captureHeight,
        output_width: encoded.canvas.width,
        output_height: encoded.canvas.height,
        tile_count: tileCount,
        truncated: captureHeight < documentHeight,
        tab_active: true,
        focus_changed: false,
        popup_opened: false,
      };
    } finally {
      if (!restored && active?.id) await contentCommand(active.id, "screenshot_restore").catch(() => undefined);
    }
  }

  globalThis.spiralCaptureForegroundScreenshot = captureForegroundScreenshot;
})();
