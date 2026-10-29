// The session's own frames. Every type the daemon's requests and replies use
// comes from `generated.ts`; cohesion-core doesn't generate the frames around
// them (cohesion-core/src/protocol/envelope.rs and capabilities.rs), so they
// are written out here, as the web UI writes out the ones it uses.

import type {
	ActorMessageContent,
	ActorMode,
	ActorModel,
	ActorTaskStatus,
	ActorUserContent,
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

/** One model a client runs. */
export interface CapabilityModel {
	/** What a completion's `model` names it by. */
	identifier: string;
	/** The model as people know it, such as "Private Cloud Compute". */
	title: string;
	/** The most tokens a request and its answer may hold together. */
	context_size: number;
}

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
 * Everything a client offers, as its `hello` lists it. Each identifier is
 * unique within its list. Connectors are passed through as the daemon
 * reads them (`ConnectorDefinition`), which nothing generates yet.
 */
export interface ClientCapabilities {
	intelligence: CapabilityModel[];
	connectors: unknown[];
	actors: ActorDefinition[];
}

// ---- Calls -----------------------------------------------------------------

/** The calls to an actor, each answered with `accepted`. */
export type ActorCall =
	| {
			kind: 'startActorTask';
			actor: string;
			task_id: number;
			prompt: string;
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
	  }
	| { kind: 'stopActorTask'; actor: string; task_id: number };

/**
 * What the daemon asks a client to do. Model turns and connector calls are
 * passed through untyped, like their offers.
 */
export type ClientCall =
	| ActorCall
	| {
			kind: 'completion' | 'listOrganizationUnits' | 'listResources' | 'fetchResource';
			[field: string]: unknown;
	  };

/** What a client answers a call with: `accepted` for every actor call. */
export type ClientResult = { kind: 'accepted' } | { kind: string; [field: string]: unknown };

// ---- Actor updates ---------------------------------------------------------

/** One thing an actor reports about a task, tagged by `kind`. */
export type ActorTaskReport =
	| { kind: 'message'; content: ActorMessageContent }
	| { kind: 'status'; status: ActorTaskStatus }
	| { kind: 'progress'; progress: string | null };

// ---- Frames ----------------------------------------------------------------

/** A frame a client sends. */
export type ClientFrame =
	| { id: number; type: RequestType; args?: unknown }
	| { type: 'subscribe'; id: number }
	| ({ type: 'hello'; id: number } & ClientCapabilities)
	| ({ type: 'callResult'; call_id: number } & ({ ok: ClientResult } | { error: string }))
	| ({ type: 'actorTaskUpdate'; id: number; task_id: number } & ActorTaskReport);

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
	| ({ type: 'toolResult'; id: string } & ({ output: string } | { error: string }))
	| { type: 'evicted'; reason: EvictionReason }
);

export type { Replies, Requests };
