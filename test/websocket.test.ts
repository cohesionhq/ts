import { expect, test } from 'bun:test';
import { connect } from 'node:net';

import { WebSocketStream } from '../src/websocket.ts';

test('text messages of every length frame round trip, and a close ends the stream', async () => {
	const server = Bun.serve({
		port: 0,
		fetch: (request, server) => (server.upgrade(request) ? undefined : new Response(null, { status: 400 })),
		websocket: {
			message(socket, message) {
				if (message === 'bye') socket.close();
				else socket.send(`echo ${message}`);
			},
		},
	});
	const port = server.port!;
	const stream = connect(port, '127.0.0.1');
	await new Promise((resolve) => stream.once('connect', resolve));
	const socket = await WebSocketStream.upgrade(stream, `127.0.0.1:${port}`, '/');
	const heard: string[] = [];
	const closed = new Promise<void>((resolve) => socket.listen((text) => heard.push(text), resolve));

	const sizes = [0, 125, 126, 65_535, 65_536, 300_000];
	for (const size of sizes) socket.send('x'.repeat(size));
	socket.send('bye');
	await closed;
	expect(heard.map((text) => text.length)).toEqual(sizes.map((size) => size + 5));
	server.stop(true);
});
