import { expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client, localServer, type ClientFrame } from '../index.ts';

/**
 * A daemon on a Unix socket that accepts any local key and answers every
 * frame, keeping what it heard; `drop` ends the next session as an update
 * arrives, unanswered but stored, as a daemon restart can.
 */
function fakeDaemon() {
	const path = join(mkdtempSync(join(tmpdir(), 'cohesion-')), 'd.sock');
	const heard: ClientFrame[] = [];
	const transcript: { content: unknown }[] = [];
	const state = { drop: false, sessions: 0 };
	Bun.listen<{ buffer: string; identified: boolean }>({
		unix: path,
		socket: {
			open(socket) {
				socket.data = { buffer: '', identified: false };
			},
			data(socket, chunk) {
				socket.data.buffer += chunk.toString();
				const reply = (frame: object) => socket.write(JSON.stringify({ seq: 0, ...frame }) + '\n');
				for (let end; (end = socket.data.buffer.indexOf('\n')) !== -1; ) {
					const line = socket.data.buffer.slice(0, end);
					socket.data.buffer = socket.data.buffer.slice(end + 1);
					if (!socket.data.identified) {
						socket.data.identified = true;
						state.sessions++;
						socket.write('{"outcome":"accepted"}\n');
						reply({ type: 'hello', protocol: 1, server: 'test', client_name: 'test', web_bundle_hash: null, vocabulary: {} });
						continue;
					}
					const frame = JSON.parse(line) as ClientFrame & { id: number };
					heard.push(frame);
					if (frame.type === 'actorTaskUpdate' && frame.kind === 'message') {
						transcript.push({ content: { sender: 'actor', ...frame.content } });
						if (state.drop) {
							state.drop = false;
							return void socket.end();
						}
					}
					const data =
						frame.type === 'listActorTaskMessages'
							? { type: 'actorTaskMessages', data: transcript }
							: frame.type === 'actorTaskUpdate' && frame.kind === 'message'
								? { type: 'actorTaskMessage', data: { id: transcript.length } }
								: { type: 'accepted', data: null };
					reply({ type: 'reply', id: frame.id, ok: data });
				}
			},
		},
	});
	return { path, heard, state };
}

const offers = { intelligence: [], connectors: [], actors: [] };
const text = (text: string) => ({ kind: 'message', content: { kind: 'text', text } }) as const;
const updates = (heard: ClientFrame[]) =>
	heard.filter((frame) => frame.type === 'actorTaskUpdate').map((frame) => ('content' in frame ? frame.content : frame.kind));

test('updates made while offline are sent after onConnect, in order', async () => {
	const daemon = fakeDaemon();
	const client = new Client(localServer(daemon.path, 'test'), {
		offers,
		onCall: async () => ({ kind: 'accepted' }),
		onConnect: (session) => session.report(1, { kind: 'status', status: 'working' }),
	});
	const first = client.report(1, text('one'));
	const second = client.report(1, { kind: 'progress', progress: 'Reading' });
	void client.run();
	expect((await first).id).toBe(1);
	await second;
	expect(daemon.heard.map((frame) => frame.type)).toEqual(['hello', 'actorTaskUpdate', 'actorTaskUpdate', 'actorTaskUpdate']);
	expect(updates(daemon.heard)).toEqual(['status', { kind: 'text', text: 'one' }, 'progress']);
	client.stop();
});

test('a message stored before its session dropped is not sent twice', async () => {
	const daemon = fakeDaemon();
	const client = new Client(localServer(daemon.path, 'test'), { offers, onCall: async () => ({ kind: 'accepted' }) });
	void client.run();
	await client.report(1, text('before'));
	daemon.state.drop = true;
	const dropped = client.report(1, text('dropped'));
	const after = client.report(1, text('after'));
	await dropped;
	await after;
	expect(daemon.state.sessions).toBe(2);
	expect(updates(daemon.heard)).toEqual([
		{ kind: 'text', text: 'before' },
		{ kind: 'text', text: 'dropped' },
		{ kind: 'text', text: 'after' },
	]);
	client.stop();
});
