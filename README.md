# cohesion-ts

A TypeScript client for `cohesiond`, for Bun. It reaches the daemon the two
ways any client does:

- **On the same machine**, over its Unix socket, identified by a local key.
- **From another device**, over the `/connect` WebSocket with mutual TLS,
  identified by a certificate paired with a setup code.

On either, it runs the daemon's requests with their generated types, hears
invalidations, and offers what the client serves, such as actors (see
`docs/actors.md` in cohesion).

```ts
import { Session, localServer, pair } from 'cohesion-ts';

// Once: set up, and keep `server` with the client's configuration.
const server = localServer('/tmp/cohesion.sock', "Jackson's MacBook Pro");
// or: const { server } = await pair(setupCode, "Jackson's MacBook Pro");

const session = await Session.open(server);
const workspaces = await session.request('listWorkspaces');
```

`Session` is one connection. `Client` keeps one open: it reconnects with a
backoff when the session drops (never after an `evicted` frame), offers the
client's `hello` again, runs `onConnect` for the client to report the tasks
still going on, then sends the actor task updates held while it was away, in
order. An update that may have been stored before its session dropped is
checked against the transcript before it is sent again. `usage` says how
much of its plan's limits an actor has used; the client says each actor's
last usage again on every new session. A task's context window is a
`context` report.

```ts
const client = new Client(server, {
	offers: { intelligence: [], connectors: [], actors: [myActor] },
	onCall: async (call) => { /* start, message or stop a task */ return { kind: 'accepted' }; },
	onConnect: async (session) => { /* report each running task's status */ },
});
void client.run();
await client.report(taskId, { kind: 'message', content: { kind: 'text', text: 'Done.' } });
await client.report(taskId, { kind: 'context', context: { used_tokens: 41_000, total_tokens: 200_000 } });
await client.usage(myActor.identifier, { plan: [{ label: '5-hour limit', used: 0.72 }] });
```

## Types

`src/generated.ts` is cohesion-core's `TsWire` output, the same file the web
UI uses: every request, reply and model. `bun run generate` rewrites it from
a cohesion checkout (`../cohesion`, or `$COHESION`). The session's own frames
(`hello` offers, calls, actor task updates, actor usage) aren't generated, so
`src/frames.ts` writes them out from `cohesion-core/src/protocol/envelope.rs`
and `capabilities.rs`; keep it in step with them.

## Checks

```sh
bun install
bun run check
bun test
```
