# secret

Shared atomic 0600 secret-file writer (`write.ts`, a library, not a tool
plugin). Every tool that persists local credentials (contact, github,
gmail, wechat, google-*, analytics, imessage, stripe, cloudflare) imports
`atomicWriteSecret` here instead of re-implementing the temp-file + chmod +
rename dance.

## API

```ts
atomicWriteSecret(path: string, content: string): void
```

- Creates parent directories (0700), writes a unique temp file with
  `mode: 0o600, flag: "wx"`, chmods it, atomically renames into place and
  chmods the final path.
- Never overwrites an existing file mid-write (rename is atomic).
- On failure the temp file is removed; the error propagates to the caller.
- Values never enter tool parameters, chat, logs or evidence.

## Convention

Directory uses a dash name (`secret`) per the naming rule for folders;
the module file is `write.ts` (not `index.ts`) so the structure gate does not
mistake it for a registered extension.
