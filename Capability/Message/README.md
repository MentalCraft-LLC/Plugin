# message

Unified outbound message capability (holar.message.v1) with a channel priority:
**telegram > imessage > email**. Poll returns inbound replies; a host adapter
may also emit events.

## Surface

Every harness consumes `operation.ts` through the standard MCP server (`mcp-server.ts`), the Master Gateway (`gateway.ts`), or direct TypeScript SDK import.

- `message` — send a bounded message through the first configured channel
  (priority telegram → imessage → email); never includes Secrets.
- `bootstrap` on MCP returns `bootstrap_local_only`; a host adapter may collect
  credentials through a local dialog.
- Channel adapters live in `channels/` (telegram, imessage, email).

## Channels

| channel | adapter | config |
|---|---|---|
| telegram | `channels/telegram.ts` (Bot API) | `TELEGRAM_CONFIG_PATH` or `~/.config/holar/telegram.json` (0600) |
| imessage | `channels/imessage.ts` | `SOCIAL_CONFIG_PATH` or `~/.config/holar/imessage.json` (0600) |
| email | `channels/email.ts` | `GMAIL_CONFIG_PATH` or `~/.config/holar/email.json` (0600) |

## Invariants

- Fails closed when no channel is configured.
- Credential values live only in local 0600 configs; they never enter tool
  parameters, chat, logs or evidence.
- Telegram send/poll use the official Bot API with a testable injected
  fetcher; the update cursor advances only after a successful poll.
