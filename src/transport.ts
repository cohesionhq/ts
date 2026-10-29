// The two ways to reach cohesiond, each carrying one JSON frame at a time:
// its Unix socket, one frame per line after the socket's handshake, and its
// `/connect` WebSocket over mutual TLS, one frame per message.

import { connect as connectUnix } from 'node:net';
import { connect as connectTls, type TLSSocket } from 'node:tls';

import { keyFingerprint } from './identity.ts';
import { Inbox } from './inbox.ts';
import { authority, type Server } from './server.ts';
import { WebSocketStream } from './websocket.ts';

/** An open connection to cohesiond, carrying frames as JSON text. */
export interface Transport {
	send(text: string): void;
	close(): void;
	/**
	 * Hands each message to `onmessage`, starting with any that arrived
	 * before, and calls `onclose` once when the connection ends.
	 */
	listen(onmessage: (text: string) => void, onclose: () => void): void;
}

/** Opens a connection to `server`, identified as its configuration says. */
export function connectTransport(server: Server): Promise<Transport> {
	return server.kind === 'local' ? connectLocal(server) : connectRemote(server);
}

/**
 * Opens a TLS connection presenting the client's certificate, and settles
 * once cohesiond's certificate carries the key its setup code named. There
 * is no CA: cohesiond signs a new certificate with its key on every start.
 */
export function openTls(server: Extract<Server, { kind: 'remote' }>): Promise<TLSSocket> {
	return new Promise((resolve, reject) => {
		const socket = connectTls({
			host: server.host,
			port: server.port,
			cert: server.identity.certificate,
			key: server.identity.privateKey,
			// Checked below, against the fingerprint, before anything is sent.
			rejectUnauthorized: false,
			ALPNProtocols: ['http/1.1'],
			servername: /^[\d.]+$|:/.test(server.host) ? undefined : server.host,
		});
		socket.once('error', reject);
		socket.once('secureConnect', () => {
			socket.off('error', reject);
			const certificate = socket.getPeerCertificate(true);
			if (!certificate.raw || keyFingerprint(certificate.raw) !== server.server_fingerprint) {
				socket.destroy();
				return reject(new Error(`The server at ${authority(server)} isn't the cohesiond this client paired with.`));
			}
			resolve(socket);
		});
	});
}

async function connectRemote(server: Extract<Server, { kind: 'remote' }>): Promise<Transport> {
	const socket = await openTls(server);
	return WebSocketStream.upgrade(socket, authority(server), '/connect');
}

/** Connects to the socket and identifies the client with its local key. */
function connectLocal(server: Extract<Server, { kind: 'local' }>): Promise<Transport> {
	return new Promise((resolve, reject) => {
		const socket = connectUnix(server.socket);
		const inbox = new Inbox();
		let buffer = '';
		let accepted = false;
		socket.setEncoding('utf8');
		socket.once('error', reject);
		socket.once('connect', () => socket.write(JSON.stringify(server.identity) + '\n'));
		socket.on('data', (chunk: string) => {
			buffer += chunk;
			for (let end = buffer.indexOf('\n'); end !== -1; end = buffer.indexOf('\n')) {
				const line = buffer.slice(0, end);
				buffer = buffer.slice(end + 1);
				if (accepted) {
					inbox.message(line);
					continue;
				}
				// The handshake's one line, before the session.
				const reply = JSON.parse(line) as { outcome: 'accepted' } | { outcome: 'refused'; reason: string };
				if (reply.outcome === 'refused') {
					socket.destroy();
					return reject(new Error(reply.reason));
				}
				accepted = true;
				socket.off('error', reject);
				socket.on('error', () => socket.destroy());
				socket.on('close', () => inbox.close());
				resolve({
					send: (text) => void socket.write(text + '\n'),
					close: () => void socket.end(),
					listen: (onmessage, onclose) => inbox.listen(onmessage, onclose),
				});
			}
		});
	});
}
