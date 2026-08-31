# Plugin

Private repo: https://github.com/MentalCraft-LLC/Plugin

### Modules
| Directory | Responsibility |
|---|---|
| `Chrome/` | Manifest V3 extension, native messaging host (`host.mjs`), live disassemble bridge, Clarity/GA4 secret capture |
| `Message/` | Multi-channel communication engine (Telegram bot webhook/polling, iMessage AppleEvents, Gmail API) |
| `Gefei/` | SEO intelligence, keyword difficulty, backlink & competitor analytics MCP server |
| `Secret/` | Atomic 0600 secure file write primitives |

### Rules
- Work only under this tree.
- Validate changes locally using `bun test`.
- Do not enable GitHub Actions. Push directly to `main`.
