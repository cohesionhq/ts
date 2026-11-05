// One session with cohesiond: requests and their replies, invalidations,
// and, for a client that offers something, its `hello`, the daemon's calls
// and actor session updates.

import { CohesionError, SessionClosedError } from './errors.ts';
import type {
	ActorSessionReport,
	ArgsOf,
	ClientCall,
	ClientCapabilities,
	ClientFrame,
	ClientResult,
	EvictionReason,
	ReplyOutcome,
	RequestType,
	ServerFrame,
} from './frames.ts';
import type { ActorSessionMessage, ActorUsage, Invalidation, Replies, Vocabulary } from './generated.ts';
import type { Server } from './server.ts';
import { connectTransport, type Transport } from './transport.ts';

/** What cohesiond says first on a session. */
export interface ServerHello {
	protocol: number;
	server: string;
	/** The name this client is listed under. */
	client_name: string;
	web_bundle_hash: string | null;
	vocabulary: Vocabulary;
}

/** How a session ended. */
export interface SessionEnd {
	/** Why the daemon ended it, when it did; a client mustn't reconnect after either. */
	evicted: EvictionReason | null;
}

/** Answers one of the daemon's calls; a thrown error's message is shown to the user. */
export type CallHandler = (call: ClientCall) => Promise<ClientResult>;

type Waiting = { resolve: (outcome: ReplyOutcome) => void; reject: (error: Error) => void };

export class Session {
	/** Answers the daemon's calls; none come before the session's `offer`. */
	onCall: CallHandler = async (call) => {
		throw new Error(`This client can't ${call.kind}.`);
	};
	/** Data changed; only after `subscribe`. */
	onInvalidate: (keys: Invalidation[]) => void = () => {};
	/** Invalidations were dropped: refetch everything. Only after `subscribe`. */
	onReset: () => void = () => {};

	/** Settles once the session has ended, however it ended. */
	readonly closed: Promise<SessionEnd>;

	private nextId = 1;
	private readonly waiting = new Map<number, Waiting>();
	private evicted: EvictionReason | null = null;
	private ended = false;
	private end!: (end: SessionEnd) => void;

	private constructor(
		private readonly transport: Transport,
		readonly hello: ServerHello,
	) {
		this.closed = new Promise((resolve) => (this.end = resolve));
	}

	/** Opens a session with `server`, settling once cohesiond has said hello. */
	static async open(server: Server): Promise<Session> {
		const transport = await connectTransport(server);
		return new Promise((resolve, reject) => {
			let session: Session | null = null;
			transport.listen(
				(text) => {
					const frame = JSON.parse(text) as ServerFrame;
					if (session) return session.receive(frame);
					if (frame.type !== 'hello') {
						transport.close();
						return reject(new Error(`cohesiond opened the session with ${frame.type}, not hello.`));
					}
					const { seq: _, type: __, ...hello } = frame;
					session = new Session(transport, hello);
					resolve(session);
				},
				() => {
					if (session) session.finish();
					else reject(new SessionClosedError());
				},
			);
		});
	}

	/** Runs request `type` and resolves with its reply's data. */
	async request<K extends RequestType>(type: K, ...args: ArgsOf<K>): Promise<Replies[K]> {
		const outcome = await this.exchange((id) => ({ id, type, ...(args.length ? { args: args[0] } : {}) }));
		return outcome as Replies[K];
	}

	/** Asks for invalidations from now until the session ends. */
	async subscribe(): Promise<void> {
		await this.exchange((id) => ({ type: 'subscribe', id }));
	}

	/**
	 * Makes this session the one serving its client, offering `offers`, which
	 * replace whatever it offered before. Send it first, and again whenever
	 * the offers change.
	 */
	async offer(offers: ClientCapabilities): Promise<void> {
		await this.exchange((id) => ({ type: 'hello', id, ...offers }));
	}

	/** Reports on actor session `sessionId`: a message resolves with the message stored. */
	report(sessionId: number, report: Extract<ActorSessionReport, { kind: 'message' }>): Promise<ActorSessionMessage>;
	report(sessionId: number, report: ActorSessionReport): Promise<void>;
	async report(sessionId: number, report: ActorSessionReport): Promise<ActorSessionMessage | void> {
		const data = await this.exchange((id) => ({ type: 'actorSessionUpdate', id, session_id: sessionId, ...report }));
		if (report.kind === 'message') return data as ActorSessionMessage;
	}

	/** Says how much of its limits actor `actor` has used, replacing what it said before. */
	async usage(actor: string, usage: ActorUsage): Promise<void> {
		await this.exchange((id) => ({ type: 'actorUsage', id, actor, ...usage }));
	}

	close(): void {
		this.transport.close();
	}

	private exchange(frame: (id: number) => ClientFrame): Promise<unknown> {
		if (this.ended) return Promise.reject(new SessionClosedError());
		const id = this.nextId++;
		return new Promise<ReplyOutcome>((resolve, reject) => {
			this.waiting.set(id, { resolve, reject });
			this.transport.send(JSON.stringify(frame(id)));
		}).then((outcome) => {
			if ('error' in outcome) throw new CohesionError(outcome.error);
			return outcome.ok.data;
		});
	}

	private receive(frame: ServerFrame): void {
		switch (frame.type) {
			case 'reply': {
				const waiting = frame.id === null ? undefined : this.waiting.get(frame.id);
				if (!waiting) return;
				this.waiting.delete(frame.id!);
				return waiting.resolve('error' in frame ? { error: frame.error } : { ok: frame.ok });
			}
			case 'call':
				return void this.answer(frame.call_id, frame.call);
			case 'invalidate':
				return this.onInvalidate(frame.keys);
			case 'reset':
				return this.onReset();
			case 'evicted':
				this.evicted = frame.reason;
				return;
		}
	}

	private async answer(callId: number, call: ClientCall): Promise<void> {
		let frame: ClientFrame;
		try {
			frame = { type: 'callResult', call_id: callId, ok: await this.onCall(call) };
		} catch (error) {
			frame = { type: 'callResult', call_id: callId, error: error instanceof Error ? error.message : String(error) };
		}
		if (!this.ended) this.transport.send(JSON.stringify(frame));
	}

	/** The transport closed: fail what still waits, and settle `closed`. */
	private finish(): void {
		this.ended = true;
		for (const waiting of this.waiting.values()) waiting.reject(new SessionClosedError());
		this.waiting.clear();
		this.end({ evicted: this.evicted });
	}
}
