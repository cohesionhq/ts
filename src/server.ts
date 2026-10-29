// Where a client reaches cohesiond, and how it proves who it is: the
// configuration a client keeps once it is set up, and the two ways to set
// one up (pairing with a setup code, or a local key on this machine).

import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { generateIdentity, type ClientIdentity } from './identity.ts';
import { CohesionError } from './errors.ts';
import type { Client as ListedClient } from './generated.ts';
import { openTls } from './transport.ts';

/** The HTTPS port cohesiond listens on unless told otherwise. */
export const DEFAULT_PORT = 3000;

/** The first line a client sends on the Unix socket. */
export interface LocalIdentity {
	/** A random key, kept with the client's configuration: the same key is the same client. */
	key: string;
	/** The name a client new to the daemon is listed under. */
	name: string;
}

/** A cohesiond, and how this client identifies itself to it. */
export type Server =
	| {
			kind: 'local';
			/** cohesiond's Unix socket. */
			socket: string;
			identity: LocalIdentity;
	  }
	| {
			kind: 'remote';
			/** An IP address or DNS name. */
			host: string;
			port: number;
			/** The SHA-256 of cohesiond's public key, from the setup code. */
			server_fingerprint: string;
			identity: ClientIdentity;
	  };

/** What a setup code carries: `base64("key|address|fingerprint")`. */
export interface SetupCode {
	/** The one-time secret `/register` expects. */
	key: string;
	host: string;
	port: number;
	fingerprint: string;
}

export function decodeSetupCode(code: string): SetupCode {
	const parts = Buffer.from(code.trim(), 'base64').toString('utf8').split('|');
	const [key, address, fingerprint] = parts;
	if (parts.length !== 3 || !key || !address || !fingerprint) {
		throw new Error("That isn't a setup code.");
	}
	return { key, ...parseAddress(address), fingerprint };
}

/** `host`, `host:port` or `[v6]:port`; a bare IPv6 address has several colons and no port. */
function parseAddress(address: string): { host: string; port: number } {
	const bracketed = /^\[(.+)\]:(\d+)$/.exec(address);
	if (bracketed) return { host: bracketed[1]!, port: Number(bracketed[2]) };
	const colon = address.lastIndexOf(':');
	if (colon !== -1 && !address.slice(0, colon).includes(':')) {
		return { host: address.slice(0, colon), port: Number(address.slice(colon + 1)) };
	}
	return { host: address, port: DEFAULT_PORT };
}

/**
 * Pairs with the cohesiond a setup code names: makes this client a key and
 * certificate, and registers it under `name`. The code works once.
 */
export async function pair(setupCode: string, name: string): Promise<{ server: Server; client: ListedClient }> {
	const code = decodeSetupCode(setupCode);
	const identity = await generateIdentity(name);
	const server: Server = {
		kind: 'remote',
		host: code.host,
		port: code.port,
		server_fingerprint: code.fingerprint,
		identity,
	};
	const body = JSON.stringify({ setup_key: code.key, client_name: name });
	const response = await post(server, '/register', body);
	if (response.status === 401) {
		throw new Error('cohesiond refused the setup code; run `cohesion pair` on the server for a new one.');
	}
	const frame = JSON.parse(response.body) as
		| { ok: { type: 'client'; data: ListedClient } }
		| { error: ConstructorParameters<typeof CohesionError>[0] };
	if ('error' in frame) throw new CohesionError(frame.error);
	return { server, client: frame.ok.data };
}

/** A new local key for the cohesiond on `socket`, listed as `name` when it first connects. */
export function localServer(socket: string, name: string): Server {
	return { kind: 'local', socket, identity: { key: randomBytes(32).toString('hex'), name } };
}

/**
 * Where a cohesiond started without `--socket` listens: its config
 * directory on macOS and Windows, the runtime directory on Linux.
 */
export function defaultSocketPath(): string {
	switch (process.platform) {
		case 'darwin':
			return join(homedir(), 'Library', 'Application Support', 'cohesiond', 'cohesiond.sock');
		case 'win32':
			return join(process.env.LOCALAPPDATA ?? homedir(), 'cohesiond', 'cohesiond.sock');
		default:
			return join(process.env.XDG_RUNTIME_DIR ?? join(homedir(), '.config', 'cohesiond'), 'cohesiond.sock');
	}
}

/** `host:port` as a URL names it. */
export function authority(server: { host: string; port: number }): string {
	return server.host.includes(':') ? `[${server.host}]:${server.port}` : `${server.host}:${server.port}`;
}

/** One HTTP/1.1 POST over a checked TLS connection. */
async function post(
	server: Extract<Server, { kind: 'remote' }>,
	path: string,
	body: string,
): Promise<{ status: number; body: string }> {
	const socket = await openTls(server);
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		socket.on('data', (chunk: Buffer) => chunks.push(chunk));
		socket.on('error', reject);
		socket.on('end', () => {
			const response = Buffer.concat(chunks).toString('utf8');
			const end = response.indexOf('\r\n\r\n');
			const status = Number(/^HTTP\/1\.1 (\d{3})/.exec(response)?.[1] ?? 0);
			if (end === -1 || status === 0) return reject(new Error('cohesiond sent a malformed response.'));
			resolve({ status, body: response.slice(end + 4) });
		});
		socket.write(
			`POST ${path} HTTP/1.1\r\nHost: ${authority(server)}\r\nContent-Type: application/json\r\n` +
				`Content-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`,
		);
	});
}
