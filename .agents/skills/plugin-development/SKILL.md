---
name: plugin-development
description: "Core standards and development patterns for MentalCraft Plugin ecosystem: Native messaging hosts, Chrome MV3 extensions, multi-channel messaging engines (Telegram/iMessage/Gmail), and atomic secure storage."
---

# Plugin Development Skill

## Contract & Protocols

1. **Chrome MV3 Native Messaging**:
   - Standard 4-byte native messaging wire protocol.
   - All wire actions must strictly adhere to `snake_case`.
   - Never expose plaintext secrets or authorization tokens over native messaging logs.

2. **Multi-Channel Dispatch Priority**:
   - Message routing priority: Telegram -> iMessage -> Email.
   - All inbound webhooks must verify secret tokens before payload parsing.
   - Messages must enforce idempotent processing via UUID deduplication.

3. **Atomic 0600 Secure Writes**:
   - Write secrets to temporary PID-tagged files before atomic rename (`renameSync`).
   - Explicit `chmodSync(0o600)` on private keys and credentials.
