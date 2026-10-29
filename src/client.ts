// A client that stays connected to cohesiond: it reconnects when its
// session drops, offers what it serves again, and holds its actors' task
// updates while it is away, as "Staying in sync" in cohesion's
// docs/actors.md describes.

import { CohesionError, SessionClosedError } from './errors.ts';
import type { ActorSaidContent, ActorTaskReport, ArgsOf, ClientCapabilities, RequestType } from './frames.ts';
import type { ActorTaskMessage, Replies } from './generated.ts';
import type { Server } from './server.ts';
import { Session, type CallHandler, type SessionEnd } from './session.ts';

/** Where the client stands with cohesiond. */
export type ClientState =
	| { kind: 'connecting' }
	| { kind: 'online'; session: Session }
	| { kind: 'offline'; error: Error; retryIn: number }
	/** cohesiond ended the session and the client mustn't reconnect. */
	| { kind: 'evicted'; reason: NonNullable<SessionEnd['evicted']> }
	| { kind: 'stopped' };

export interface ClientOptions {
	/** What the client offers, sent as its `hello` on every session. */
	offers: ClientCapabilities;
	/** Answers the daemon's calls. */
	onCall: CallHandler;
	/**
	 * Runs on each new session once its `hello` is accepted, before the
	 * updates held while away are sent: report, on `session`, the status and
	 * progress of each task still going on, which cohesiond forgot.
	 */
	onConnect?: (session: Session) => Promise<void>;
	onState?: (state: ClientState) => void;
}

/** An update waiting to be sent, and who waits on its reply. */
interface Held {
	taskId: number;
	report: ActorTaskReport;
	/** Sent on a session that ended before its reply: it may have been stored. */
	unsure: boolean;
	resolve: (message: ActorTaskMessage | void) => void;
	reject: (error: Error) => void;
}

const FIRST_RETRY = 500;
const LAST_RETRY = 30_000;

export class Client {
	private session: Session | null = null;
	private stopped = false;
	private held: Held[] = [];
	private sending = false;
	private wake: (() => void) | null = null;

	constructor(
		private readonly server: Server,
		private options: ClientOptions,
	) {}

	/** Connects, and keeps connecting until stopped or evicted. */
	async run(): Promise<void> {
		let retry = FIRST_RETRY;
		while (!this.stopped) {
			this.options.onState?.({ kind: 'connecting' });
			let end: SessionEnd;
			try {
				const session = await Session.open(this.server);
				session.onCall = (call) => this.options.onCall(call);
				await session.offer(this.options.offers);
				await this.options.onConnect?.(session);
				this.session = session;
				retry = FIRST_RETRY;
				this.options.onState?.({ kind: 'online', session });
				void this.flush();
				end = await session.closed;
			} catch (error) {
				end = { evicted: null };
				if (error instanceof CohesionError) throw error;
				if (this.stopped) break;
				this.options.onState?.({ kind: 'offline', error: asError(error), retryIn: retry });
			}
			this.session = null;
			if (end.evicted) {
				this.options.onState?.({ kind: 'evicted', reason: end.evicted });
				return;
			}
			if (this.stopped) break;
			await new Promise<void>((resolve) => {
				const timer = setTimeout(resolve, retry);
				this.wake = () => (clearTimeout(timer), resolve());
			});
			this.wake = null;
			retry = Math.min(retry * 2, LAST_RETRY);
		}
		this.options.onState?.({ kind: 'stopped' });
	}

	stop(): void {
		this.stopped = true;
		this.session?.close();
		this.wake?.();
	}

	/** Replaces what the client offers, and tells cohesiond now when connected. */
	async offer(offers: ClientCapabilities): Promise<void> {
		this.options = { ...this.options, offers };
		await this.session?.offer(offers);
	}

	/** Runs a request on the current session; fails while offline. */
	request<K extends RequestType>(type: K, ...args: ArgsOf<K>): Promise<Replies[K]> {
		if (!this.session) return Promise.reject(new SessionClosedError());
		return this.session.request(type, ...args);
	}

	/**
	 * Reports on actor task `taskId`, now or once connected, in order with
	 * every other report. Settles with the reply: the message stored, for a
	 * message, or a `CohesionError` when refused (a task cohesiond no longer
	 * has is refused as not found).
	 */
	report(taskId: number, report: Extract<ActorTaskReport, { kind: 'message' }>): Promise<ActorTaskMessage>;
	report(taskId: number, report: ActorTaskReport): Promise<void>;
	report(taskId: number, report: ActorTaskReport): Promise<ActorTaskMessage | void> {
		return new Promise((resolve, reject) => {
			this.held.push({ taskId, report, unsure: false, resolve, reject });
			void this.flush();
		});
	}

	/** Sends the held updates in order, one reply at a time, while online. */
	private async flush(): Promise<void> {
		if (this.sending) return;
		this.sending = true;
		try {
			for (let next = this.held[0]; next && this.session; next = this.held[0]) {
				const session = this.session;
				try {
					const already = next.unsure && next.report.kind === 'message' ? await stored(session, next.taskId, next.report.content) : null;
					if (already) {
						this.held.shift();
						next.resolve(already);
						continue;
					}
					const reply = await session.report(next.taskId, next.report);
					this.held.shift();
					next.resolve(reply ?? undefined);
				} catch (error) {
					if (error instanceof SessionClosedError) {
						// Stays first, to resend on the next session.
						next.unsure = true;
						return;
					}
					this.held.shift();
					next.reject(asError(error));
				}
			}
		} finally {
			this.sending = false;
		}
	}
}

/**
 * The last thing the actor said in task `taskId`, when it is `content`: an
 * update sent before a session dropped, unanswered, may have been stored.
 * A tool's `ended_at` is cohesiond's, not what the actor said.
 */
async function stored(session: Session, taskId: number, content: ActorSaidContent): Promise<ActorTaskMessage | null> {
	const messages = await session.request('listActorTaskMessages', { task_id: taskId });
	const last = messages.findLast((message) => message.content.sender === 'actor');
	if (!last) return null;
	const { sender: _, ...said } = last.content;
	if (said.kind === 'toolUse') delete (said as { ended_at?: unknown }).ended_at;
	return canonical(said) === canonical(content) ? last : null;
}

/** JSON with every object's keys sorted, to compare values. */
function canonical(value: unknown): string {
	return JSON.stringify(value, (_, inner) =>
		inner && typeof inner === 'object' && !Array.isArray(inner)
			? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
			: inner,
	);
}

function asError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}
