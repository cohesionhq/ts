// A WebSocket client over a stream that is already open, enough for
// cohesiond's `/connect`: text messages, ping, close. Bun's own WebSocket
// opens its own TLS connection, and that connection can't check cohesiond's
// certificate against the setup code's key fingerprint before the upgrade,
// so the upgrade runs here over a socket `remote.ts` has checked.

import { createHash, randomBytes } from 'node:crypto';
import type { Duplex } from 'node:stream';

import { Inbox } from './inbox.ts';
import type { Transport } from './transport.ts';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const TEXT = 0x1;
const CLOSE = 0x8;
const PING = 0x9;
const PONG = 0xa;

/** One open WebSocket: send text, hear text, close. */
export class WebSocketStream implements Transport {
	private readonly inbox = new Inbox();
	private buffer: Buffer = Buffer.alloc(0);
	private fragments: Buffer[] = [];
	private closed = false;

	private constructor(private readonly stream: Duplex) {
		stream.on('data', (chunk: Buffer) => this.read(chunk));
		stream.on('close', () => this.ended());
		stream.on('error', () => this.ended());
	}

	/** Upgrades `stream` with a GET of `path` on `host`. */
	static upgrade(stream: Duplex, host: string, path: string): Promise<WebSocketStream> {
		const key = randomBytes(16).toString('base64');
		const accept = createHash('sha1').update(key + GUID).digest('base64');
		return new Promise((resolve, reject) => {
			let head = Buffer.alloc(0);
			const fail = (error: Error) => {
				stream.off('data', onData);
				stream.destroy();
				reject(error);
			};
			const onData = (chunk: Buffer) => {
				head = Buffer.concat([head, chunk]);
				const end = head.indexOf('\r\n\r\n');
				if (end === -1) {
					if (head.length > 16 * 1024) fail(new Error('The upgrade response is too long.'));
					return;
				}
				stream.off('data', onData);
				stream.off('error', fail);
				const [status = '', ...headers] = head.subarray(0, end).toString('latin1').split('\r\n');
				const accepted = headers.some(
					(line) => /^sec-websocket-accept:/i.test(line) && line.split(':')[1]?.trim() === accept,
				);
				if (!/^HTTP\/1\.1 101\b/.test(status) || !accepted) {
					return fail(new Error(`cohesiond refused the WebSocket upgrade: ${status}`));
				}
				const socket = new WebSocketStream(stream);
				resolve(socket);
				const rest = head.subarray(end + 4);
				if (rest.length > 0) socket.read(rest);
			};
			stream.on('data', onData);
			stream.once('error', fail);
			stream.write(
				`GET ${path} HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
					`Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
			);
		});
	}

	listen(onmessage: (text: string) => void, onclose: () => void): void {
		this.inbox.listen(onmessage, onclose);
	}

	send(text: string): void {
		this.write(TEXT, Buffer.from(text, 'utf8'));
	}

	close(): void {
		if (this.closed) return;
		this.write(CLOSE, Buffer.from([0x03, 0xe8]));
		this.stream.end();
	}

	private write(opcode: number, payload: Buffer): void {
		if (this.closed) return;
		const length = payload.length;
		const header =
			length < 126
				? Buffer.from([0x80 | opcode, 0x80 | length])
				: length < 0x10000
					? Buffer.from([0x80 | opcode, 0x80 | 126, length >> 8, length & 0xff])
					: Buffer.concat([Buffer.from([0x80 | opcode, 0x80 | 127]), u64(length)]);
		// Every frame a client sends is masked.
		const mask = randomBytes(4);
		const masked = Buffer.alloc(length);
		for (let i = 0; i < length; i++) masked[i] = payload[i]! ^ mask[i & 3]!;
		this.stream.write(Buffer.concat([header, mask, masked]));
	}

	private read(chunk: Buffer): void {
		this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
		for (;;) {
			const frame = parseFrame(this.buffer);
			if (!frame) return;
			this.buffer = this.buffer.subarray(frame.size);
			this.handle(frame.fin, frame.opcode, frame.payload);
		}
	}

	private handle(fin: boolean, opcode: number, payload: Buffer): void {
		switch (opcode) {
			case PING:
				return this.write(PONG, payload);
			case PONG:
				return;
			case CLOSE:
				this.write(CLOSE, payload.subarray(0, 2));
				this.stream.end();
				return this.ended();
		}
		// A text frame, or a continuation of one.
		this.fragments.push(payload);
		if (!fin) return;
		const text = Buffer.concat(this.fragments).toString('utf8');
		this.fragments = [];
		this.inbox.message(text);
	}

	private ended(): void {
		if (this.closed) return;
		this.closed = true;
		this.inbox.close();
	}
}

function parseFrame(
	buffer: Buffer,
): { fin: boolean; opcode: number; payload: Buffer; size: number } | null {
	if (buffer.length < 2) return null;
	const fin = (buffer[0]! & 0x80) !== 0;
	const opcode = buffer[0]! & 0x0f;
	const masked = (buffer[1]! & 0x80) !== 0;
	let length = buffer[1]! & 0x7f;
	let at = 2;
	if (length === 126) {
		if (buffer.length < 4) return null;
		length = buffer.readUInt16BE(2);
		at = 4;
	} else if (length === 127) {
		if (buffer.length < 10) return null;
		length = Number(buffer.readBigUInt64BE(2));
		at = 10;
	}
	const mask = masked ? buffer.subarray(at, at + 4) : null;
	if (mask) at += 4;
	if (buffer.length < at + length) return null;
	const payload = Buffer.from(buffer.subarray(at, at + length));
	if (mask) for (let i = 0; i < length; i++) payload[i]! ^= mask[i & 3]!;
	return { fin, opcode, payload, size: at + length };
}

function u64(n: number): Buffer {
	const out = Buffer.alloc(8);
	out.writeBigUInt64BE(BigInt(n));
	return out;
}
