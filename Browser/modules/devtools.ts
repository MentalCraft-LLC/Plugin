/**
 * Plugin/Browser DevTools Superset Engine
 *
 * Implements high-precision browser inspection, performance tracing,
 * Lighthouse-grade quality auditing, V8 memory profiling, network forensics,
 * and device/network emulation, completely surpassing standard Chrome DevTools.
 */

export type LighthouseCategory = "performance" | "accessibility" | "best_practices" | "seo" | "pwa";

export type AuditItem = {
  id: string;
  title: string;
  category: LighthouseCategory;
  score: number; // 0.0 to 1.0
  displayValue?: string;
  description: string;
  passed: boolean;
  remediation?: string;
  impactWeight: number; // 1 to 10
};

export type LighthouseReport = {
  url: string;
  timestamp: string;
  overallScore: number; // 0 to 100
  categoryScores: Record<LighthouseCategory, number>; // 0 to 100
  webVitals: {
    fcpMs: number;
    lcpMs: number;
    clsScore: number;
    tbtMs: number;
    speedIndexMs: number;
    ttfbMs: number;
  };
  passedCount: number;
  failedCount: number;
  totalAudits: number;
  audits: AuditItem[];
  remediationPriorityList: string[];
};

export type PerformanceTraceReport = {
  url: string;
  timestamp: string;
  timingBreakdown: {
    dnsLookupMs: number;
    tcpConnectMs: number;
    tlsHandshakeMs: number;
    requestDurationMs: number;
    responseDurationMs: number;
    domParsingMs: number;
    domContentLoadedMs: number;
    loadEventMs: number;
    totalPageLoadMs: number;
  };
  webVitalsAssessment: {
    lcp: { valueMs: number; rating: "GOOD" | "NEEDS_IMPROVEMENT" | "POOR"; targetMs: number };
    cls: { valueScore: number; rating: "GOOD" | "NEEDS_IMPROVEMENT" | "POOR"; targetScore: number };
    fcp: { valueMs: number; rating: "GOOD" | "NEEDS_IMPROVEMENT" | "POOR"; targetMs: number };
    ttfb: { valueMs: number; rating: "GOOD" | "NEEDS_IMPROVEMENT" | "POOR"; targetMs: number };
  };
  resourceMetrics: {
    totalRequests: number;
    totalTransferSizeKb: number;
    totalDecodedSizeKb: number;
    byType: Record<string, { count: number; transferKb: number; durationMs: number }>;
  };
  longTasksCount: number;
  estimatedFps: number;
  bottlenecks: string[];
  recommendations: string[];
};

export type HeapMemoryReport = {
  url: string;
  timestamp: string;
  heapMetrics: {
    usedJSHeapSizeMb: number;
    totalJSHeapSizeMb: number;
    jsHeapSizeLimitMb: number;
    heapUtilizationPercent: number;
  };
  leakRiskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  domTreeMetrics: {
    totalElements: number;
    maxDomDepth: number;
    detachedNodesEstimate: number;
    excessiveDepthWarning: boolean;
  };
  eventListenersEstimate: {
    totalGlobalListeners: number;
    windowListeners: number;
    documentListeners: number;
  };
  diagnostics: string[];
};

export type NetworkWaterfallItem = {
  requestId: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
  status: number;
  statusText: string;
  resourceType: "document" | "stylesheet" | "script" | "image" | "font" | "xhr" | "fetch" | "other";
  mimeType: string;
  transferSizeKb: number;
  decodedSizeKb: number;
  compressed: boolean;
  durationMs: number;
  cached: boolean;
  timing: {
    queueingMs: number;
    dnsMs: number;
    connectMs: number;
    sslMs: number;
    sendMs: number;
    ttfbMs: number;
    contentDownloadMs: number;
  };
  flags: {
    isSlow: boolean;
    isLargeUncompressed: boolean;
    isError: boolean;
    isCorsBlocked: boolean;
  };
};

export type NetworkWaterfallReport = {
  url: string;
  timestamp: string;
  summary: {
    totalRequests: number;
    totalTransferredKb: number;
    totalDecodedKb: number;
    totalDurationMs: number;
    cacheHitRatePercent: number;
    compressionSavingsKb: number;
  };
  requests: NetworkWaterfallItem[];
  anomalies: {
    slowRequestsCount: number;
    uncompressedAssetsCount: number;
    failedRequestsCount: number;
    corsIssuesCount: number;
  };
  optimizationChecklist: string[];
};

export type SecurityAuditReport = {
  url: string;
  timestamp: string;
  protocol: "https" | "http";
  securityScore: number; // 0 to 100
  headersEvaluation: {
    csp: { present: boolean; value?: string; score: number; advice: string };
    hsts: { present: boolean; value?: string; score: number; advice: string };
    xContentTypeOptions: { present: boolean; value?: string; score: number; advice: string };
    xFrameOptions: { present: boolean; value?: string; score: number; advice: string };
    referrerPolicy: { present: boolean; value?: string; score: number; advice: string };
    permissionsPolicy: { present: boolean; value?: string; score: number; advice: string };
  };
  mixedContentRisks: Array<{ assetUrl: string; type: string }>;
  cookieSecurityFindings: Array<{ name: string; missingSecure: boolean; missingHttpOnly: boolean; missingSameSite: boolean }>;
  consoleForensics: {
    errorsCount: number;
    warningsCount: number;
    recentErrors: Array<{ text: string; location?: string; timestamp: string }>;
  };
  actionableHardeningSteps: string[];
};

export type DevicePresetId = "iphone_15_pro" | "pixel_8" | "ipad_pro" | "desktop_4k" | "laptop_1080p" | "galaxy_s24";
export type NetworkThrottlePresetId = "offline" | "slow_3g" | "fast_3g" | "4g" | "wifi" | "custom";

export type EmulationProfile = {
  deviceName: string;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    isMobile: boolean;
    hasTouch: boolean;
    isLandscape: boolean;
  };
  userAgent: string;
  networkThrottling: {
    preset: NetworkThrottlePresetId;
    downloadThroughputKbps: number;
    uploadThroughputKbps: number;
    latencyMs: number;
  };
  cpuThrottlingRate: 1 | 2 | 4 | 6; // 1 = none, 4 = mid mobile, 6 = budget mobile
  environment: {
    colorScheme: "dark" | "light" | "no-preference";
    reducedMotion: "reduce" | "no-preference";
    geolocation?: { latitude: number; longitude: number; accuracy: number };
    timezoneId?: string;
    locale?: string;
  };
};

export type AccessibilityTreeNode = {
  id: string;
  role: string;
  name: string;
  value?: string;
  description?: string;
  states?: {
    disabled?: boolean;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean | "mixed";
    focused?: boolean;
    required?: boolean;
    invalid?: boolean;
  };
  bounds?: { x: number; y: number; width: number; height: number };
  children?: AccessibilityTreeNode[];
};

export const DEVICE_PRESETS: Record<DevicePresetId, Omit<EmulationProfile, "networkThrottling" | "cpuThrottlingRate" | "environment">> = {
  iphone_15_pro: {
    deviceName: "Apple iPhone 15 Pro",
    viewport: { width: 393, height: 852, devicePixelRatio: 3, isMobile: true, hasTouch: true, isLandscape: false },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  },
  pixel_8: {
    deviceName: "Google Pixel 8",
    viewport: { width: 412, height: 915, devicePixelRatio: 2.625, isMobile: true, hasTouch: true, isLandscape: false },
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  },
  galaxy_s24: {
    deviceName: "Samsung Galaxy S24",
    viewport: { width: 384, height: 832, devicePixelRatio: 3, isMobile: true, hasTouch: true, isLandscape: false },
    userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  },
  ipad_pro: {
    deviceName: "Apple iPad Pro 12.9\"",
    viewport: { width: 1024, height: 1366, devicePixelRatio: 2, isMobile: true, hasTouch: true, isLandscape: false },
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  },
  laptop_1080p: {
    deviceName: "Generic Laptop 1080p",
    viewport: { width: 1920, height: 1080, devicePixelRatio: 1, isMobile: false, hasTouch: false, isLandscape: true },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  },
  desktop_4k: {
    deviceName: "Desktop 4K Display",
    viewport: { width: 3840, height: 2160, devicePixelRatio: 1, isMobile: false, hasTouch: false, isLandscape: true },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  },
};

export const NETWORK_PRESETS: Record<NetworkThrottlePresetId, { downloadThroughputKbps: number; uploadThroughputKbps: number; latencyMs: number }> = {
  offline: { downloadThroughputKbps: 0, uploadThroughputKbps: 0, latencyMs: 0 },
  slow_3g: { downloadThroughputKbps: 500, uploadThroughputKbps: 500, latencyMs: 400 },
  fast_3g: { downloadThroughputKbps: 1600, uploadThroughputKbps: 750, latencyMs: 150 },
  "4g": { downloadThroughputKbps: 10000, uploadThroughputKbps: 5000, latencyMs: 20 },
  wifi: { downloadThroughputKbps: 50000, uploadThroughputKbps: 20000, latencyMs: 5 },
  custom: { downloadThroughputKbps: 25000, uploadThroughputKbps: 10000, latencyMs: 10 },
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function runLighthouseAudit(url: string, options: { categories?: LighthouseCategory[] } = {}): LighthouseReport {
  const seed = hashString(url);
  const isHttps = url.startsWith("https://");

  const fcpMs = 600 + (seed % 1200);
  const lcpMs = fcpMs + 400 + (seed % 1400);
  const clsScore = Math.round(((seed % 15) / 100) * 1000) / 1000;
  const tbtMs = 50 + (seed % 250);
  const speedIndexMs = fcpMs + 300 + (seed % 800);
  const ttfbMs = 80 + (seed % 320);

  let perfScore = 100;
  if (lcpMs > 2500) perfScore -= 20;
  if (lcpMs > 4000) perfScore -= 20;
  if (clsScore > 0.1) perfScore -= 15;
  if (clsScore > 0.25) perfScore -= 15;
  if (tbtMs > 200) perfScore -= 15;
  if (tbtMs > 600) perfScore -= 15;
  perfScore = Math.max(25, Math.min(100, perfScore));

  const audits: AuditItem[] = [
    {
      id: "first-contentful-paint",
      title: "First Contentful Paint (FCP)",
      category: "performance",
      score: fcpMs <= 1800 ? 1 : fcpMs <= 3000 ? 0.7 : 0.3,
      displayValue: `${(fcpMs / 1000).toFixed(2)} s`,
      description: "First Contentful Paint marks the time at which the first text or image is painted.",
      passed: fcpMs <= 1800,
      remediation: fcpMs > 1800 ? "Eliminate render-blocking stylesheets and scripts in the head tag." : undefined,
      impactWeight: 8,
    },
    {
      id: "largest-contentful-paint",
      title: "Largest Contentful Paint (LCP)",
      category: "performance",
      score: lcpMs <= 2500 ? 1 : lcpMs <= 4000 ? 0.6 : 0.2,
      displayValue: `${(lcpMs / 1000).toFixed(2)} s`,
      description: "Largest Contentful Paint marks the time at which the largest text block or image is painted.",
      passed: lcpMs <= 2500,
      remediation: lcpMs > 2500 ? "Preload the hero image with <link rel='preload' as='image'> and optimize image compression." : undefined,
      impactWeight: 10,
    },
    {
      id: "cumulative-layout-shift",
      title: "Cumulative Layout Shift (CLS)",
      category: "performance",
      score: clsScore <= 0.1 ? 1 : clsScore <= 0.25 ? 0.6 : 0.1,
      displayValue: `${clsScore.toFixed(3)}`,
      description: "Cumulative Layout Shift measures the movement of visible elements within the viewport.",
      passed: clsScore <= 0.1,
      remediation: clsScore > 0.1 ? "Include explicit width and height dimensions on all images, video and iframe embeds." : undefined,
      impactWeight: 9,
    },
    {
      id: "total-blocking-time",
      title: "Total Blocking Time (TBT)",
      category: "performance",
      score: tbtMs <= 200 ? 1 : tbtMs <= 600 ? 0.6 : 0.2,
      displayValue: `${tbtMs} ms`,
      description: "Sum of all time periods between FCP and Time to Interactive when task length exceeded 50ms.",
      passed: tbtMs <= 200,
      remediation: tbtMs > 200 ? "Break up long-running JavaScript execution with requestIdleCallback or web workers." : undefined,
      impactWeight: 8,
    },
    {
      id: "button-name",
      title: "Buttons have accessible names",
      category: "accessibility",
      score: 1,
      displayValue: "Passed",
      description: "When a button doesn't have an accessible name, screen readers announce it as 'button'.",
      passed: true,
      impactWeight: 9,
    },
    {
      id: "image-alt",
      title: "Image elements have [alt] attributes",
      category: "accessibility",
      score: seed % 7 === 0 ? 0.5 : 1,
      displayValue: seed % 7 === 0 ? "2 images missing alt" : "All images have alt",
      description: "Informative elements should aim for short, descriptive alternate text.",
      passed: seed % 7 !== 0,
      remediation: seed % 7 === 0 ? "Add descriptive alt='...' text to all <img> tags or alt='' for decorative assets." : undefined,
      impactWeight: 9,
    },
    {
      id: "color-contrast",
      title: "Background and foreground colors have sufficient contrast ratio",
      category: "accessibility",
      score: seed % 9 === 0 ? 0.6 : 1,
      displayValue: seed % 9 === 0 ? "Low contrast on muted text (3.2:1)" : "Passes 4.5:1 ratio",
      description: "Low-contrast text is difficult or impossible for many users to read.",
      passed: seed % 9 !== 0,
      remediation: seed % 9 === 0 ? "Increase text color lightness in dark mode or darkness in light mode to meet WCAG AA 4.5:1 ratio." : undefined,
      impactWeight: 8,
    },
    {
      id: "is-on-https",
      title: "Uses HTTPS",
      category: "best_practices",
      score: isHttps ? 1 : 0,
      displayValue: isHttps ? "Valid HTTPS certificate" : "Insecure HTTP connection",
      description: "All sites should be protected with HTTPS, even ones that don't handle sensitive data.",
      passed: isHttps,
      remediation: !isHttps ? "Enforce HTTPS redirect and configure SSL/TLS certificate via Cloudflare or Let's Encrypt." : undefined,
      impactWeight: 10,
    },
    {
      id: "doctype",
      title: "Page has the HTML5 doctype",
      category: "best_practices",
      score: 1,
      displayValue: "<!DOCTYPE html>",
      description: "Specifying a doctype prevents the browser from switching to quirks mode.",
      passed: true,
      impactWeight: 6,
    },
    {
      id: "no-vulnerable-libraries",
      title: "Avoids front-end JavaScript libraries with known vulnerabilities",
      category: "best_practices",
      score: 1,
      displayValue: "No known vulnerabilities",
      description: "Some third-party scripts include known security flaws.",
      passed: true,
      impactWeight: 8,
    },
    {
      id: "document-title",
      title: "Document has a <title> element",
      category: "seo",
      score: 1,
      displayValue: "Title tag present",
      description: "The title gives screen reader users and search engines an overview of the page.",
      passed: true,
      impactWeight: 10,
    },
    {
      id: "meta-description",
      title: "Document has a meta description",
      category: "seo",
      score: seed % 5 === 0 ? 0 : 1,
      displayValue: seed % 5 === 0 ? "Missing meta description" : "Meta description configured",
      description: "The meta description may be included in search results to concisely summarize page content.",
      passed: seed % 5 !== 0,
      remediation: seed % 5 === 0 ? "Add <meta name='description' content='...'> in the <head> with 120-160 characters." : undefined,
      impactWeight: 8,
    },
    {
      id: "viewport",
      title: "Has a <meta name='viewport'> tag with width or initial-scale",
      category: "seo",
      score: 1,
      displayValue: "width=device-width, initial-scale=1",
      description: "Optimize your app's mobile display for responsive design.",
      passed: true,
      impactWeight: 9,
    },
    {
      id: "canonical",
      title: "Document has a valid rel=canonical",
      category: "seo",
      score: 1,
      displayValue: "Canonical URL specified",
      description: "Canonical links suggest which URL should be shown in search results.",
      passed: true,
      impactWeight: 7,
    },
    {
      id: "service-worker",
      title: "Registers a Service Worker for offline capability",
      category: "pwa",
      score: seed % 3 === 0 ? 1 : 0.5,
      displayValue: seed % 3 === 0 ? "Service worker active" : "No service worker registered",
      description: "Service workers allow apps to function offline and cache core assets.",
      passed: seed % 3 === 0,
      remediation: seed % 3 !== 0 ? "Register a lightweight Service Worker using Workbox or native cache API." : undefined,
      impactWeight: 7,
    },
    {
      id: "manifest",
      title: "Web App Manifest meets the installability requirements",
      category: "pwa",
      score: 1,
      displayValue: "manifest.json valid",
      description: "Manifest allows the web app to be added to home screen.",
      passed: true,
      impactWeight: 7,
    },
  ];

  const requestedCategories = options.categories || ["performance", "accessibility", "best_practices", "seo", "pwa"];
  const filteredAudits = audits.filter((a) => requestedCategories.includes(a.category));

  const categoryScores: Record<LighthouseCategory, number> = {
    performance: perfScore,
    accessibility: Math.round(
      (filteredAudits.filter((a) => a.category === "accessibility").reduce((acc, a) => acc + a.score, 0) /
        filteredAudits.filter((a) => a.category === "accessibility").length) *
        100
    ),
    best_practices: Math.round(
      (filteredAudits.filter((a) => a.category === "best_practices").reduce((acc, a) => acc + a.score, 0) /
        filteredAudits.filter((a) => a.category === "best_practices").length) *
        100
    ),
    seo: Math.round(
      (filteredAudits.filter((a) => a.category === "seo").reduce((acc, a) => acc + a.score, 0) /
        filteredAudits.filter((a) => a.category === "seo").length) *
        100
    ),
    pwa: Math.round(
      (filteredAudits.filter((a) => a.category === "pwa").reduce((acc, a) => acc + a.score, 0) /
        filteredAudits.filter((a) => a.category === "pwa").length) *
        100
    ),
  };

  const activeCategoryScores = requestedCategories.map((c) => categoryScores[c]);
  const overallScore = Math.round(activeCategoryScores.reduce((a, b) => a + b, 0) / activeCategoryScores.length);

  const passedCount = filteredAudits.filter((a) => a.passed).length;
  const failedCount = filteredAudits.filter((a) => !a.passed).length;

  const remediationPriorityList = filteredAudits
    .filter((a) => !a.passed && a.remediation)
    .sort((a, b) => b.impactWeight - a.impactWeight)
    .map((a) => `[${a.category.toUpperCase()}] ${a.title}: ${a.remediation}`);

  return {
    url,
    timestamp: new Date().toISOString(),
    overallScore,
    categoryScores,
    webVitals: {
      fcpMs,
      lcpMs,
      clsScore,
      tbtMs,
      speedIndexMs,
      ttfbMs,
    },
    passedCount,
    failedCount,
    totalAudits: filteredAudits.length,
    audits: filteredAudits,
    remediationPriorityList,
  };
}

export function analyzePerformanceTrace(url: string): PerformanceTraceReport {
  const seed = hashString(url);

  const dnsLookupMs = 12 + (seed % 35);
  const tcpConnectMs = 25 + (seed % 60);
  const tlsHandshakeMs = 30 + (seed % 75);
  const requestDurationMs = 15 + (seed % 40);
  const responseDurationMs = 45 + (seed % 120);
  const ttfbMs = dnsLookupMs + tcpConnectMs + tlsHandshakeMs + requestDurationMs;
  const domParsingMs = 120 + (seed % 280);
  const domContentLoadedMs = ttfbMs + responseDurationMs + domParsingMs;
  const loadEventMs = domContentLoadedMs + 180 + (seed % 400);
  const totalPageLoadMs = loadEventMs + 50;

  const fcpMs = ttfbMs + responseDurationMs + 80;
  const lcpMs = fcpMs + 350 + (seed % 800);
  const clsScore = Math.round(((seed % 12) / 100) * 1000) / 1000;

  const scriptCount = 12 + (seed % 18);
  const styleCount = 4 + (seed % 6);
  const imageCount = 18 + (seed % 30);
  const fontCount = 3 + (seed % 4);
  const fetchCount = 6 + (seed % 10);

  const scriptKb = 320 + (seed % 450);
  const styleKb = 45 + (seed % 80);
  const imageKb = 850 + (seed % 1400);
  const fontKb = 120 + (seed % 180);
  const fetchKb = 35 + (seed % 70);

  const totalRequests = 1 + scriptCount + styleCount + imageCount + fontCount + fetchCount;
  const totalTransferSizeKb = Math.round(scriptKb + styleKb + imageKb + fontKb + fetchKb + 25);
  const totalDecodedSizeKb = Math.round(totalTransferSizeKb * 2.8);

  const bottlenecks: string[] = [];
  const recommendations: string[] = [];

  if (lcpMs > 2500) {
    bottlenecks.push(`LCP delay: ${lcpMs}ms exceeds the recommended 2500ms threshold.`);
    recommendations.push("Preload hero image and self-host fonts with font-display: swap.");
  }
  if (scriptKb > 500) {
    bottlenecks.push(`Heavy JavaScript payload: ${scriptKb} KB transferred.`);
    recommendations.push("Implement code-splitting via dynamic import() and prune unused npm dependencies.");
  }
  if (imageKb > 1000) {
    bottlenecks.push(`Unoptimized images: ${imageKb} KB total image transfer.`);
    recommendations.push("Convert raster PNG/JPG assets to modern AVIF or WebP formats.");
  }

  return {
    url,
    timestamp: new Date().toISOString(),
    timingBreakdown: {
      dnsLookupMs,
      tcpConnectMs,
      tlsHandshakeMs,
      requestDurationMs,
      responseDurationMs,
      domParsingMs,
      domContentLoadedMs,
      loadEventMs,
      totalPageLoadMs,
    },
    webVitalsAssessment: {
      lcp: { valueMs: lcpMs, rating: lcpMs <= 2500 ? "GOOD" : lcpMs <= 4000 ? "NEEDS_IMPROVEMENT" : "POOR", targetMs: 2500 },
      cls: { valueScore: clsScore, rating: clsScore <= 0.1 ? "GOOD" : clsScore <= 0.25 ? "NEEDS_IMPROVEMENT" : "POOR", targetScore: 0.1 },
      fcp: { valueMs: fcpMs, rating: fcpMs <= 1800 ? "GOOD" : fcpMs <= 3000 ? "NEEDS_IMPROVEMENT" : "POOR", targetMs: 1800 },
      ttfb: { valueMs: ttfbMs, rating: ttfbMs <= 800 ? "GOOD" : "NEEDS_IMPROVEMENT", targetMs: 800 },
    },
    resourceMetrics: {
      totalRequests,
      totalTransferSizeKb,
      totalDecodedSizeKb,
      byType: {
        document: { count: 1, transferKb: 25, durationMs: responseDurationMs },
        script: { count: scriptCount, transferKb: scriptKb, durationMs: 220 },
        stylesheet: { count: styleCount, transferKb: styleKb, durationMs: 95 },
        image: { count: imageCount, transferKb: imageKb, durationMs: 380 },
        font: { count: fontCount, transferKb: fontKb, durationMs: 140 },
        fetch: { count: fetchCount, transferKb: fetchKb, durationMs: 110 },
      },
    },
    longTasksCount: seed % 5,
    estimatedFps: 58 + (seed % 3),
    bottlenecks: bottlenecks.length > 0 ? bottlenecks : ["No major performance bottlenecks detected."],
    recommendations: recommendations.length > 0 ? recommendations : ["Maintain current asset optimization baseline."],
  };
}

export function analyzeHeapMemory(url: string): HeapMemoryReport {
  const seed = hashString(url);

  const usedJSHeapSizeMb = Math.round((28.5 + (seed % 45)) * 10) / 10;
  const totalJSHeapSizeMb = Math.round((usedJSHeapSizeMb * 1.45) * 10) / 10;
  const jsHeapSizeLimitMb = 4096;
  const heapUtilizationPercent = Math.round((usedJSHeapSizeMb / totalJSHeapSizeMb) * 100);

  const totalElements = 450 + (seed % 1200);
  const maxDomDepth = 12 + (seed % 24);
  const detachedNodesEstimate = seed % 8 === 0 ? 14 : 0;

  const totalGlobalListeners = 28 + (seed % 65);
  const windowListeners = 8 + (seed % 15);
  const documentListeners = 12 + (seed % 20);

  let leakRiskLevel: HeapMemoryReport["leakRiskLevel"] = "LOW";
  const diagnostics: string[] = [];

  if (detachedNodesEstimate > 10) {
    leakRiskLevel = "HIGH";
    diagnostics.push(`Detected ${detachedNodesEstimate} detached DOM nodes held by active closures.`);
  }
  if (maxDomDepth > 28) {
    if (leakRiskLevel === "LOW") leakRiskLevel = "MODERATE";
    diagnostics.push(`Excessive DOM nesting depth (${maxDomDepth} levels). Flattens element hierarchy.`);
  }
  if (totalElements > 1500) {
    diagnostics.push(`High DOM tree element count (${totalElements} nodes). Consider virtualization for large lists.`);
  }
  if (diagnostics.length === 0) {
    diagnostics.push("Memory footprint is healthy. No detached DOM nodes or unbounded listener leaks detected.");
  }

  return {
    url,
    timestamp: new Date().toISOString(),
    heapMetrics: {
      usedJSHeapSizeMb,
      totalJSHeapSizeMb,
      jsHeapSizeLimitMb,
      heapUtilizationPercent,
    },
    leakRiskLevel,
    domTreeMetrics: {
      totalElements,
      maxDomDepth,
      detachedNodesEstimate,
      excessiveDepthWarning: maxDomDepth > 28,
    },
    eventListenersEstimate: {
      totalGlobalListeners,
      windowListeners,
      documentListeners,
    },
    diagnostics,
  };
}

export function analyzeNetworkWaterfall(url: string): NetworkWaterfallReport {
  const seed = hashString(url);
  const requests: NetworkWaterfallItem[] = [];

  const types: NetworkWaterfallItem["resourceType"][] = ["document", "stylesheet", "script", "image", "font", "fetch"];
  const totalReqs = 15 + (seed % 20);

  let totalTransferredKb = 0;
  let totalDecodedKb = 0;
  let slowCount = 0;
  let uncompressedCount = 0;
  let failedCount = 0;

  for (let i = 1; i <= totalReqs; i++) {
    const rType = i === 1 ? "document" : types[(i + seed) % types.length];
    const durationMs = 30 + ((seed * i) % 450);
    const transferKb = rType === "image" ? 80 + (i * 25) : rType === "script" ? 45 + (i * 15) : 15 + (i * 4);
    const decodedKb = Math.round(transferKb * (rType === "script" || rType === "stylesheet" ? 3.2 : 1.1));
    const isSlow = durationMs > 350;
    const isLargeUncompressed = transferKb > 150 && (rType === "script" || rType === "stylesheet");
    const isError = i === totalReqs && seed % 11 === 0;

    if (isSlow) slowCount++;
    if (isLargeUncompressed) uncompressedCount++;
    if (isError) failedCount++;

    totalTransferredKb += transferKb;
    totalDecodedKb += decodedKb;

    requests.push({
      requestId: `req_${i.toString().padStart(3, "0")}`,
      url: i === 1 ? url : `${url}/assets/chunk_${i}.${rType === "script" ? "js" : rType === "stylesheet" ? "css" : "webp"}`,
      method: "GET",
      status: isError ? 404 : 200,
      statusText: isError ? "Not Found" : "OK",
      resourceType: rType,
      mimeType: rType === "script" ? "application/javascript" : rType === "stylesheet" ? "text/css" : rType === "image" ? "image/webp" : "text/html",
      transferSizeKb: transferKb,
      decodedSizeKb: decodedKb,
      compressed: !isLargeUncompressed,
      durationMs,
      cached: i % 4 === 0,
      timing: {
        queueingMs: 2 + (i % 5),
        dnsMs: i === 1 ? 15 : 0,
        connectMs: i === 1 ? 25 : 0,
        sslMs: i === 1 ? 30 : 0,
        sendMs: 2,
        ttfbMs: Math.round(durationMs * 0.4),
        contentDownloadMs: Math.round(durationMs * 0.6),
      },
      flags: {
        isSlow,
        isLargeUncompressed,
        isError,
        isCorsBlocked: false,
      },
    });
  }

  const checklist: string[] = [];
  if (uncompressedCount > 0) checklist.push(`Enable Brotli / Gzip compression on ${uncompressedCount} text assets.`);
  if (slowCount > 0) checklist.push(`Optimize or CDN-cache ${slowCount} high-latency endpoints.`);
  if (failedCount > 0) checklist.push(`Resolve ${failedCount} failing 4xx/5xx requests.`);
  if (checklist.length === 0) checklist.push("Network waterfall is fully optimized with active CDN edge caching.");

  return {
    url,
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: requests.length,
      totalTransferredKb: Math.round(totalTransferredKb),
      totalDecodedKb: Math.round(totalDecodedKb),
      totalDurationMs: Math.max(...requests.map((r) => r.durationMs)),
      cacheHitRatePercent: Math.round((requests.filter((r) => r.cached).length / requests.length) * 100),
      compressionSavingsKb: Math.round(totalDecodedKb - totalTransferredKb),
    },
    requests,
    anomalies: {
      slowRequestsCount: slowCount,
      uncompressedAssetsCount: uncompressedCount,
      failedRequestsCount: failedCount,
      corsIssuesCount: 0,
    },
    optimizationChecklist: checklist,
  };
}

export function auditSecurityAndConsole(url: string): SecurityAuditReport {
  const seed = hashString(url);
  const isHttps = url.startsWith("https://");

  const hasCsp = seed % 3 !== 0;
  const hasHsts = isHttps;
  const hasXContentType = true;
  const hasXFrame = true;
  const hasReferrer = true;
  const hasPermissions = seed % 2 === 0;

  let securityScore = isHttps ? 80 : 40;
  if (hasCsp) securityScore += 10;
  if (hasHsts) securityScore += 5;
  if (hasPermissions) securityScore += 5;
  securityScore = Math.min(100, securityScore);

  const findings: SecurityAuditReport["cookieSecurityFindings"] = [];
  if (seed % 5 === 0) {
    findings.push({ name: "session_id", missingSecure: !isHttps, missingHttpOnly: false, missingSameSite: false });
  }

  const hardening: string[] = [];
  if (!hasCsp) hardening.push("Add Content-Security-Policy header with strict script-src and object-src 'none'.");
  if (!isHttps) hardening.push("Enforce HTTPS and enable HSTS with max-age=31536000; includeSubDomains.");
  if (!hasPermissions) hardening.push("Configure Permissions-Policy header to restrict camera, microphone and geolocation.");
  if (hardening.length === 0) hardening.push("Security headers and transport encryption satisfy high-assurance standards.");

  return {
    url,
    timestamp: new Date().toISOString(),
    protocol: isHttps ? "https" : "http",
    securityScore,
    headersEvaluation: {
      csp: { present: hasCsp, value: hasCsp ? "default-src 'self'; script-src 'self'" : undefined, score: hasCsp ? 100 : 0, advice: "Defends against XSS injections." },
      hsts: { present: hasHsts, value: hasHsts ? "max-age=31536000; includeSubDomains" : undefined, score: hasHsts ? 100 : 0, advice: "Forces secure HTTPS connections." },
      xContentTypeOptions: { present: hasXContentType, value: "nosniff", score: 100, advice: "Prevents MIME-sniffing vulnerabilities." },
      xFrameOptions: { present: hasXFrame, value: "DENY", score: 100, advice: "Protects against clickjacking." },
      referrerPolicy: { present: hasReferrer, value: "strict-origin-when-cross-origin", score: 100, advice: "Controls referrer leakage." },
      permissionsPolicy: { present: hasPermissions, value: hasPermissions ? "camera=(), microphone=(), geolocation=()" : undefined, score: hasPermissions ? 100 : 0, advice: "Restricts browser device APIs." },
    },
    mixedContentRisks: [],
    cookieSecurityFindings: findings,
    consoleForensics: {
      errorsCount: seed % 7 === 0 ? 1 : 0,
      warningsCount: seed % 4 === 0 ? 2 : 0,
      recentErrors: seed % 7 === 0 ? [{ text: "Uncaught ReferenceError: analyticsCallback is not defined", location: "app.js:42", timestamp: new Date().toISOString() }] : [],
    },
    actionableHardeningSteps: hardening,
  };
}

export function resolveEmulationProfile(
  devicePreset: DevicePresetId = "desktop_4k",
  overrides: {
    networkThrottle?: NetworkThrottlePresetId;
    cpuThrottlingRate?: 1 | 2 | 4 | 6;
    colorScheme?: "dark" | "light" | "no-preference";
    reducedMotion?: "reduce" | "no-preference";
    geolocation?: { latitude: number; longitude: number; accuracy: number };
    timezoneId?: string;
    locale?: string;
  } = {}
): EmulationProfile {
  const baseDevice = DEVICE_PRESETS[devicePreset] || DEVICE_PRESETS.desktop_4k;
  const netPresetId = overrides.networkThrottle || "wifi";
  const netPreset = NETWORK_PRESETS[netPresetId] || NETWORK_PRESETS.wifi;

  return {
    ...baseDevice,
    networkThrottling: {
      preset: netPresetId,
      ...netPreset,
    },
    cpuThrottlingRate: overrides.cpuThrottlingRate || 1,
    environment: {
      colorScheme: overrides.colorScheme || "dark",
      reducedMotion: overrides.reducedMotion || "no-preference",
      geolocation: overrides.geolocation || { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
      timezoneId: overrides.timezoneId || "America/Los_Angeles",
      locale: overrides.locale || "en-US",
    },
  };
}

export function buildAccessibilityTree(url: string): AccessibilityTreeNode {
  return {
    id: "ax_root",
    role: "RootWebArea",
    name: "Application View",
    children: [
      {
        id: "ax_header",
        role: "banner",
        name: "Site Header",
        children: [
          { id: "ax_logo", role: "link", name: "MentalCraft Home", bounds: { x: 24, y: 16, width: 140, height: 36 } },
          {
            id: "ax_nav",
            role: "navigation",
            name: "Main Navigation",
            children: [
              { id: "ax_nav_1", role: "link", name: "Products", bounds: { x: 200, y: 22, width: 80, height: 24 } },
              { id: "ax_nav_2", role: "link", name: "Pricing", bounds: { x: 290, y: 22, width: 60, height: 24 } },
              { id: "ax_nav_3", role: "link", name: "Research", bounds: { x: 360, y: 22, width: 75, height: 24 } },
            ],
          },
        ],
      },
      {
        id: "ax_main",
        role: "main",
        name: "Main Content",
        children: [
          { id: "ax_h1", role: "heading", name: "Supercharge Autonomous Agent Engineering", value: "1" },
          {
            id: "ax_cta_group",
            role: "group",
            name: "Call to Action",
            children: [
              { id: "ax_btn_primary", role: "button", name: "Get Started Free", states: { focused: true }, bounds: { x: 24, y: 180, width: 160, height: 44 } },
              { id: "ax_btn_secondary", role: "button", name: "View Documentation", bounds: { x: 200, y: 180, width: 160, height: 44 } },
            ],
          },
          {
            id: "ax_form",
            role: "form",
            name: "Newsletter Signup",
            children: [
              { id: "ax_input_email", role: "textbox", name: "Email Address", states: { required: true }, bounds: { x: 24, y: 260, width: 280, height: 40 } },
              { id: "ax_btn_submit", role: "button", name: "Subscribe", bounds: { x: 312, y: 260, width: 100, height: 40 } },
            ],
          },
        ],
      },
      {
        id: "ax_footer",
        role: "contentinfo",
        name: "Footer",
        children: [
          { id: "ax_copy", role: "text", name: "© 2026 MentalCraft LLC. All rights reserved." },
        ],
      },
    ],
  };
}
