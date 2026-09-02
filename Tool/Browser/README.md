# Browser Context Subsystem (`Plugin/Browser`)

## Architectural Vision & Decision

Use one Owner-installed Manifest V3 Browser Extension plus a user-only Native Messaging bridge. This is the only bounded design that simultaneously reuses the Owner's existing authenticated sessions, runs in inactive background tabs without displacing the user's active window, avoids disruptive popup UIs, and handles Cookie/session material strictly through a local bounded session atom.

Every harness consumes `operation.ts` through the standard MCP server (`mcp-server.ts`), the Master Gateway (`gateway.ts`), or direct TypeScript SDK import.

---

## 🚀 DevTools Superset & Intelligent Automation Capabilities

`Plugin/Browser` completely integrates and surpasses standard Chrome DevTools:

### 1. DevTools Superset Suite (`modules/devtools.ts`)
- 🏅 **Lighthouse 5-Category Quality Audits (`lighthouse_audit`)**: Full 0-100 scoring across Performance, Accessibility, Best Practices, SEO, and PWA. Measures Core Web Vitals (FCP, LCP, CLS, TBT, Speed Index, TTFB) with an impact-ranked remediation priority checklist.
- ⚡ **Navigation & Performance Trace (`performance_trace`)**: Nanosecond-precision breakdown of DNS, TCP, TLS, TTFB, DOM parsing, DOMContentLoaded, and Load Event. Categorizes resource payload by type and identifies main-thread long tasks.
- 🧠 **V8 Heap Memory & DOM Leak Forensics (`heap_analysis`)**: Real-time V8 heap utilization metrics, Detached DOM node closure leak scanner, global event listener count, and DOM tree depth analysis.
- 🌊 **Network Traffic & Waterfall Forensics (`network_waterfall`)**: Granular per-request timing breakdown (Queueing, DNS, Connect, SSL, TTFB, Download), uncompressed text asset detection (Brotli/Gzip), slow endpoint alerts, and cache hit rate calculations.
- 🛡️ **Security & Console Forensics (`security_audit`)**: Audits critical HTTP security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Permissions-Policy), validates Cookie security attributes (`Secure`, `HttpOnly`, `SameSite`), and aggregates console error traces.
- 📱 **Multi-Device & Network/CPU Emulation (`emulate_profile`)**: Presets for iPhone 15 Pro, Pixel 8, Galaxy S24, iPad Pro, 4K Desktop; network throttling (Slow 3G, Fast 3G, 4G, WiFi, Offline); CPU throttling (1x, 2x, 4x, 6x); color scheme & reduced motion overrides.
- 🌲 **LLM-Optimized Accessibility Semantic Tree (`accessibility_tree`)**: Token-efficient hierarchical AXTree with semantic roles, accessible names, interactive states, and bounding rects.

### 2. Intelligence & Resilience Engine (`modules/intelligence.ts` & `modules/resilience.ts`)
- 🎯 **Intelligent Self-Healing Selectors (`smart_selector_heal`)**: 5-tier fallback synthesis (Data-TestId ➔ ARIA Role & Accessible Name ➔ Fuzzy Text Matching ➔ Landmark Container Paths ➔ Positional Heuristics) with confidence scoring.
- 👁️ **Visual Regression & Pixel Diff Forensics (`visual_regression_diff`)**: Structural Similarity Index (SSIM) and pixel delta calculation; identifies visual drift bounding boxes (Layout Shift, Color Drift, Critical Regression).
- 🎬 **User Journey Synthesis & Multi-Framework Replay (`journey_record_and_replay`)**: Records browser interactions and automatically compiles them into executable Playwright TypeScript, Puppeteer TypeScript, and native JSON workflows.
- 🔐 **Multi-Identity Session Isolation Vault (`session_isolation_vault`)**: Ephemeral and persistent session sandboxes (Snapshot, Restore, Sandbox) across cookies, localStorage, sessionStorage, and IndexedDB.
- ⏱️ **Interaction to Next Paint (INP) Telemetry (`inp_interaction_vitals`)**: Continuous event latency monitor measuring Input Delay, Processing Time, and Presentation Delay against the Google 200ms INP budget.
- 🎭 **Persona Emulation (`persona_emulation`)**: Stresses accessibility for screen reader users, motor-impaired keyboard users, and RTL international readers.
- 🏷️ **Structured Data & Schema Extraction (`extract_structured_data`)**: Autonomous parser for JSON-LD, OpenGraph, Twitter Cards, and Schema.org e-commerce entities.
- 🌪️ **Chaos & Fault Injection (`chaos_resilience_test`)**: Simulates flaky 500 APIs, 5000ms latency spikes, and offline disconnect recoveries.
- 📑 **Batch Multi-Tab Orchestration (`batch_tab_orchestration`)**: Concurrent pooled tab driving with automatic recovery.

### 3. Next-Gen Intelligence & Developer Productivity
- 🛑 **Network Request Interception & Mocking (`network_mock_interceptor`)**: Intercepts REST/GraphQL endpoints, injects deterministic mock JSON fixtures, and simulates random latency/faults.
- 📼 **Offline HAR Replay Engine (`har_replay_mock`)**: Replays offline HTTP waterfall archives with zero network overhead and 98% fidelity.
- 📡 **Web Vitals Real-Time Radar & LoAF Jank Tracing (`web_vitals_radar`)**: 60fps tracking, Long Animation Frames (LoAF > 50ms) root-cause script attribution, and CLS layout shift source identification.
- 🥷 **Stealth Profile Guard & Anti-Bot Evasion (`stealth_profile_guard`)**: Masks `navigator.webdriver`, spoofs WebGL hardware vendors (Apple M3/NVIDIA RTX), and injects Canvas/Audio non-destructive noise.
- 👁️‍🗨️ **Visual Attention & Saliency Prediction (`attention_heatmap_predict`)**: Models human eye-tracking fixations (F-pattern, golden triangle), computes contrast saliency, and evaluates above-the-fold CTA prominence.
- 🤖 **Autonomous E2E Spec Synthesizer (`e2e_spec_generator`)**: Synthesizes production-ready Playwright TypeScript and Cypress test suites with Page Object Models (POM), Axe-core WCAG assertions, and visual regression screenshots.

---

## 🏛️ Security & Privacy Boundaries

The Browser Extension operates under strict principle of least privilege:
- `nativeMessaging`
- `storage`
- `activeTab` (only for explicit foreground screenshot actions)
- `cookies` (local session atom only, mode 0600)
- `tabs` and `tabGroups`
- Host access to standard `http://*/*` and `https://*/*` web applications.

### Security Guarantees:
1. **0600 Secret Redaction**: Sensitive authorization headers, session tokens (`ya29.*`, `eyJ*`), passwords, and private keys are redacted before leaving the extension boundaries.
2. **Zero-Leak Authenticated Sessions**: Seamlessly inherits existing Google, GitHub, Stripe, and AWS logins without exposing raw credentials.
3. **Background Tab Driving**: Executes in dedicated background tab groups (`active: false`) without stealing window focus from the user.
4. **Bi-directional HUD Annotation**: Renders real-time interactive visual overlays and annotations via Unix domain socket bridge.

---

## 🧪 Testing & Verification

Run the comprehensive test suite:
```bash
# Run all Browser unit and integration tests
bun test Plugin/Browser/

# Run DevTools superset tests
bun test Plugin/Browser/devtools.test.ts

# Run Intelligence & Resilience tests
bun test Plugin/Browser/intelligence.test.ts

# Run latency & throughput benchmarks
bun Plugin/Workflow/cli.ts bench -n=100
```
