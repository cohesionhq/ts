// The session's own frames. Every type the daemon's requests and replies use
// comes from `generated.ts`; cohesion-core doesn't generate the frames around
// them (cohesion-core/src/protocol/envelope.rs and capabilities.rs), so they
// are written out here, as the web UI writes out the ones it uses.

import type {
	ActorMessageContent,
	ActorMode,
	ActorModel,
	ActorTaskStatus,
	ActorUsage,
	ActorUserContent,
	ContextUsage,
	InvalidationBatch,
	NoArgs,
	Replies,
	Requests,
	ServerError,
	Vocabulary,
} from './generated.ts';

// ---- Requests --------------------------------------------------------------

export type RequestType = keyof Requests;

/** The argument tuple of `request(type, ...args)`: empty for unit requests. */
export type ArgsOf<K extends RequestType> = Requests[K] extends NoArgs ? [] : [args: Requests[K]];

// ---- Offers ----------------------------------------------------------------

/** An actor as its client offers it in `hello`. */
export interface ActorDefinition {
	/** What the daemon names it by in calls; unique among the client's actors. */
	identifier: string;
	/** The agent's product, such as "Claude Code". */
	product: string;
	/** Where it works, such as a directory. */
	scope: string;
	/** How it can run a task, the first the default; none when it has one way only. */
	modes: ActorMode[];
	/** The models it can run a task on, the first the default; none when it picks for itself. */
	models: ActorModel[];
}

/**
 * Everything a client offers, as its `hello` lists it: its actors, each
 * identifier unique among them.
 */
export interface ClientCapabilities {
	actors: ActorDefinition[];
}

// ---- Calls -----------------------------------------------------------------

/**
 * An image the user sent, or an actor shows (`ClientImage`): PNG, JPEG, GIF
 * or WebP, at most 5 MB once base64-encoded.
 */
export interface ClientImage {
	/** `image/png`, `image/jpeg`, `image/gif` or `image/webp`. */
	media_type: string;
	/** The image, base64-encoded. */
	data: string;
}

/** The calls to an actor (`ClientCall`), each answered with `accepted`. */
export type ActorCall =
	| {
			kind: 'startActorTask';
			actor: string;
			task_id: number;
			prompt: string;
			/**
			 * The title the task was started with, or `null` when Cohesion
			 * took the prompt's first line, which a `title` report may
			 * replace; a daemon from before titles leaves it out.
			 */
			title?: string | null;
			/** The images attached to the prompt; a daemon from before images leaves it out. */
			images?: ClientImage[];
			/** `null` for the actor's default. */
			mode: string | null;
			model: string | null;
			effort: string | null;
	  }
	| {
			kind: 'sendActorTaskMessage';
			actor: string;
			task_id: number;
			message_id: number;
			content: ActorUserContent;
			/** The images attached to it; a daemon from before images leaves it out. */
			images?: ClientImage[];
	  }
	| { kind: 'stopActorTask'; actor: string; task_id: number }
	| { kind: 'setActorTaskMode'; actor: string; task_id: number; mode: string };

/** What the daemon asks a client to do: every call is one of its actors'. */
export type ClientCall = ActorCall;

/** What a client answers a call with: every call is an actor's, so `accepted`. */
export type ClientResult = { kind: 'accepted' };

// ---- Actor updates ---------------------------------------------------------

/**
 * One thing an actor reports about a task, tagged by `kind`
 * (`ActorTaskReport`). A message's `images` show below it; left out, none.
 * A `toolEnd` names the `toolUse` message whose tool finished by the `id`
 * its reply carried. A `context` replaces how full the task's context
 * window was said to be. A `title` renames the task and its activity,
 * replacing the current title (its first line, cut past 80 characters;
 * never blank); the same title again changes nothing.
 */
export type ActorTaskReport =
	| { kind: 'message'; content: ActorSaidContent; images?: ClientImage[] }
	| { kind: 'status'; status: ActorTaskStatus }
	| { kind: 'progress'; progress: string | null }
	| { kind: 'toolEnd'; message_id: number }
	| { kind: 'context'; context: ContextUsage }
	| { kind: 'title'; title: string };

/**
 * What an actor says, as it sends it: a `toolUse` leaves out `ended_at`,
 * which cohesiond stamps once a `toolEnd` names it.
 */
export type ActorSaidContent = ActorMessageContent extends infer Content
	? Content extends { kind: 'toolUse' }
		? Omit<Content, 'ended_at'>
		: Content
	: never;

// ---- Frames ----------------------------------------------------------------

/** A frame a client sends. */
export type ClientFrame =
	| { id: number; type: RequestType; args?: unknown }
	| { type: 'subscribe'; id: number }
	| ({ type: 'hello'; id: number } & ClientCapabilities)
	| ({ type: 'callResult'; call_id: number } & ({ ok: ClientResult } | { error: string }))
	| ({ type: 'actorTaskUpdate'; id: number; task_id: number } & ActorTaskReport)
	| ActorUsageUpdate;

/**
 * How much of its plan's limits one of the client's actors has used,
 * replacing what it said before; with no `plan`, it says nothing
 * (`ActorUsageUpdate`). A task's context is its own `context` report.
 */
export type ActorUsageUpdate = { type: 'actorUsage'; id: number; actor: string } & ActorUsage;

/** Why the daemon ended a client's session; reconnecting after either is wrong. */
export type EvictionReason = 'replaced' | 'revoked';

/** A reply's outcome: the data, tagged by its type, or why the request failed. */
export type ReplyOutcome =
	| { ok: { type: string; data: unknown } }
	| { error: ServerError };

/** A frame the daemon sends, numbered in send order. */
export type ServerFrame = { seq: number } & (
	| {
			type: 'hello';
			protocol: number;
			server: string;
			/** The name the client is listed under. */
			client_name: string;
			web_bundle_hash: string | null;
			vocabulary: Vocabulary;
	  }
	| ({ type: 'reply'; id: number | null } & ReplyOutcome)
	| ({ type: 'invalidate' } & InvalidationBatch)
	| { type: 'reset' }
	| { type: 'call'; call_id: number; call: ClientCall }
	| { type: 'evicted'; reason: EvictionReason }
);

export type { Replies, Requests };
