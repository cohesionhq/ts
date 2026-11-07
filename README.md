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

### Keeping a pairing

Pair once and keep the `Server`. It's plain JSON, so save it as it is and
read it back on each start. A setup code works only once, and `localServer`
makes a new key each time it's called, which cohesiond lists as a new
client. Either way, set up again only when there's nothing saved.

The file holds the client's private key (or its local key), which is all it
takes to connect as this client, so make it readable only by you:

```ts
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Session, pair, type Server } from 'cohesion-ts';

const path = `${process.env.HOME}/.config/my-client/server.json`;

async function server(setupCode: string): Promise<Server> {
	if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8')) as Server;
	const { server } = await pair(setupCode, "Jackson's MacBook Pro");
	mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
	writeFileSync(path, JSON.stringify(server), { mode: 0o600 });
	chmodSync(path, 0o600); // the mode only applies when the file is created
	return server;
}

const session = await Session.open(await server(setupCode));
```

If the file is lost, pair again with a new setup code from `cohesion pair`.

`Session` is one connection. `Client` keeps one open: it reconnects with a
backoff when the session drops (never after an `evicted` frame), offers the
client's `hello` again, runs `onConnect` for the client to report the sessions
still going on, then sends the actor session updates held while it was away, in
order. An update that may have been stored before its session dropped is
checked against the transcript before it is sent again. `usage` says how
much of its plan's limits an actor has used; the client says each actor's
last usage again on every new session. A session's context window is a
`context` report, and a `title` report renames a session; `startActorSession`
carries the title it was started with, or `null` when Cohesion took the
prompt's first line and a client may name it.

```ts
const client = new Client(server, {
	offers: { actors: [myActor] },
	onCall: async (call) => { /* start, message or stop a session */ return { kind: 'accepted' }; },
	onConnect: async (session) => { /* report each running session's status */ },
});
void client.run();
await client.report(sessionId, { kind: 'message', content: { kind: 'text', text: 'Done.' } });
await client.report(sessionId, { kind: 'context', context: { used_tokens: 41_000, total_tokens: 200_000 } });
await client.usage(myActor.identifier, { plan: [{ label: '5-hour limit', used: 0.72 }] });
```

## Types

`src/generated.ts` is cohesion-core's `TsWire` output, the same file the web
UI uses: every request, reply and model. `bun run generate` rewrites it from
a cohesion checkout (`../cohesion`, or `$COHESION`). The session's own frames
(`hello` offers, calls, actor session updates, actor usage) aren't generated, so
`src/frames.ts` writes them out from `cohesion-core/src/protocol/envelope.rs`
and `capabilities.rs`; keep it in step with them.

## Checks

```sh
bun install
bun run check
```

CI (`.github/workflows/check.yml`) runs the same on every push to `master`.

## Licence

Copyright © 2026 Jackson Zamorano.

Licensed under the MIT License. See [LICENSE](LICENSE).
