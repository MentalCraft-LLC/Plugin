# Chrome Context

## Decision

Use one Owner-installed Manifest V3 Chrome Extension plus a user-only Native
Messaging bridge. This is the only bounded design that simultaneously reuses the
Owner's existing Chrome login state, runs in inactive tabs, avoids popup UI and
handles Cookie/session material only through a local bounded session atom.

Chrome intentionally prohibits silent Extension installation. The Owner must
load the unpacked Extension once in the intended Chrome profile. Login expiry,
account selection, MFA, CAPTCHA and consent are automatable on the Owner's
profile (Owner directive 2026-08-12); financial actions remain the only
obstruction.

## Name

`chrome` is the capability name: it describes a bounded,
privacy-preserving chrome context rather than an implementation detail.
Background tabs remain an implementation boundary, not a separate capability.
Every harness consumes `operation.ts` through the MCP server (`serve.mjs`).
A `pi.ts` file is an optional host adapter.

## Operation

`operation.ts` is the single executable browser atom. MCP and host adapters
register the public ABI and delegate to that atom; Owner workflows may reuse
the same operation directly rather than attempting unsupported Tool-to-Tool
calls or duplicating browser guards.

## Boundary

The Chrome Extension has only these permissions:

- `nativeMessaging`
- `storage`
- `activeTab` (only for an explicit foreground screenshot action)
- `cookies` (local session atom only)
- `tabs`
- `tabGroups`
- host access to all normal `http://*/*` and `https://*/*` pages

## Boundary (Owner revision 2026-08-03)

The Owner removed the earlier conservative page-boundary limits: any action
that **spends no money and harms no person, data or system** may proceed
without re-asking. Page text is readable through the `read_text` atom; the
extension still redacts identity and secret patterns, never exposes password
input values, and keeps the platform scope (no `chrome://`, extension-internal,
`file://` or local security surfaces). Financial actions still stop for Owner
confirmation; MFA, CAPTCHA, consent, terms and account-selection surfaces are
automatable (no per-step confirmation — Owner directive 2026-08-12).

The extension has no popup, password, history, clipboard-read or
download permission. Debugger attach is a last-resort screenshot path for
inactive tabs in the focused window; click, hover, scroll and key never
attach. It never opens a remote-debugging port, reads
chrome-internal pages, or copies a Chrome profile. Existing ChatGPT or other
Extensions are not inspected, hijacked or used through undocumented protocols.
The manifest `key` is a public Chrome extension identity key, not a credential;
its stable public bytes let the bridge verify the expected extension id.

Every tab created by the bridge uses `active: false` and joins a group whose
title is the current Session name. Conflict control is group membership:
the runtime never navigates, activates, captures or closes a tab outside that
group. A managed tab the Owner is already viewing is in-bounds. The group
stays collapsed only while a tab outside the group is active in the same
window, so expanding or switching inside the group cannot displace a foreign
page. The local session id separates concurrent groups; renaming the same
Session updates its group title. When a Session has no name, the bounded fallback is
a unique `holar-<id8>` (never a shared name, so concurrent Sessions never
merge into one visible group). Window focus is reserved for the explicit
trusted-click lease that restores the prior tab.

## Protocol

Chrome launches `host.mjs` through its official Native Messaging mechanism. The
host exposes one mode-`0600` Unix socket to the same local user. Harness requests must
present a random mode-`0600` pairing token. The token never enters Tool input,
output, Session state, source, logs or evidence.

The protocol accepts only:

| Action | Atom |
|---|---|
| `status` | bridge and inactive-tab boundary readback |
| `repair` | idempotent host reinstall, keep the Session tab-group, reload managed tabs in place and self-only runtime reload |
| `open` | normal HTTP/HTTPS navigation in a managed inactive tab |
| `controls` | sanitized semantic controls; human challenges return a resumable boundary receipt |
| `read_text` | extract page text; auto-sweeps virtualized threads unless `long=false`; `long=true` forces a full sweep of the conversation scroller and returns `turns` when user/model messages are present |
| `read_markdown` | extract structured GitHub Flavored Markdown (headings, links, tables, code blocks) |
| `read_styles` | extract root computed styles and CSS custom properties |
| `inspect_element` | deep element geometry, computed styles, ARIA attributes, hierarchy path, and interactive state inspection |
| `read_storage` | inspect `localStorage` and `sessionStorage` key-value pairs |
| `clear_storage` | clear all `localStorage` and `sessionStorage` entries |
| `read_cookies` | read sanitized site cookies via `chrome.cookies` API |
| `clear_cookies` | clear site cookies via `chrome.cookies` API |
| `performance_metrics` | read navigation timings, TTFB, DOM complete, and JS heap memory |
| `wait_for` | poll for DOM selector existence/visibility/hidden, text match, network idle, or JavaScript predicate |
| `evaluate_script` | execute asynchronous/synchronous JavaScript expressions with full Promise unwrapping in page context |
| `reload_page` | reload managed tab with optional cache bypass |
| `click` | click semantic role/name or universal CSS/XPath selector with visual feedback indicator |
| `hover` | dispatch mouse hover to selector or coordinates with visual feedback |
| `scroll` | dispatch instant viewport scroll |
| `press_key` | dispatch keyboard event with modifier flags |
| `fill_public` | fill single non-identity public value targeted by field or CSS selector |
| `fill_form` | atomic batch form filling across multiple fields |
| `fill_local` | direct private local-value projection without model exposure |
| `press_enter` | exact Enter event on semantic textbox or CSS selector |
| `select_combobox` | select value from searchable combobox dropdown or CSS selector |
| `terms_diagnostics` | bounded Provider terms classification with sanitized actionable labels |
| `accept_standard_terms` | one exact ordinary no-cost Provider terms control |
| `accept_owner_authorized_terms` | one uniquely identified combined terms checkbox after Owner confirmation |
| `open_clarity_project` | open one exact public Clarity project card |
| `clarity_project_identity` | read Clarity name/domain/ID identity receipt |
| `capture_ga4_measurement_id` | one-way capture of verified GA4 measurement ID into private local config |
| `capture_clarity_project_id` | one-way capture of verified Clarity project ID into private local config |
| `capture_clarity_token` | one-way Clarity API token write to declared local file |
| `capture_session` | read site cookies into native-process vault |
| `capture_screenshot` | capture local image receipt of managed tab; supports `selector` for element-level clipped capture, `long=true` for full scroller capture |
| `capture_pdf` | export vector PDF document via CDP `Page.printToPDF` |
| `emulate` | emulate mobile/tablet screen dimensions, DPR, and `prefers-color-scheme: dark | light` |
| `semantic_snapshot` | traverse Shadow DOM and capture accessible interactive controls and structured element selectors |
| `annotate` | Cursor design mode: Option+click selects; on-page Send injects the Owner note and selected UI elements as an Owner user message into the watching agent session and exits design mode |
| `close_group` | close all managed tabs in current session group |

There is no arbitrary selector, model-supplied JavaScript evaluation, HTML dump,
raw Cookie/session output, download or hidden cross-origin request. Stripe-owned embedded-frame discovery is limited to sanitized read-only `page` diagnostics under `dashboard.stripe.com`; frame IDs and URLs never leave the extension, and no click, fill or submit is sent into an embedded frame. Screenshot capture does not activate a tab in the focused window. A visible
managed tab uses `captureVisibleTab` so Chrome does not show the debugger
infobar. Inactive tabs in a background window are selected there, captured,
and restored. Inactive tabs in the focused window still use CDP
`Page.captureScreenshot` as last resort. Full-page capture still scrolls
only an already-active granted tab,
suppresses repeated pinned overlays after the first tile, fails if the active
target changes, and restores the prior scroll and element visibility in a
`finally` path. It is capped at 24,000 CSS pixels, 32 tiles, 30,000 output
pixels and 700 KB encoded JPEG; a truncation receipt is explicit. Visible
managed tabs and inactive tabs in a background window capture without
debugger attach. The Owner-clicked extension-icon grant remains the full-page
`captureVisibleTab` path. Raw bytes stay
in the mode-0600 local screenshot directory for at most one hour and only a
sanitized receipt leaves the bridge.

## Modules

The Browser v2 surface is split into bounded atoms: `modules/policy.ts` owns normal-web target access and capabilities; `modules/adapters.ts` owns the generic fallback and importable site-adapter registry; `extension/content.js` owns sanitized semantic discovery; `extension/challenge.js` owns resumable human-boundary detection; `extension/foreground-screenshot.js` owns the explicit screenshot grant path; `extension/managed-screenshot.js` owns inactive-tab CDP viewport capture; `workflows.ts` owns Provider/site sequences; `session.mjs` owns the ephemeral Cookie/session vault; `screenshot.mjs` owns local image receipts; `modules/finance.ts` owns the paid-action stop; `host.mjs` owns the native boundary; and `extension/worker.js` owns inactive-tab lifecycle and recovery. Each atom must fail closed independently and must not expand another atom's authority.

## Setup

After `/reload`, run:

```text
/chrome-setup
```

The command installs the private Native Messaging manifest and copies the
unpacked Extension directory to the clipboard. One time only, in the intended
Chrome profile:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Paste the copied directory.

No Extension popup appears. Once loaded, `chrome` operates only in
inactive normal-web tabs grouped under a collapsed blue tab group titled with
the current Session name, and reuses that profile's existing authenticated
sessions. `capture_session` can import the current site's Cookie set into the
short-lived native-memory vault without exposing its values. Clicking the action
button is the only explicit foreground screenshot grant; it records only the
active tab's origin and path for 120 seconds.

## Scripts

Stable Provider sequences live under `scripts/` rather than being rebuilt from
ad hoc Tool calls:

```bash
bun Plugin/Chrome/scripts/repair.mjs
bun Plugin/Chrome/scripts/bootstrap-ga4.mjs Application/Assessment/<Product> [--accept-standard-terms] [--accept-owner-authorized-terms] [--objective=<allowlisted-label>]
bun Plugin/Chrome/scripts/bootstrap-clarity.mjs Application/Assessment/<Product> [--accept-standard-terms]
bun Plugin/Chrome/scripts/bootstrap-clarity-id.mjs Application/Assessment/<Product>
bun Plugin/Chrome/scripts/bootstrap-clarity-token.mjs Application/Assessment/<Product>
```

The GA4 workflow disables recognized optional account-data sharing and stops at
the next unmodeled phase. Under the delegated full-lifecycle Goal, it may accept
one exact ordinary no-cost Provider terms control on the exact GA4 provisioning
surface. A separately explicit `--accept-owner-authorized-terms` path exists for
one uniquely identified combined data-processing/service-terms checkbox after
Owner confirmation; it never accepts privacy, billing, or ambiguous/multiple
controls. Clarity uses the same provider-specific exact-control rule.
Product-owned wrappers belong in each leaf `.agent/scripts/` directory and supply
only that Product's route; they reuse these generic runners rather than adding
Extension logic.
Clarity project and token workflows are idempotent by the declared public target and require official name/domain/project-ID readback before a project is considered ready. The separate project-ID runner captures only the verified ID into private local analytics config; it never returns the ID. The one-time token value travels directly from the official modal into the declared private file; no script output includes it. All workflows stop when login, controls or form shape are not exact. Shared logic is unit-tested in `workflows.test.ts`.

## Recovery

The bridge reconnects its Native Messaging host, removes stale sockets, retries
content-script startup, recreates closed managed tabs, restores their dedicated
tab group and preserves the current active tab. `chrome repair` also
reinstalls the local host manifest, keeps every still-open managed tab in the
Session group (reload in place, never close inactive members) and queues
`chrome.runtime.reload()` for this Extension only, so later source fixes do not
need Chrome UI. Separate Sessions retain separate tab and group ids; no
unscoped legacy tab state is adopted.

Chrome still prevents software from silently enabling or reinstalling a removed
or disabled Extension. An expired login, account choice, consent, MFA or CAPTCHA
also remains human-only. The runtime returns a sanitized resumable human-boundary
receipt, preserves the managed tab, and executes no downstream action until the
boundary is gone. Those boundaries fail closed rather than weakening the profile
or exposing its Cookie/session values.

## macOS trusted-click permission matrix (Hackintosh notes)

The trusted OS click path (`click` + `foregroundConfirmed=true`) needs three
separate macOS TCC grants; all three are required, and a missing one surfaces
as `osascript is not allowed assistive access (-25211)`:

1. **Accessibility** (系统设置 → 隐私与安全 → 辅助功能): grant the host app
   that launches pi (Zed/Terminal) — needed for `System Events` reads.
2. **Automation / AppleEvents** (系统设置 → 隐私与安全 → 自动化): grant
   "control Google Chrome" to the host app — needed for `click at` landing on
   a Chrome window.
3. **Process freshness**: TCC re-evaluates per process; grants made while pi
   is already running are not picked up until the pi process restarts
   (reload_runtime reloads extensions but does not replace the process).

On Hackintosh, TCC entries are unreliable to query (`kTCCServiceAccessibility`
may read as empty even when granted); verify by behavior: run
`osascript -e 'tell application "System Events" to click at {100,100}'` from a
node child — status 0 means the grant chain works.
