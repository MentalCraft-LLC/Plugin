# message

Unified outbound message capability (holar.message.v1) with a channel priority:
**telegram > imessage > email**. Poll returns inbound replies; a host adapter
may also emit events.

## Surface

Every harness consumes `operation.ts` through the MCP server (`serve.mjs`).
A `pi.ts` file is an optional host adapter.

- `message` — send a bounded message through the first configured channel
  (priority telegram → imessage → email); never includes Secrets.
- `bootstrap` on MCP returns `bootstrap_local_only`; a host adapter may collect
  credentials through a local dialog.
- Channel adapters live in `channels/` (telegram, imessage, email).

## Channels

| channel | adapter | config |
|---|---|---|
| telegram | `channels/telegram.ts` (Bot API) | `TELEGRAM_CONFIG_PATH` or `~/.pi/agent/telegram/config.json` (0600) |
| imessage | `../imessage/index.ts` | `~/.pi/agent/imessage/config.json` (0600) |
| email | gmail SMTP path | `~/.pi/agent/gmail/...` (0600) |

## Invariants

- Fails closed when no channel is configured.
- Credential values live only in local 0600 configs; they never enter tool
  parameters, chat, logs or evidence.
- Telegram send/poll use the official Bot API with a testable injected
  fetcher; the update cursor advances only after a successful poll.
