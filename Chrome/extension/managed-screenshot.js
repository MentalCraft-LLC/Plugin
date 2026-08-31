(() => {
  const NORMAL_WEB_PROTOCOLS = new Set(["http:", "https:"]);
  const MAX_JPEG_BYTES = 700_000;

  function safeUrl(raw) {
    let url;
    try { url = new URL(String(raw)); } catch { throw new Error("url_invalid"); }
    if (!NORMAL_WEB_PROTOCOLS.has(url.protocol) || url.username || url.password) {
      throw new Error("origin_not_allowed");
    }
    return url;
  }

  function jpegFromDataUrl(dataUrl) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return null;
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return null;
    const data = dataUrl.slice(comma + 1);
    if (data.length < 8) return null;
    const bytes = Math.ceil(data.length * 0.75);
    if (bytes <= 0 || bytes > MAX_JPEG_BYTES) return null;
    return data;
  }

  async function jpegFromVisibleTab(windowId) {
    if (!Number.isInteger(windowId)) return null;
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 58 });
      return jpegFromDataUrl(dataUrl);
    } catch {
      return null;
    }
  }

  async function captureWithoutDebugger(tab) {
    if (tab.active) return await jpegFromVisibleTab(tab.windowId);
    let focused;
    try { focused = await chrome.windows.getLastFocused(); } catch { focused = null; }
    if (!Number.isInteger(tab.windowId) || focused?.id === tab.windowId) return null;
    const previous = (await chrome.tabs.query({ active: true, windowId: tab.windowId }))[0];
    try {
      await chrome.tabs.update(tab.id, { active: true });
      return await jpegFromVisibleTab(tab.windowId);
    } finally {
      if (previous?.id && previous.id !== tab.id) {
        await chrome.tabs.update(previous.id, { active: true }).catch(() => undefined);
      }
    }
  }

  async function withDebugger(tabId, run) {
    let attached = false;
    try {
      await chrome.debugger.attach({ tabId }, "1.3");
      attached = true;
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      if (!/already attached/i.test(text)) throw new Error("screenshot_debugger_unavailable");
    }
    try {
      return await run();
    } finally {
      if (attached) await chrome.debugger.detach({ tabId }).catch(() => undefined);
    }
  }

  async function captureJpeg(tabId, quality, clip) {
    const params = {
      format: "jpeg",
      quality,
      fromSurface: true,
      captureBeyondViewport: false,
    };
    if (clip && typeof clip === "object" && clip.width > 0 && clip.height > 0) {
      params.clip = {
        x: Math.max(0, clip.x || 0),
        y: Math.max(0, clip.y || 0),
        width: Math.min(10000, clip.width),
        height: Math.min(10000, clip.height),
        scale: 1,
      };
    }
    const result = await chrome.debugger.sendCommand({ tabId }, "Page.captureScreenshot", params);
    if (!result || typeof result.data !== "string" || result.data.length < 8) {
      throw new Error("screenshot_capture_empty");
    }
    return result.data;
  }

  async function spiralCaptureManagedScreenshot(tabId, rawUrl, clip) {
    if (!Number.isInteger(tabId)) throw new Error("screenshot_tab_invalid");
    const target = safeUrl(rawUrl);
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.id || !tab.url) throw new Error("screenshot_target_not_managed");
    let current;
    try { current = new URL(tab.url); } catch { throw new Error("screenshot_target_url_invalid"); }
    if (current.origin !== target.origin || current.pathname !== target.pathname) {
      throw new Error("screenshot_target_mismatch");
    }

    if (!clip) {
      const visible = await captureWithoutDebugger(tab);
      if (visible) {
        return {
          status: "captured",
          capture_mode: "viewport",
          data_url: `data:image/jpeg;base64,${visible}`,
          tab_active: tab.active === true,
          focus_changed: false,
          popup_opened: false,
        };
      }
    }

    const jpeg = await withDebugger(tabId, async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      let lastError = "screenshot_capture_empty";
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          for (const quality of [58, 45, 32]) {
            const data = await captureJpeg(tabId, quality, clip);
            const bytes = Math.ceil(data.length * 0.75);
            if (bytes > 0 && bytes <= MAX_JPEG_BYTES) return data;
          }
          lastError = "screenshot_payload_too_large";
        } catch (error) {
          lastError = error instanceof Error ? error.message : "screenshot_capture_failed";
          if (attempt + 1 < 3) await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
      throw new Error(lastError);
    });

    return {
      status: "captured",
      capture_mode: clip ? "clip" : "viewport",
      data_url: `data:image/jpeg;base64,${jpeg}`,
      tab_active: tab.active === true,
      focus_changed: false,
      popup_opened: false,
      clip: clip || undefined,
    };
  }

  const PROTOCOL = "spiral.browser.v1";
  const MAX_CSS_HEIGHT = 24_000;
  const MAX_TILES = 32;
  const MAX_CANVAS_WIDTH = 1_600;
  const MAX_CANVAS_HEIGHT = 30_000;

  function boundedInteger(value, minimum, maximum, error) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum || number > maximum) throw new Error(error);
    return Math.round(number);
  }

  function captureOffsets(captureHeight, viewportHeight) {
    const maximumScroll = Math.max(0, captureHeight - viewportHeight);
    const offsets = [];
    for (let offset = 0; offset < maximumScroll && offsets.length < MAX_TILES - 1; offset += viewportHeight) offsets.push(offset);
    if (offsets.length === 0 || offsets[offsets.length - 1] !== maximumScroll) offsets.push(maximumScroll);
    return [...new Set(offsets)];
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

  async function bitmapFromDataUrl(dataUrl) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) throw new Error("screenshot_tile_invalid");
    let response;
    try { response = await fetch(dataUrl); } catch { throw new Error("screenshot_tile_decode_failed"); }
    if (!response.ok) throw new Error("screenshot_tile_decode_failed");
    try { return await createImageBitmap(await response.blob()); }
    catch { throw new Error("screenshot_tile_decode_failed"); }
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
      const context = scaled.getContext("2d", { alpha: false });
      if (!context) throw new Error("screenshot_canvas_unavailable");
      context.drawImage(current, 0, 0, scaled.width, scaled.height);
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

  async function captureTileData(tab) {
    const visible = await captureWithoutDebugger(tab);
    if (visible) return visible;
    return await withDebugger(tab.id, async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      return await captureJpeg(tab.id, 58);
    });
  }

  async function spiralCaptureManagedLongScreenshot(tabId, rawUrl) {
    if (!Number.isInteger(tabId)) throw new Error("screenshot_tab_invalid");
    const target = safeUrl(rawUrl);
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.id || !tab.url) throw new Error("screenshot_target_not_managed");
    let current;
    try { current = new URL(tab.url); } catch { throw new Error("screenshot_target_url_invalid"); }
    if (current.origin !== target.origin || current.pathname !== target.pathname) {
      throw new Error("screenshot_target_mismatch");
    }

    let restored = false;
    try {
      const metrics = await contentCommand(tabId, "screenshot_metrics");
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
        const scroll = await contentCommand(tabId, "screenshot_scroll", { y: offsets[index], suppress_pinned: index > 0 });
        const liveHeight = boundedInteger(scroll?.document_height ?? documentHeight, viewportHeight, 2_000_000, "screenshot_document_invalid");
        if (liveHeight > documentHeight) {
          documentHeight = liveHeight;
          captureHeight = Math.min(documentHeight, MAX_CSS_HEIGHT, viewportHeight * MAX_TILES);
          offsets = captureOffsets(captureHeight, viewportHeight);
        }
        const actualY = boundedInteger(scroll?.scroll_y, 0, documentHeight, "screenshot_scroll_invalid");
        const live = await chrome.tabs.get(tabId);
        const jpeg = await captureTileData(live);
        const bitmap = await bitmapFromDataUrl(`data:image/jpeg;base64,${jpeg}`);
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
            context = canvas.getContext("2d", { alpha: false });
            if (!context) throw new Error("screenshot_canvas_unavailable");
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
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
      await contentCommand(tabId, "screenshot_restore").catch(() => undefined);
      restored = true;
      return {
        status: "captured",
        capture_mode: "long",
        data_url: dataUrl,
        document_height: documentHeight,
        captured_height: captureHeight,
        output_width: encoded.canvas.width,
        output_height: encoded.canvas.height,
        tile_count: tileCount,
        truncated: captureHeight < documentHeight,
        tab_active: tab.active === true,
        focus_changed: false,
        popup_opened: false,
      };
    } finally {
      if (!restored) await contentCommand(tabId, "screenshot_restore").catch(() => undefined);
    }
  }

  globalThis.spiralCaptureManagedScreenshot = spiralCaptureManagedScreenshot;
  globalThis.spiralCaptureManagedLongScreenshot = spiralCaptureManagedLongScreenshot;
})();
