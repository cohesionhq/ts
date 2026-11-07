# CLAUDE.md

`cohesion-ts`: a TypeScript client library for `cohesiond`, run with Bun.
Read `README.md` first. The protocol it speaks is cohesion's: see
`docs/architecture.md` ("Clients and identity", "Transport") and
`docs/actors.md` in the cohesion repo (`../cohesion`).

- `src/generated.ts` is generated: never edit it; `bun run generate`.
- `src/frames.ts` mirrors cohesion-core's frames by hand; change it only to
  follow them, and say which Rust type it follows.
- Wire fields are snake_case, enum values camelCase, as the daemon sends them.
  Don't rename them into TypeScript style.
- No runtime dependencies. TLS and the WebSocket upgrade are hand-rolled so
  cohesiond's certificate is checked against the paired key fingerprint
  before anything is sent; never fall back to unchecked TLS.
- There are no tests. `bun run check`, which CI runs, must pass before a
  change is done.
