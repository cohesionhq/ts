// Generated from cohesion-core by `bun run generate`; do not edit.

export const PROTOCOL_VERSION = 1;

/** Marks a request that carries no `args` key on the wire. */
export type NoArgs = undefined;

export interface AboutResponse {
	hostname: string;
	version: string;
}

export type AcceptedResponse = null;

/**
 * What serves an account's items. The table's checks give every row
 * exactly one of these.
 */
export type AccountHost =
	| {
	kind: "extension";
	/** Id of the extension that serves the account. */
	extension_id: number;
	/** The account's identifier at the service, unique per extension. */
	identifier: string;
}
	| {
	kind: "client";
	/** The client serving the account; it has one per connector. */
	client_id: number;
}
	| { kind: "orphaned" };

/**
 * A unit of long-running work Cohesion shows the user while it goes on and
 * keeps once it ends: its title, what it is, where it stands and, while it
 * runs, a short line on its progress. The work itself is owned elsewhere
 * (an agent's detached run, an actor's task); only `ActivityTracker` writes these rows.
 */
export interface Activity {
	id: number;
	title: string;
	/** What the activity is, and so where a client jumps to show it. */
	kind: ActivityKind;
	status: ActivityStatus;
	/**
	 * What the work last said it is doing, such as "Read 12 of 40
	 * sources"; `null` when it said nothing.
	 */
	progress: string | null;
	started_at: number;
	/** When the activity ended; `null` while it runs or waits. */
	ended_at: number | null;
}

/**
 * What an activity is. The table's triggers give every row exactly one of
 * these.
 */
export type ActivityKind =
	| {
	kind: "detachedRun";
	/** The agent whose run it is. */
	agent_id: number;
}
	| {
	kind: "actorTask";
	/** The task it shows. */
	actor_task_id: number;
};

/**
 * Where an activity stands.
 *
 * - `"running"`, `"waiting"`, `"paused"`: going on, as an
 *   [`ActivityStanding`] says.
 * - `"succeeded"`, `"failed"`, `"cancelled"`: ended, as an
 *   [`ActivityOutcome`] says.
 */
export type ActivityStatus =
	| "running"
	| "waiting"
	| "paused"
	| "succeeded"
	| "failed"
	| "cancelled";

/**
 * An agent on a client's device, such as Claude Code in one directory,
 * that Cohesion hands tasks to: a client offers each in its `Hello`, and
 * works each task in the actor's own system, reporting back what it says
 * and where it stands.
 *
 * An actor has no name of its own: every read takes its client's name
 * (a join of `clients`), so renaming the client renames its actors. One
 * its client no longer offers is soft-deleted, keeping its tasks.
 */
export interface Actor {
	id: number;
	deleted: boolean;
	/** The client that offers it, and whose online state it shares. */
	client_id: number;
	/** What its client calls it, unique among the client's actors. */
	identifier: string;
	/** The agent's product, such as "Claude Code". */
	product: string;
	/** Where it works, such as a directory: `/Users/jackson/Developer/cohesion`. */
	scope: string;
	/** How it can run a task, the first the default. */
	modes: ActorMode[];
	/** The models it can run a task on, the first the default. */
	models: ActorModel[];
	/**
	 * The product on its client's current name, such as "Claude Code on
	 * Jackson's MacBook Pro".
	 */
	title: string;
}

/** The answer to one question of an actor's. */
export interface ActorAnswer {
	/** The labels of the options picked. */
	selected: string[];
	/** The answer in the user's own words, when the question allows it. */
	other?: string | null;
}

/** A reasoning effort an actor's model takes. */
export interface ActorEffort {
	identifier: string;
	/** The effort as people know it, such as "High". */
	title: string;
}

/** One file an actor asks to change. */
export interface ActorFileChange {
	path: string;
	change: ActorFileChangeKind;
	/** The change as a unified diff, when the actor has one. */
	diff: string | null;
}

/** How a file changes. */
export type ActorFileChangeKind =
	| "add"
	| "update"
	| "delete";

/**
 * What an actor says in a task, tagged by `kind`.
 *
 * - `"text"`: the agent's own words, as Markdown.
 * - `"toolUse"`: a tool it ran, such as editing a file, and when it ended.
 * - `"question"`: questions for the user, each with options (Claude Code's
 *   `AskUserQuestion`, Codex's `request_user_input`).
 * - `"permission"`: something it needs the user's leave to do: run a
 *   command, change files, or use a tool.
 * - `"plan"`: a plan it asks the user to approve before it starts
 *   (Claude Code's `ExitPlanMode`).
 *
 * The last three are requests: the task waits for the user's response.
 */
export type ActorMessageContent =
	| {
	kind: "text";
	text: string;
}
	| {
	kind: "toolUse";
	/** The tool, such as "Edit", as the actor names it. */
	tool: string;
	/**
	 * What kind of tool it is, as the actor's client classifies it;
	 * `"other"` when left out.
	 */
	category?: ActorToolKind;
	/** What it did, in a line, such as "src/main.rs". */
	summary: string;
	/**
	 * When it ended, in Unix seconds, as Cohesion heard of it from a
	 * `toolEnd` update; `null` while it runs, and for one whose actor
	 * never said (a tool it was stopped in, or an actor that doesn't
	 * report ends).
	 */
	ended_at: number | null;
}
	| {
	kind: "question";
	questions: ActorQuestion[];
}
	| ({ kind: "permission" } & ActorPermissionRequest)
	| {
	kind: "plan";
	/** The plan, as Markdown. */
	plan: string;
};

/**
 * One way an actor can run a task, such as sandboxed or accepting edits on
 * its own.
 */
export interface ActorMode {
	identifier: string;
	/** The mode as people know it, such as "Auto". */
	title: string;
	/** What it lets the actor do without asking. */
	description: string | null;
}

/** A model an actor can run a task on, and how hard it can make it think. */
export interface ActorModel {
	identifier: string;
	/** The model as people know it, such as "Opus". */
	title: string;
	/**
	 * The reasoning efforts it takes, least first; none when it takes no
	 * setting.
	 */
	efforts: ActorEffort[];
}

/**
 * What the user decides about an actor's permission request.
 *
 * - `"allow"`: this once.
 * - `"allowForSession"`: this and the like for the rest of the task.
 * - `"deny"`: not this; the actor carries on without it.
 * - `"abort"`: not this, and stop what it is doing.
 */
export type ActorPermissionDecision =
	| "allow"
	| "allowForSession"
	| "deny"
	| "abort";

/**
 * Something an actor needs the user's leave to do, and the decisions it
 * takes.
 */
export interface ActorPermissionRequest {
	subject: ActorPermissionSubject;
	/** Why it wants to, in its words. */
	reason: string | null;
	/** The decisions it takes, in the order to offer them. */
	decisions: ActorPermissionDecision[];
}

/**
 * What an actor asks leave to do, tagged by `kind`.
 *
 * - `"command"`: run a shell command.
 * - `"fileChange"`: change files.
 * - `"tool"`: use any other tool, with its input as JSON.
 */
export type ActorPermissionSubject =
	| {
	kind: "command";
	command: string;
	/** The directory it runs in. */
	cwd: string | null;
}
	| {
	kind: "fileChange";
	changes: ActorFileChange[];
}
	| {
	kind: "tool";
	name: string;
	input: unknown;
};

/** One question an actor asks. */
export interface ActorQuestion {
	/** A short label for it, such as "Auth method". */
	header: string | null;
	question: string;
	/** The answers to pick from; none for a question answered in words. */
	options: ActorQuestionOption[];
	/** Whether more than one option may be picked. */
	multi_select: boolean;
	/** Whether the user may answer in their own words instead. */
	allows_other: boolean;
}

/** An answer to pick for an actor's question. */
export interface ActorQuestionOption {
	label: string;
	/** What picking it means. */
	description: string | null;
}

/**
 * One task an actor works on, such as a Claude Code session: a thread in
 * the actor's own system, which it reports to Cohesion as it goes. While
 * it works, or needs the user, an activity shows it. A task never ends for
 * good: a message to one that is done, or failed, starts it again.
 */
export interface ActorTask {
	id: number;
	actor_id: number;
	title: string;
	/** The actor's mode it runs in; `null` for the actor's default. */
	mode: string | null;
	/** The actor's model it runs on; `null` for the actor's default. */
	model: string | null;
	/** The model's reasoning effort; `null` for the model's default. */
	effort: string | null;
	started_at: number;
	/** When anything was last said in it, which orders the tasks. */
	last_activity_at: number;
	/** Where it stands, as its actor last reported. */
	status: ActorTaskStatus;
	/**
	 * Whether its actor finished a stretch of work, done or failed, since
	 * the user last read it; stopping it, or its client going away, doesn't.
	 */
	unread: boolean;
}

/**
 * An image that came with a message in an actor task: one the user
 * attached, or one the actor showed.
 */
export interface ActorTaskAttachment {
	id: number;
	message_id: number;
	/** `image/png`, `image/jpeg`, `image/gif` or `image/webp`. */
	media_type: string;
	/** The image, base64-encoded. */
	data: string;
}

/** One entry in an actor task's transcript. */
export interface ActorTaskMessage {
	id: number;
	task_id: number;
	sent_at: number;
	/** Who said it and what, stored as JSON. */
	content: ActorTaskMessageContent;
	/** Whether the user has answered it; only a request can be. */
	answered: boolean;
	/**
	 * How many images came with it, the user's or the actor's;
	 * `ListActorTaskMessageAttachments` fetches them.
	 */
	attachment_count: number;
}

/**
 * Who said an actor task message, tagged by `sender`, and what it says,
 * tagged by `kind`.
 */
export type ActorTaskMessageContent =
	| ({ sender: "actor" } & ActorMessageContent)
	| ({ sender: "user" } & ActorUserContent);

/**
 * Where an actor task stands.
 *
 * - `"working"`: the actor is at it.
 * - `"needsAttention"`: the actor is waiting on the user, such as for a
 *   response to a request.
 * - `"idle"`: done, until the user says more.
 * - `"failed"`: the actor couldn't go on; the user may say more to try
 *   again.
 *
 * A working task, or one that needs attention, has an activity open, which
 * ends succeeded as it goes idle and failed as it fails.
 */
export type ActorTaskStatus =
	| "working"
	| "needsAttention"
	| "idle"
	| "failed";

/**
 * What kind of tool an actor ran, which its client decides from the
 * tool's name, since only the client knows its actor's tools.
 *
 * - `"command"`: runs a shell command (Claude Code's `Bash`).
 * - `"read"`: reads a file or directory (`Read`).
 * - `"edit"`: changes files (`Edit`, `Write`).
 * - `"search"`: searches files or their contents (`Grep`, `Glob`).
 * - `"web"`: fetches or searches the web (`WebFetch`, `WebSearch`).
 * - `"agent"`: hands work to another agent (`Agent`).
 * - `"other"`: anything else, and a tool its client didn't classify.
 */
export type ActorToolKind =
	| "command"
	| "read"
	| "edit"
	| "search"
	| "web"
	| "agent"
	| "other";

/**
 * What the user says in an actor task, tagged by `kind`.
 *
 * - `"text"`: a message, the first the task's prompt.
 * - `"answers"`: the answers to a `question`, one per question in order.
 * - `"permission"`: the decision on a `permission` request.
 * - `"plan"`: whether a `plan` is approved.
 *
 * Every kind but `text` responds to the request `request_id`, at most once.
 */
export type ActorUserContent =
	| {
	kind: "text";
	text: string;
}
	| {
	kind: "answers";
	request_id: number;
	answers: ActorAnswer[];
}
	| {
	kind: "permission";
	request_id: number;
	decision: ActorPermissionDecision;
	/** What to tell the actor with it, such as why not. */
	message?: string | null;
}
	| {
	kind: "plan";
	request_id: number;
	approved: boolean;
	/** What to change, when not approved. */
	feedback?: string | null;
};

/**
 * Makes endpoint `endpoint_id` offer model `model_identifier`, linked to
 * the catalog when it lists the model for the endpoint's provider. The
 * request is the whole model: the fields given override the catalog's, and
 * one left out falls back to the catalog's (`model_name` then to the
 * identifier), clearing any override. Adding a model the endpoint already
 * offers replaces it. Refused for a client's endpoint, which offers the
 * models the client offers.
 */
export interface AddEndpointModelRequest {
	endpoint_id: number;
	model_identifier: string;
	model_name?: string | null;
	context_size?: number | null;
	prices?: ModelPrices | null;
}

/**
 * Reads the feed at `url` (http or https) and follows it, last in the
 * order, adding its items to the feed corpus.
 */
export interface AddFeedRequest {
	url: string;
	/** `"whenExcerpt"` when absent. */
	full_page_policy?: FeedFullPagePolicy;
	/** `"coherence"` when absent. */
	parser?: ArticleParser;
}

/**
 * A question the agent asks with answers to pick from, lettered `A`, `B`,
 * `C` and so on, stored as a `choice` message. Picking one records it here
 * and starts the agent's turn on it; the pick posts no message of its own.
 */
export interface AgentChoice {
	/** The question, in Markdown. */
	question: string;
	/** The answers on offer, in letter order. */
	options: string[];
	/**
	 * From a background run: what the agent's conversation needs to act on
	 * the pick, such as what the run found and what each answer leads to.
	 * The agent reads it with the pick; the user doesn't see it. `null`
	 * from the conversation itself.
	 */
	context: string | null;
	/** The index in `options` of the user's pick; `null` until they pick. */
	selected: number | null;
}

/** A script the agent ran, stored as a `codeExecution` message. */
export interface AgentCodeExecution {
	/** What the script does, as the agent described it. */
	title: string;
	code: string;
	/** The script's result, when it succeeded. */
	result: string | null;
	/** Why the script failed, when it did. */
	error: string | null;
}

/**
 * Where a cue wakes its agent, and on what model.
 *
 * - `"low"`, `"medium"`, `"high"`: a background run each time the cue
 *   fires, on that tier's default model.
 * - `"foreground"`: a turn of the agent's conversation, once; the cue is
 *   removed as it fires.
 */
export type AgentCueEffort =
	| "low"
	| "medium"
	| "high"
	| "foreground";

/** What became of a memory, in a `memory` message. */
export type AgentMemoryChange =
	| "remembered"
	| "forgotten";

/**
 * What an agent message says, tagged by `kind`.
 *
 * - `"text"`: plain text.
 * - `"codeExecution"`: a script the agent ran.
 * - `"proposal"`: a change a background agent asks the user to approve.
 * - `"error"`: why the sender's turn or run failed.
 * - `"documentation"`: the script API module the sender loaded, such as
 *   `network`.
 * - `"choice"`: a question with answers to pick from.
 * - `"memory"`: a memory the agent remembered or forgot.
 */
export type AgentMessageContent =
	| {
	kind: "text";
	text: string;
}
	| ({ kind: "codeExecution" } & AgentCodeExecution)
	| ({ kind: "proposal" } & AgentProposal)
	| {
	kind: "error";
	error: string;
}
	| {
	kind: "documentation";
	module: string;
}
	| ({ kind: "choice" } & AgentChoice)
	| {
	kind: "memory";
	memory: string;
	change: AgentMemoryChange;
};

/**
 * A change a background agent asks the user to approve, stored as a
 * `proposal` message.
 */
export interface AgentProposal {
	/** What the change does. */
	action: string;
	/** Why the agent wants it. */
	justification: string;
	/** The script that makes the change once approved. */
	code: string;
	status: AgentProposalStatus;
	/** The script's result, once approved and run. */
	result: string | null;
	/** Why the script failed, once approved and run. */
	error: string | null;
}

/**
 * Where a background agent's proposal stands.
 *
 * - `"pending"`: waiting for the user.
 * - `"approved"`: the user approved it and its code ran.
 * - `"denied"`: the user denied it.
 * - `"withdrawn"`: a later run of the same cue replaced it before the user
 *   answered.
 */
export type AgentProposalStatus =
	| "pending"
	| "approved"
	| "denied"
	| "withdrawn";

/**
 * Appends `content` to the journal for `date` (`"YYYY-MM-DD"`) in a
 * workspace, creating it if needed.
 */
export interface AppendToJournalRequest {
	workspace_id: number;
	date: string;
	content: string;
}

/**
 * A web page with its content as Markdown as of when it was last fetched:
 * one saved by hand, or an item a feed brought in. An article belongs to no
 * workspace itself: it is saved to any number of workspaces at once (each
 * a [`WorkspaceArticle`], which files it in that workspace's inbox or a
 * folder), and its title, contents and `read` are the same in all of them.
 * Saving a URL to a workspace reuses a live article with that URL rather
 * than adding another.
 *
 * An item from a feed starts in no workspace, in the feed corpus only; an
 * article saved by hand is deleted once it is in no workspace.
 */
export interface Article {
	/** Unique, stable identifier. */
	id: number;
	/**
	 * Whether the article has been soft-deleted. Listings skip deleted articles,
	 * so this is normally `false`.
	 */
	deleted: boolean;
	/** The feed it came from; `None` for an article saved by hand. */
	feed_id: number | null;
	/**
	 * Whether it has been read: one flag, the same from every workspace.
	 * A new article, saved by hand or from a feed, starts unread.
	 */
	read: boolean;
	/** The address as it was saved. */
	url: string;
	/**
	 * Display name: the page's title when it was first saved, else the
	 * last part of the URL's path (its host when the path is empty), until
	 * renamed.
	 */
	title: string;
	/** Who wrote it, when the page says. */
	author: string | null;
	/**
	 * When it was published, in Unix seconds: the date the page gives,
	 * else when it was saved.
	 */
	published_at: number;
	/** Whether `published_at` is a moment or only a day. */
	published_precision: PublishedPrecision;
	/** How the last fetch went. */
	snapshot: ArticleSnapshot;
	/**
	 * The page's main content as Markdown (a plain-text page as it was
	 * served) as of the snapshot; `""` when the page has never been
	 * fetched successfully. Full-text searchable, with the title, through
	 * the search of every workspace it is saved to.
	 */
	contents: string;
	/** When the article was first saved or brought in, in Unix seconds. */
	created_at: number;
	/** When the article last changed, in Unix seconds. */
	modified: number;
}

/** A whole article as one workspace's reader shows it. */
export interface ArticleDetail {
	article: Article;
	/**
	 * Every workspace it is saved to; empty for a feed item no workspace
	 * has saved. It is saved to the asking workspace when that is one.
	 */
	workspace_ids: ArticleWorkspaces;
	/**
	 * The folder it is filed in, in the asking workspace; `None` is the
	 * inbox, or that it isn't saved there.
	 */
	article_folder_id: number | null;
	/** Ids of the asking workspace's tags on it. */
	tag_ids: TagIds;
}

/** Why a page couldn't be fetched. */
export type ArticleFetchFailure =
	| {
	kind: "unreachable";
	message: string;
}
	| {
	kind: "status";
	code: number;
}
	| {
	kind: "unsupportedContent";
	content_type: string;
}
	| { kind: "tooLarge" }
	| { kind: "notAFeed" };

/**
 * Which articles a listing covers. The first three are the articles saved
 * to a workspace; the feed ones are shared by every workspace.
 *
 * - `"inbox"`: the workspace's saved articles in no folder (the default).
 * - `"all"`: every article saved to the workspace, filed or not.
 * - `{ "folder": id }`: the workspace's saved articles filed in that folder.
 * - `{ "feed": id }`: every article that came from that feed, saved to any
 *   workspaces or to none.
 * - `"feeds"`: every article that came from any feed, saved or not.
 * - `"unreviewed"`: articles from any feed that no workspace has saved.
 */
export type ArticleFilter =
	| "inbox"
	| "all"
	| { "folder": number }
	| { "feed": number }
	| "feeds"
	| "unreviewed";

/**
 * A named group of saved articles in a workspace. A saved article in no
 * folder is in the workspace's article inbox.
 */
export interface ArticleFolder {
	id: number;
	workspace_id: number;
	title: string;
	/**
	 * Where the folder sits among its workspace's article folders; lower
	 * comes first.
	 */
	sort_order: number;
	deleted: boolean;
}

/** One page of a listing: its articles, and how many the whole listing has. */
export interface ArticlePage {
	articles: ArticleSummary[];
	/** Every article the listing covers, on any page. */
	total: number;
}

/**
 * What finds the article in a fetched page and reads its title, author
 * and date.
 *
 * - `"coherence"`: Cohesion's own parser, still experimental (the
 *   default).
 * - `"readability"`: Readability's algorithm.
 */
export type ArticleParser =
	| "coherence"
	| "readability";

/** How an article's page was last fetched; stored as JSON text. */
export type ArticleSnapshot =
	| {
	state: "captured";
	/** The address the page was read from, after redirects. */
	final_url: string;
	/** The page's own `<title>`, if it had one. */
	page_title: string | null;
	/** When the page was fetched, in Unix seconds. */
	fetched_at: number;
	/** Whether the text was cut short because the page was too long. */
	truncated: boolean;
}
	| {
	state: "failed";
	/** Why the last attempt failed. */
	failure: ArticleFetchFailure;
	/** When it was attempted, in Unix seconds. */
	attempted_at: number;
};

/**
 * An article as a listing in one workspace shows it: everything but its
 * contents, with where it is filed in that workspace. Read only by the
 * article listing, which binds the workspace it lists from (`bind_join`).
 */
export interface ArticleSummary {
	id: number;
	deleted: boolean;
	/** The feed it came from, if any. */
	feed_id: number | null;
	/** Whether it has been read, from any workspace. */
	read: boolean;
	/**
	 * Every workspace it is saved to; empty for a feed item no workspace
	 * has saved. It is saved to the listing's workspace when that is one.
	 */
	workspace_ids: ArticleWorkspaces;
	/**
	 * The folder it is filed in, in the listing's workspace; `None` is the
	 * inbox, or that it isn't saved there.
	 */
	article_folder_id: number | null;
	/**
	 * Ids of the listing workspace's tags on it; empty when it isn't saved
	 * there.
	 */
	tag_ids: TagIds;
	url: string;
	title: string;
	author: string | null;
	/** In Unix seconds. */
	published_at: number;
	published_precision: PublishedPrecision;
	snapshot: ArticleSnapshot;
	/** In Unix seconds. */
	created_at: number;
	/** In Unix seconds. */
	modified: number;
}

/** The ids of the workspaces an article is saved to; read from a JSON array. */
export type ArticleWorkspaces = number[];

/** What marking a view read changed. */
export interface ArticlesMarkedRead {
	/** How many articles were unread and now are read. */
	marked: number;
}

/** Asks `oauth` extension `extension_id` where the user signs in. */
export interface BeginConnectorAuthenticationRequest {
	extension_id: number;
}

/**
 * Calls the global `serviceRequest(name, args)` of the extension whose
 * manifest declares `identifier`, which the extension needs the `service`
 * or `service:isolated` permission enabled for, and answers what it
 * returns. An extension that declares a `service` block answers only the
 * names it declares.
 */
export interface CallExtensionRequest {
	/**
	 * The extension's manifest `identifier`, such as
	 * `com.cohesion.cloud.ios-companion`; 1 to 256 characters.
	 */
	identifier: string;
	/**
	 * Which request, as the extension names them; at most 128 characters.
	 * One of its declared functions when it declares a `service` block.
	 */
	name: string;
	/**
	 * Passed to the extension as the JS value this JSON parses to; `null`
	 * when left out. At most 64 KB as JSON.
	 */
	args?: unknown;
}

/** An LLM offered by a provider, with its context size and per-token pricing. */
export interface CatalogModel {
	id: number;
	/** The models.dev provider identifier, for example `openai`. */
	provider_identifier: string;
	/** The provider's display name, for example `OpenAI`. Display only. */
	provider_name: string;
	/** The model identifier, for example `gpt-5`. */
	model_identifier: string;
	/** The model's display name, for example `GPT-5`. Display only. */
	model_name: string;
	context_size: number | null;
	input_token_cost: number | null;
	output_token_cost: number | null;
	cache_read_token_cost: number | null;
	cache_write_token_cost: number | null;
	large_context_threshold: number | null;
	large_context_input_token_cost: number | null;
	large_context_output_token_cost: number | null;
	large_context_cache_read_token_cost: number | null;
	large_context_cache_write_token_cost: number | null;
}

/**
 * Change task's status. Responds with only the tasks whose status changed;
 * tasks already in `status` are left untouched.
 */
export interface ChangeTasksStatusRequest {
	workspace_id: number;
	task_ids: number[];
	status: TaskStatus;
}

/** Removes the default model of `tier`. */
export interface ClearIntelligenceDefaultRequest {
	tier: IntelligenceTier;
}

/**
 * A client trusted to talk to cohesiond. Any client may show Cohesion to a
 * person, offer capabilities (models and connectors), or both.
 */
export interface Client {
	id: number;
	deleted: boolean;
	/** What identifies the client, and so what `key` is the fingerprint of. */
	key_kind: ClientKeyKind;
	/** The SHA-256 of what identifies the client; unique among live clients. */
	key: string;
	/** How the client is listed; it can be renamed. */
	client_name: string;
}

/**
 * How a client proves who it is.
 *
 * - `"certificate"`: the certificate it registered with a setup code,
 *   presented over mutual TLS.
 * - `"local"`: the local key it presents on the daemon's Unix socket,
 *   whose file permissions trust it.
 */
export type ClientKeyKind =
	| "certificate"
	| "local";

/**
 * Exchanges the `code` the sign-in page gave the user for a credential and
 * adds (or re-authenticates) the account it belongs to.
 */
export interface CompleteConnectorAuthenticationRequest {
	extension_id: number;
	code: string;
}

/** A connector's stored definition, which its accounts share. */
export interface Connector {
	/** Unique, stable identifier. */
	id: number;
	/** Identifies the connector to its hosts, unique ignoring case. */
	identifier: string;
	version: number;
	/** The service's name, such as `"Notion"`. */
	title: string;
	/** A `data:image/…` or `https://` URL. */
	icon: string | null;
	/** What the service calls an account, such as `"Workspace"` or `"Device"`. */
	unit: string;
	/**
	 * The kinds of item its resources can be, as its definition last
	 * declared them.
	 */
	kinds: ResourceKind[];
	/** The metadata keys its resources may carry. */
	metadata_keys: MetadataKey[];
	/** When the connector was first served, in Unix seconds. */
	created_at: number;
}

/** The sign-in page to open for the user. */
export interface ConnectorAuthentication {
	url: string;
}

/**
 * One service an `oauth` extension reaches, as its `serviceDescription()`
 * describes it.
 */
export interface ConnectorService {
	extension_id: number;
	/** The extension's name. */
	name: string;
	/** The service's name; the extension's name when `error` is set. */
	title: string;
	unit: string;
	/** The extension's icon, a `data:image/…` or `https://` URL. */
	icon: string | null;
	/** Why the extension couldn't describe its service. */
	error: string | null;
}

/** Adds an article folder titled `title`, last in the workspace's order. */
export interface CreateArticleFolderRequest {
	workspace_id: number;
	title: string;
}

/** Creates an ordinary document in a workspace. */
export interface CreateDocumentRequest {
	workspace_id: number;
	title: string;
	contents: string;
}

/** Creates an agent; it runs on the `agent` tier's default model. */
export interface CreateIntelligenceAgentRequest {
	/** A blank or absent name picks an unused first name, like `Ada`. */
	name?: string | null;
	color: IntelligenceAgentColor;
	/** Shown in place of the name's initial; none when absent. */
	emoji?: string | null;
	/** `balanced` when absent. */
	personality?: IntelligenceAgentPersonality | null;
	/** `brief` when absent. */
	verbosity?: IntelligenceAgentVerbosity | null;
	/** What the user wants from the agent; none when absent. */
	role?: string | null;
	/** The rules the agent always follows; none when absent. */
	directive?: string | null;
}

/**
 * Creates an intelligence endpoint from a preset, with the preset's default
 * model imported. Refused when the name is taken.
 */
export type CreateIntelligenceEndpointRequest = {
	/**
	 * What the endpoint is called. Defaults to the provider's display name,
	 * or a custom endpoint's provider identifier.
	 */
	name?: string | null;
	api_key?: string | null;
} & IntelligenceEndpointPreset;

/**
 * Creates a tag for `entity` in workspace `workspace_id`. A workspace has
 * one tag of a kind per name, ignoring case.
 */
export interface CreateTagRequest {
	workspace_id: number;
	entity: TagEntity;
	name: string;
}

/** Create task folder */
export interface CreateTaskFolderRequest {
	workspace_id: number;
	title: string;
}

/** Create task */
export interface CreateTaskRequest {
	workspace_id: number;
	title: string;
	folder_id?: number | null;
	/** `"none"` when absent. */
	priority?: TaskPriority | null;
	/** Markdown notes; none when absent. */
	description?: string | null;
	/** The start day, as `"YYYY-MM-DD"`; none when absent. */
	start_date?: string | null;
	/** The due day, as `"YYYY-MM-DD"`; none when absent. */
	due_date?: string | null;
	/** Ids of the workspace's task tags to put on the task; none when absent. */
	tag_ids?: number[];
}

/** Creates a workspace with `title`. */
export interface CreateWorkspaceRequest {
	title: string;
	/** Shown in place of the title's initial; none when absent. */
	emoji?: string | null;
}

/**
 * Which days a date filter matches, each day as `"YYYY-MM-DD"`:
 * - a day: only that day.
 * - an array of days: any of them.
 * - a `DayRange`: the days between its bounds.
 */
export type DayFilter =
	| string
	| string[]
	| DayRange;

/**
 * The days strictly between two `"YYYY-MM-DD"` bounds; a bound left out leaves
 * that side open.
 *
 * A task with no date never matches.
 */
export interface DayRange {
	/** Only days before this one. */
	before?: string | null;
	/** Only days after this one. */
	after?: string | null;
}

/** Deletes article folder `folder_id`; the articles in it move to the inbox. */
export interface DeleteArticleFolderRequest {
	workspace_id: number;
	folder_id: number;
}

/** Revokes client `id`; its certificate is no longer trusted. */
export interface DeleteClientRequest {
	id: number;
}

/**
 * Removes connector account `account_id` and every resource imported from
 * it. A client's account is refused: it goes with its client, or is
 * orphaned once the client stops offering its connector.
 */
export interface DeleteConnectorAccountRequest {
	account_id: number;
}

/** Deletes document `document_id` in a workspace. */
export interface DeleteDocumentRequest {
	workspace_id: number;
	document_id: number;
}

/**
 * Stops following feed `feed_id` and removes the items from it that no
 * workspace has saved; saved ones stay.
 */
export interface DeleteFeedRequest {
	feed_id: number;
}

/** Deletes agent `agent_id` with its cues, runs and messages. */
export interface DeleteIntelligenceAgentRequest {
	agent_id: number;
}

/**
 * Deletes intelligence endpoint `id`. Refused for a client endpoint, which
 * goes with its client (`DeleteClient`).
 */
export interface DeleteIntelligenceEndpointRequest {
	id: number;
}

/** Removes resource `resource_id` from workspace `workspace_id`. */
export interface DeleteResourceRequest {
	workspace_id: number;
	resource_id: number;
}

/**
 * Deletes tag `tag_id` of workspace `workspace_id`, taking it off every
 * task or article it was on.
 */
export interface DeleteTagRequest {
	workspace_id: number;
	tag_id: number;
}

/** Delete task folder */
export interface DeleteTaskFolderRequest {
	workspace_id: number;
	folder_id: number;
}

/** Deletes task `task_id` in a workspace. */
export interface DeleteTaskRequest {
	workspace_id: number;
	task_id: number;
}

/** Deletes workspace `id`. */
export interface DeleteWorkspaceRequest {
	id: number;
}

/**
 * The wire dialect an intelligence endpoint speaks, which selects the backend
 * used to talk to it.
 */
export type Dialect =
	| "chatCompletions"
	| "messages"
	| "responses";

/** A piece of text in a workspace; journals are documents with a `journal_date`. */
export interface Document {
	/** Unique, stable identifier. */
	id: number;
	/** Id of the workspace this document belongs to. */
	workspace_id: number;
	/**
	 * Whether the document has been soft-deleted.
	 *
	 * Listings skip deleted documents, so this is normally `false`.
	 */
	deleted: boolean;
	/** Whether this is an ordinary document or a daily journal. */
	document_type: DocumentType;
	/**
	 * Display name.
	 *
	 * Journals are titled with their date, as `YYYY-MM-DD`.
	 */
	title: string;
	/** The full text of the document, as plain text / Markdown. */
	contents: string;
	/**
	 * When the contents last changed, in Unix **seconds** (not
	 * milliseconds; in JavaScript use `new Date(modified * 1000)`).
	 */
	modified: number;
	/**
	 * For journals, the day the entry belongs to, as `"YYYY-MM-DD"`.
	 *
	 * `null` for normal documents.
	 */
	journal_date: string | null;
}

/**
 * What a document is for; stored as text.
 *
 * - `"normal"`: an ordinary document.
 * - `"journal"`: a daily journal entry; one per workspace per local day.
 */
export type DocumentType =
	| "normal"
	| "journal";

export interface DocumentationResponse {
	documentation: string;
}

/** Replaces the contents of live document `document_id` in a workspace. */
export interface EditDocumentRequest {
	workspace_id: number;
	document_id: number;
	contents: string;
}

/**
 * Replaces the contents of the journal for `date` (`"YYYY-MM-DD"`) in a
 * workspace, creating it if needed.
 */
export interface EditJournalRequest {
	workspace_id: number;
	date: string;
	content: string;
}

/** Replaces the description of task `task_id` in a workspace; `""` clears it. */
export interface EditTaskDescriptionRequest {
	workspace_id: number;
	task_id: number;
	description: string;
}

/**
 * A model an intelligence endpoint offers, one of the models every picker
 * lists. A row the models.dev catalog lists links its catalog row and reads
 * through that link whatever it does not set itself, so catalog prices
 * never drift; a value set on the row overrides the catalog's. Every read
 * joins the catalog, so the fields here are the model's either way. Prices
 * are USD per million tokens; a model without input and output prices
 * records no cost.
 */
export interface EndpointModel {
	/** Unique, stable identifier. */
	id: number;
	/** The endpoint that serves the model. */
	endpoint_id: number;
	/** The model's identifier on that endpoint, such as `claude-opus-5-5`. */
	model_identifier: string;
	/** The model's display name, such as `Claude Opus 5.5`. */
	model_name: string;
	/** The catalog row the model was imported from, if any. */
	catalog_model_id: number | null;
	/** How many tokens the model's context window holds. */
	context_size: number | null;
	input_token_cost: number | null;
	output_token_cost: number | null;
	cache_read_token_cost: number | null;
	cache_write_token_cost: number | null;
	/**
	 * Past this many prompt tokens a request is billed at the large-context
	 * prices.
	 */
	large_context_threshold: number | null;
	large_context_input_token_cost: number | null;
	large_context_output_token_cost: number | null;
	large_context_cache_read_token_cost: number | null;
	large_context_cache_write_token_cost: number | null;
}

/** The kind of failure, for clients that branch on it. */
export type ErrorCode =
	| "badRequest"
	| "validationFailed"
	| "internalError"
	| "upstreamError"
	| "notFound"
	| "unauthorized";

/** What an extension's `serviceRequest` returned; `null` for `undefined`. */
export interface ExtensionCallResult {
	result: unknown;
}

export interface ExtensionHook {
	id: number;
	extension_id: number;
	hook: HookKind;
	enabled: boolean;
}

/**
 * What an extension's global `manifest()` function returns. The daemon
 * reads it at install time, in a sandbox with no globals but entity classes
 * and enums.
 */
export interface ExtensionManifest {
	/**
	 * Stable, unique key for the extension, such as
	 * `"com.example.done-stamp"`. Installing a file with an identifier that
	 * already exists replaces that extension.
	 */
	identifier: string;
	/** Display name. */
	name: string;
	/**
	 * A whole number, raised with each release: a registry listing a
	 * higher one offers it as an update, and for an `oauth` extension it
	 * is also its connector definition's version.
	 */
	version: number;
	/** What the extension does, in a sentence or two. */
	description: string | null;
	/** Who wrote the extension. */
	author: string | null;
	/**
	 * The extension's icon: a `data:image/…` URL embedded in the script, or
	 * an `https://` URL. Aim for about 100×100 px; a PNG or a small SVG is
	 * plenty. At most 64 KB. Anything else is dropped without an error, and
	 * the extension's initial is shown instead.
	 */
	icon: string | null;
	/** What the extension may do. An unknown permission rejects the install. */
	permissions: ExtensionPermissionKind[];
	/**
	 * The events the daemon calls the extension for. An unknown hook
	 * rejects the install.
	 */
	hooks: HookKind[];
	/**
	 * The functions the extension serves at `serviceRequest`, for a
	 * manifest that lists `service` or `service:isolated`. Once declared,
	 * a call to any other name is refused.
	 */
	service: ServiceManifest | null;
}

export interface ExtensionPermission {
	id: number;
	extension_id: number;
	permission: ExtensionPermissionKind;
	enabled: boolean;
}

/**
 * A permission an extension's manifest lists. `cohesion:read` grants the
 * `cohesion` global read-only: any write throws. `cohesion:write` grants it
 * with writes, and makes the entities hooks receive writable too. `network`
 * grants the `network` global and `timer` the `timer` global. `registry`
 * grants no global: it lets the daemon call the extension's globals
 * `registryResults(query: string)`, which returns `RegistryResult[]`
 * (`{ manifest, sourceURL }`) listing extensions it offers, and
 * `registryLookup(identifiers: string[])`, which returns a `RegistryResult`
 * for each of those identifiers it offers and leaves the rest out; a
 * registry must define both. `oauth` lets the
 * daemon call the extension's sign-in functions (`serviceDescription`,
 * `authenticationURL`, `completeAuthentication`, `completeRefresh` and
 * `getAccountDescription`) so the user can add accounts at a service, and
 * the optional `accountRemoved(account: AccountDescription)` once one is
 * removed. It also grants the `accounts` global, which lists those
 * accounts with their credentials. `connector` lets the daemon call `getOrganizationUnits`,
 * `listResources` and `getResource` to import an account's items as resources; a
 * manifest that lists `connector` must list `oauth` too. `service` grants
 * no global: it makes the extension a service clients call, through the
 * `callExtension` command, at its global
 * `serviceRequest(name: string, args: unknown)`, receiving what it returns;
 * with a `service` block in the manifest, agents, scripts and extensions
 * granted `services` can call it too. `service:isolated` is `service` for
 * clients only: it never reaches `services`. A manifest lists one or the
 * other, never both. `services` grants the `services` global, through
 * which the extension calls other installed services. `usage` grants the
 * `usage` global: how many tokens Cohesion's models used and what they
 * cost. `intelligence` grants the `intelligence` global and lets the
 * extension change intelligence settings (endpoints and their models),
 * which `cohesion:write` does not. `notifications` grants the
 * `notifications` global, which sends the user a notification.
 */
export type ExtensionPermissionKind =
	| "cohesion:read"
	| "cohesion:write"
	| "network"
	| "timer"
	| "registry"
	| "oauth"
	| "connector"
	| "service"
	| "service:isolated"
	| "services"
	| "usage"
	| "intelligence"
	| "notifications"
	| "actors";

/**
 * An extension script as downloaded or given, for review before installing it with
 * `registerExtension`.
 */
export interface ExtensionPreview {
	script: string;
	/** The manifest the script itself declares. */
	manifest: ExtensionManifest;
	/**
	 * The installed extension with the same identifier, which installing
	 * this script replaces.
	 */
	installed: ExtensionSummary | null;
}

/** An installed extension without its script. */
export interface ExtensionSummary {
	id: number;
	name: string;
	version: number;
	script_identifier: string;
	description: string;
	author: string;
	/** A `data:image/…` or `https://` URL. */
	icon: string | null;
	/** Hook evaluation order: lower runs first, ties by `id`. */
	priority: number;
}

/**
 * A registry's entry for an installed extension at a higher version than
 * the installed one.
 */
export interface ExtensionUpdate {
	/** The installed extension's id. */
	extension_id: number;
	/** The id of the registry extension that offers it. */
	registry_extension_id: number;
	result: RegistryResult;
}

/**
 * An RSS or Atom feed, followed once for every workspace. Each refresh
 * adds the items it hasn't seen as articles in no workspace, which make up
 * the feed corpus until one is saved to a workspace; nothing a refresh no
 * longer sees is removed.
 */
export interface Feed {
	/** Unique, stable identifier. */
	id: number;
	/**
	 * Whether the feed has been deleted. Listings skip deleted feeds, so
	 * this is normally `false`.
	 */
	deleted: boolean;
	/** The feed's address; unique among the live feeds. */
	url: string;
	/** Display name: the feed's own title when it was added, until renamed. */
	title: string;
	/** Where the feed sits among the feeds; lower comes first. */
	sort_order: number;
	/** When an item's page is fetched rather than read from the feed. */
	full_page_policy: FeedFullPagePolicy;
	/** What reads an item's page, when it is fetched. */
	parser: ArticleParser;
	/** How the last refresh went. */
	status: FeedStatus;
	/** When the feed was added, in Unix seconds. */
	created_at: number;
}

/** What cleaning up feeds removed. */
export interface FeedCleanup {
	/** How many unsaved items were removed. */
	removed: number;
}

/**
 * An article from a feed matching a corpus search, with the passage that
 * matched. Read only by the corpus search, which joins each match as `hit`.
 */
export interface FeedCorpusHit {
	id: number;
	feed_id: number | null;
	read: boolean;
	/** Every workspace it is saved to; empty when none has saved it. */
	workspace_ids: ArticleWorkspaces;
	url: string;
	title: string;
	author: string | null;
	/** In Unix seconds. */
	published_at: number;
	published_precision: PublishedPrecision;
	/** A few words of the article around the match, in Markdown. */
	excerpt: string;
}

/**
 * One page of a corpus search: its matches, and how many the whole search
 * has.
 */
export interface FeedCorpusPage {
	hits: FeedCorpusHit[];
	/** Every match, on any page. */
	total: number;
}

/**
 * When an item's text comes from its page rather than from the feed.
 *
 * - `"whenExcerpt"`: only when the feed carries an excerpt, not the whole
 *   article (the default).
 * - `"always"`: every item's page is fetched.
 */
export type FeedFullPagePolicy =
	| "whenExcerpt"
	| "always";

/** How a feed was last refreshed; stored as JSON text. */
export type FeedStatus =
	| {
	state: "refreshed";
	/** When it was read, in Unix seconds. */
	at: number;
	/** How many items were new. */
	added: number;
}
	| {
	state: "failed";
	/** Why it couldn't. */
	failure: ArticleFetchFailure;
	/** When it was attempted, in Unix seconds. */
	at: number;
};

/** A feed as the feed list shows it, with how many of its items are unread. */
export interface FeedSummary {
	id: number;
	deleted: boolean;
	url: string;
	title: string;
	sort_order: number;
	full_page_policy: FeedFullPagePolicy;
	parser: ArticleParser;
	status: FeedStatus;
	/** In Unix seconds. */
	created_at: number;
	/**
	 * How many of its live items haven't been read, saved to a workspace
	 * or not.
	 */
	unread: number;
}

/** Forgets memory `memory_id`. */
export interface ForgetMemoryRequest {
	memory_id: number;
}

/** Fetches actor task `id`. */
export interface GetActorTaskRequest {
	id: number;
}

/** Fetches agent message `message_id`. */
export interface GetAgentMessageRequest {
	message_id: number;
}

/**
 * Fetches live article `article_id` as workspace `workspace_id` sees it:
 * whole, with where it is saved and its folder there. Fetching it doesn't
 * mark it read.
 */
export interface GetArticleRequest {
	workspace_id: number;
	article_id: number;
}

/** Fetches live document `document_id` in a workspace. */
export interface GetDocumentRequest {
	workspace_id: number;
	document_id: number;
}

/** Fetches agent `agent_id`. */
export interface GetIntelligenceAgentRequest {
	agent_id: number;
}

/** Fetches intelligence thread `thread_id` with its messages. */
export interface GetIntelligenceThreadRequest {
	thread_id: number;
}

/**
 * Fetches the journal for `date` (`"YYYY-MM-DD"`) in a workspace, or `None`
 * if nothing has been written that day. Never creates one.
 */
export interface GetJournalRequest {
	workspace_id: number;
	date: string;
}

/** Fetches resource `resource_id` in workspace `workspace_id`. */
export interface GetResourceRequest {
	workspace_id: number;
	resource_id: number;
}

/**
 * An event the daemon calls scripts for: extensions that list it in their
 * manifest's `hooks`, and agents with a cue on it. `launch` calls
 * `onLaunch()`; `task:create` calls `onTaskCreate(task)`, `task:status`
 * `onTaskStatus(task)`, and so on for each `task:*`, `taskfolder:*` and
 * `workspace:*` kind with its entity (`task:tagged` when a tag is put on or
 * taken off a task, `task:delete` with the task as it was deleted);
 * `journal:settled` calls `onJournalSettled(document)` two minutes after a
 * journal's last save, and `document:settled` `onDocumentSettled(document)`
 * the same for any other document;
 * `resource:import` calls `onResourceImport(resource)` when a resource is imported,
 * `resource:update` calls `onResourceUpdate(resource)` when a refresh changes one
 * and `resource:delete` `onResourceDelete(resource)` with one as it was removed;
 * `feed:article` calls `onFeedArticle(article)` for each new article a feed
 * refresh brings in, `feed:delete` `onFeedDelete(feed)` with a feed as it was
 * unfollowed, `article:save` `onArticleSave(article)` when an article is saved
 * to a workspace, `article:read` `onArticleRead(article)` when one goes from
 * unread to read and `article:tagged` `onArticleTagged(article)` when a tag is
 * put on or taken off one;
 * `agent:message` calls `onAgentMessage(message)` when a message lands in an
 * agent's conversation and `agent:reaction` calls `onAgentReaction(message)`
 * when the user or the agent reacts to one; `activity:started` calls
 * `onActivityStarted(activity)` when an activity starts,
 * `activity:updated` `onActivityUpdated(activity)` when its progress or
 * status changes and `activity:ended` `onActivityEnded(activity)` when it
 * ends; `actor:moved` calls `onActorMoved(task)` when an actor task's
 * status changes; `agent:turn:start` calls
 * `onAgentTurnStart(agent)` when an agent starts answering the user and
 * `agent:turn:end` `onAgentTurnEnd(agent)` when it finishes; `day:start` calls `onDayStart()` at 6:00 and
 * `day:end` calls `onDayEnd()` at 23:00, and `hour:start` calls
 * `onHourStart(hour)` at the top of every hour, in the daemon's local time;
 * `extension:update` calls `onExtensionUpdate(update)` once for each
 * version a registry offers an installed extension at, across restarts;
 * `notification:send` calls `onNotification(notification)` when a script or
 * an agent sends the user a notification, for an extension to push to
 * their devices.
 */
export type HookKind =
	| "launch"
	| "task:create"
	| "task:status"
	| "task:rename"
	| "task:move"
	| "task:priority"
	| "task:description"
	| "task:startdate"
	| "task:duedate"
	| "task:tagged"
	| "task:delete"
	| "taskfolder:create"
	| "taskfolder:delete"
	| "workspace:create"
	| "workspace:delete"
	| "journal:settled"
	| "document:settled"
	| "resource:import"
	| "resource:update"
	| "resource:delete"
	| "feed:article"
	| "feed:delete"
	| "article:save"
	| "article:read"
	| "article:tagged"
	| "agent:message"
	| "agent:reaction"
	| "agent:turn:start"
	| "agent:turn:end"
	| "activity:started"
	| "activity:updated"
	| "activity:ended"
	| "actor:moved"
	| "day:start"
	| "day:end"
	| "hour:start"
	| "extension:update"
	| "notification:send";

/** When a hook fires, as clauses that finish "When …". */
export interface HookWording {
	kind: HookKind;
	/** As an extension's hook. */
	extension_clause: string;
	/** As an agent's cue or run; an agent never hears its own conversation. */
	cue_clause: string;
}

/**
 * An image to attach to a message to an agent or in an actor task: PNG,
 * JPEG, GIF or WebP, at most 5 MB once base64-encoded.
 */
export interface ImageUpload {
	/** `image/png`, `image/jpeg`, `image/gif` or `image/webp`. */
	media_type: string;
	/** The image, base64-encoded. */
	data: string;
}

/**
 * Imports item `identifier` of connector account `account_id` into
 * workspace `workspace_id`, or refreshes it if it is already there.
 */
export interface ImportResourceRequest {
	account_id: number;
	workspace_id: number;
	identifier: string;
}

/** One item a connector account offers for import. */
export interface ImportableResource {
	identifier: string;
	title: string;
	/** When the item last changed, in Unix seconds. */
	last_updated: number;
	/** Whether the item is already a resource in the workspace. */
	imported: boolean;
}

/**
 * A persistent assistant that keeps its context over time and can wake
 * itself on a hook.
 */
export interface IntelligenceAgent {
	id: number;
	/** When the agent was created, in Unix seconds. */
	created_at: number;
	/** The agent's name, chosen by the user. */
	agent_name: string;
	/** The color the agent is drawn in. */
	agent_color: IntelligenceAgentColor;
	/** An emoji shown in place of the name's initial; none when unset. */
	agent_emoji: string | null;
	/** The manner the agent speaks in. */
	agent_personality: IntelligenceAgentPersonality;
	/** How much the agent says. */
	agent_verbosity: IntelligenceAgentVerbosity;
	/** What the user wants from the agent, in a few words; `""` when unset. */
	agent_role: string;
	/** The rules the user gave the agent to always follow; `""` when unset. */
	agent_directive: string;
	/**
	 * What the agent is doing while it works, such as `"Thinking"` or the
	 * title of the script it is running; `null` when it is not working.
	 */
	activity: string | null;
	/**
	 * Whether the agent has posted since the user last read its
	 * conversation.
	 */
	agent_unread: boolean;
	/**
	 * When the latest message in the agent's conversation was sent, in Unix
	 * seconds, not counting code runs, documentation lookups or memory
	 * changes; `null` before the first.
	 */
	last_message_at: number | null;
	/** Whether the agent is pinned, ahead of the others. */
	pinned: boolean;
	/**
	 * Where the agent sits among the pinned agents; lower comes first.
	 *
	 * Unpinned agents go by their latest message instead.
	 */
	sort_order: number;
}

/** An image the user attached to a message to an agent. */
export interface IntelligenceAgentAttachment {
	id: number;
	message_id: number;
	/** `image/png`, `image/jpeg`, `image/gif` or `image/webp`. */
	media_type: string;
	/** The image, base64-encoded. */
	data: string;
}

/** The color an agent is drawn in. */
export type IntelligenceAgentColor =
	| "blue"
	| "green"
	| "orange"
	| "purple"
	| "red"
	| "pink"
	| "teal"
	| "yellow";

/**
 * A hook an agent watches to wake itself, in the background or, once, in
 * its conversation.
 *
 * An agent can have several, each with its own name.
 */
export interface IntelligenceAgentCue {
	id: number;
	agent_id: number;
	/**
	 * What the agent calls the cue, unique among its cues; setting a cue
	 * with the same name replaces it.
	 */
	name: string;
	/** The hook that runs the cue. */
	hook: HookKind;
	/**
	 * A function expression called with the hook's subject; a truthy return
	 * wakes the agent.
	 */
	script: string;
	/** What the agent told itself to do when it wakes. */
	instructions: string;
	/**
	 * How capable a model each background run gets, or `foreground` for a
	 * cue that wakes the agent's conversation once.
	 */
	effort: AgentCueEffort;
}

/** A grant an agent holds; an agent holds each kind at most once. */
export interface IntelligenceAgentGrant {
	id: number;
	agent_id: number;
	kind: IntelligenceAgentGrantKind;
}

/**
 * A right an agent's background runs hold beyond what every run has:
 * reading the user's data, its own `storage`, connectors, services and
 * notifications. `network` mounts the `network` global; `cohesion:write`
 * makes `cohesion` writable, so a run can change the user's data without
 * proposing it. A foreground turn is not limited by grants.
 */
export type IntelligenceAgentGrantKind =
	| "network"
	| "cohesion:write";

/** One entry in an agent's conversation. */
export interface IntelligenceAgentMessage {
	id: number;
	agent_id: number;
	/** The background run that sent it, if any. */
	run_id: number | null;
	/**
	 * What woke the background run that sent this, e.g. `"Test task" was
	 * created`; `null` for foreground messages.
	 */
	run_description: string | null;
	sent_at: number;
	sender: IntelligenceAgentMessageSender;
	/** What it says, stored as JSON. */
	message_content: AgentMessageContent;
	/**
	 * An emoji reacting to the message, from the side that didn't send it:
	 * the user on the agent's messages, the agent on the user's.
	 */
	reaction: string | null;
	/** When `reaction` was last set or cleared. */
	reacted_at: number | null;
	/**
	 * How many images the user attached; `ListAgentMessageAttachments`
	 * fetches them.
	 */
	attachment_count: number;
}

/**
 * Who sent an agent message.
 *
 * - `"user"`: the user.
 * - `"agent"`: the agent, in its foreground chat.
 * - `"backgroundAgent"`: the agent while running in the background; only
 *   its notes and proposals land here, the run's transcript stays in its
 *   thread.
 */
export type IntelligenceAgentMessageSender =
	| "user"
	| "agent"
	| "backgroundAgent";

/**
 * The manner an agent speaks in.
 *
 * - `"balanced"`: plain and even, like a helpful co-worker.
 * - `"friendly"`: warm and encouraging.
 * - `"professional"`: formal and neutral.
 * - `"candid"`: blunt; says when something looks wrong and pushes back.
 * - `"playful"`: light and humorous.
 */
export type IntelligenceAgentPersonality =
	| "balanced"
	| "friendly"
	| "professional"
	| "candid"
	| "playful";

/** One background session an agent's cue started. */
export interface IntelligenceAgentRun {
	id: number;
	agent_id: number;
	/** The intelligence thread of the session, once it has one. */
	thread_id: number | null;
	/** The hook that fired. */
	hook: HookKind;
	/**
	 * The name of the cue that started the run; `null` for runs from before
	 * agents had several cues.
	 */
	cue_name: string | null;
	started_at: number;
	/** When the run finished; `null` while it is running. */
	ended_at: number | null;
	outcome: IntelligenceAgentRunOutcome;
	/** Why the run failed, when it did. */
	error: string | null;
	/**
	 * Prompt tokens across the run that were neither read from nor written
	 * to the cache.
	 */
	input_tokens: number;
	output_tokens: number;
	cache_read_tokens: number;
	cache_write_tokens: number;
	/** What the run cost; `null` when nothing was priced. */
	cost: number | null;
}

/**
 * How a background or detached run ended.
 *
 * - `"running"`: still going.
 * - `"completed"`: finished normally.
 * - `"failed"`: stopped on an error.
 */
export type IntelligenceAgentRunOutcome =
	| "running"
	| "completed"
	| "failed";

/**
 * How much an agent says, from least to most.
 *
 * - `"terse"`: as few words as will do.
 * - `"brief"`: short messages, detail only when asked.
 * - `"detailed"`: explains its reasoning and what it found.
 * - `"thorough"`: full context, options and caveats.
 */
export type IntelligenceAgentVerbosity =
	| "terse"
	| "brief"
	| "detailed"
	| "thorough";

/** A record of what one model invocation cost. */
export interface IntelligenceCostEvent {
	id: number;
	created_at: number;
	/**
	 * The thread the invocation answered; `None` for events recorded before
	 * threads were linked.
	 */
	thread_id: number | null;
	provider_identifier: string;
	model_identifier: string;
	input_tokens: number;
	output_tokens: number;
	cache_read_tokens: number;
	cache_write_tokens: number;
	/** What the invocation cost in all, in USD. */
	total_cost: number;
	/**
	 * What each kind of token cost of the total; `None` when the provider
	 * reported only the total.
	 */
	input_cost: number | null;
	output_cost: number | null;
	cache_read_cost: number | null;
	cache_write_cost: number | null;
}

export interface IntelligenceDefault {
	id: number;
	/** The tier of the intelligence. */
	tier: IntelligenceTier;
	/** The endpoint model the tier uses. Removing that model unsets the tier. */
	endpoint_model_id: number;
}

/**
 * A known provider to create an endpoint for, or a custom endpoint
 * described by hand. On the wire this is `{"preset": "openAi"}` or
 * `{"preset": "custom", "provider_identifier": …, "dialect": …,
 * "base_url": …}`.
 */
export type IntelligenceEndpointPreset =
	| {
	preset: "custom";
	provider_identifier: string;
	dialect: Dialect;
	base_url: string;
}
	| {
	preset: IntelligenceProvider;
};

/**
 * A provider with a built-in endpoint preset. Adding one takes a variant
 * here and its arm in [`IntelligenceProvider::defaults`]; the wire format
 * and the CLI pick it up from there.
 *
 * JSON uses the camelCase name (`openAi`); the CLI uses the lowercase text
 * (`openai`).
 */
export type IntelligenceProvider =
	| "openAi"
	| "anthropic"
	| "xai"
	| "mistral"
	| "fireworks"
	| "deepInfra"
	| "togetherAI"
	| "openRouter";

export interface IntelligenceThread {
	id: number;
	created_at: number;
	search_eligible: boolean;
	/** Started by an agent; false only for threads left from Ask, which is gone. */
	agent_thread: boolean;
	system_prompt: string;
	remote_id: string | null;
	remote_cursor: number | null;
}

/** An intelligence thread and its messages, oldest first. */
export interface IntelligenceThreadDetail {
	thread: IntelligenceThread;
	messages: IntelligenceThreadMessage[];
	/** What each model call in the thread cost, oldest first. */
	cost_events: IntelligenceCostEvent[];
}

export interface IntelligenceThreadMessage {
	id: number;
	thread_id: number;
	created_at: number;
	description: string;
	kind: IntelligenceThreadMessageKind;
	payload: string;
}

export type IntelligenceThreadMessageKind =
	| "UserMessage"
	| "AssistantMessage"
	| "Thinking"
	| "ToolCallRequest"
	| "ToolCallResponse";

/**
 * Which default model a session uses.
 *
 * - `"agent"`: every agent conversation, and scripts that name no tier.
 * - `"low"`, `"medium"`, `"high"`: background runs, by the effort their
 *   cue asked for.
 */
export type IntelligenceTier =
	| "agent"
	| "low"
	| "medium"
	| "high";

export type Invalidation =
	| { kind: "workspace"; id: number }
	| { kind: "intelligenceCostEvents" }
	| { kind: "agent"; id: number }
	| { kind: "taskFolders"; id: number }
	| { kind: "documents"; id: number }
	| { kind: "taskList"; id: {
	workspace_id: number;
	folder_id: number | null;
} }
	| { kind: "connectorAccounts" }
	| { kind: "resources"; id: number }
	| { kind: "resourceKinds"; id: number }
	| { kind: "articles"; id: number }
	| { kind: "articleFolders"; id: number }
	| { kind: "feeds" }
	| { kind: "feedArticles" }
	| { kind: "intelligence" }
	| { kind: "clients" }
	| { kind: "tags"; id: number }
	| { kind: "extensionUpdates" }
	| { kind: "memories" }
	| { kind: "activities" }
	| { kind: "actors" }
	| { kind: "actorTasks" }
	| { kind: "actorTask"; id: number }
	| { kind: "notification"; id: {
	title: string;
	message: string;
} };

export interface InvalidationBatch {
	keys: Invalidation[];
}

/**
 * Lists the activities still running or waiting, then the `limit` that
 * ended most recently, newest first.
 */
export interface ListActivitiesRequest {
	limit: number;
}

/**
 * Lists the images attached to actor task message `message_id`, in the
 * order sent.
 */
export interface ListActorTaskMessageAttachmentsRequest {
	message_id: number;
}

/** Lists what was said in actor task `task_id`, oldest first. */
export interface ListActorTaskMessagesRequest {
	task_id: number;
}

/**
 * Lists actor tasks, most recently active first: actor `actor_id`'s, or
 * every actor's.
 */
export interface ListActorTasksRequest {
	actor_id?: number | null;
}

/** Lists agent `agent_id`'s cues, oldest first. */
export interface ListAgentCuesRequest {
	agent_id: number;
}

/** Lists the grants agent `agent_id`'s background runs hold. */
export interface ListAgentGrantsRequest {
	agent_id: number;
}

/** Lists the images attached to message `message_id`, in the order sent. */
export interface ListAgentMessageAttachmentsRequest {
	message_id: number;
}

/**
 * Pages through an agent's messages: the `limit` newest with an id below
 * `before` (the newest overall when absent), oldest first.
 */
export interface ListAgentMessagesRequest {
	agent_id: number;
	before?: number | null;
	limit: number;
}

/**
 * Lists agent `agent_id`'s `limit` most recent background runs, newest
 * first.
 */
export interface ListAgentRunsRequest {
	agent_id: number;
	limit: number;
}

/** Lists the live article folders in workspace `workspace_id`, in their order. */
export interface ListArticleFoldersRequest {
	workspace_id: number;
}

/**
 * Lists one page of the live articles `filter` covers, most recently
 * published first, without their contents. The inbox, `all` and folder
 * filters cover the articles saved to workspace `workspace_id`; the feed
 * filters cover feed items wherever they are saved.
 */
export interface ListArticlesRequest {
	workspace_id: number;
	/** The inbox when absent. */
	filter?: ArticleFilter;
	/** Only articles with this tag of the workspace's. */
	tag_id?: number | null;
	/** How many of the covered articles to skip; none when absent. */
	offset?: number;
	/** The most articles to list: 50 when absent, and never over 500. */
	limit?: number | null;
}

/**
 * Lists the catalog's models of provider `provider_identifier`, or of the
 * providers of configured endpoints when it is absent, whose identifier or
 * name contains `query`, if given.
 */
export interface ListCatalogModelsRequest {
	provider_identifier?: string | null;
	query?: string | null;
}

/** Lists the organization units of connector account `account_id`. */
export interface ListConnectorOrganizationUnitsRequest {
	account_id: number;
}

/** Lists the live documents in a workspace, most recently modified first. */
export interface ListDocumentsRequest {
	workspace_id: number;
	/** Only documents of this type; every type when absent. */
	document_type?: DocumentType | null;
	/** Only journals dated on or after this `"YYYY-MM-DD"`. */
	journal_from?: string | null;
	/** Only journals dated before this `"YYYY-MM-DD"`. */
	journal_to?: string | null;
}

/** Lists the models endpoint `endpoint_id` offers, by name. */
export interface ListEndpointModelsRequest {
	endpoint_id: number;
}

/** Lists the hooks recorded for extension `extension_id`. */
export interface ListExtensionHooksRequest {
	extension_id: number;
}

/** Lists the permissions recorded for extension `extension_id`. */
export interface ListExtensionPermissionsRequest {
	extension_id: number;
}

/** Lists the `limit` most recent intelligence cost events, newest first. */
export interface ListIntelligenceCostEventsRequest {
	limit: number;
}

/**
 * Lists the memories agent `agent_id` sees: its own and the global ones;
 * only the global ones when absent. Oldest first.
 */
export interface ListMemoriesRequest {
	agent_id?: number | null;
}

/**
 * Lists the resources in workspace `workspace_id` in `sort`'s order,
 * optionally only those of `kind` or whose title contains `search`.
 */
export interface ListResourcesRequest {
	workspace_id: number;
	kind?: string | null;
	search?: string | null;
	sort: ResourceSort;
	/** Reverses `sort`; resources without a value for it still come last. */
	descending: boolean;
}

/** Lists workspace `workspace_id`'s tags for `entity`, in their order. */
export interface ListTagsRequest {
	workspace_id: number;
	entity: TagEntity;
}

/** Lists task folders */
export interface ListTaskFoldersRequest {
	workspace_id: number;
}

/** Lists one page of the live tasks the filters cover, in `sort`'s order. */
export interface ListTasksRequest {
	ids?: number[] | null;
	/** Only tasks in this workspace; every workspace when absent. */
	workspace_id?: number | null;
	/** Every task when absent. */
	folder?: TaskFolderFilter;
	statuses?: TaskStatus[] | null;
	/** Only tasks with these priorities. */
	priorities?: TaskPriority[] | null;
	/** Only tasks whose start day matches. */
	start_date?: DayFilter | null;
	/** Only tasks whose due day matches. */
	due_date?: DayFilter | null;
	/** Only tasks with this tag. */
	tag_id?: number | null;
	/** Creation order when absent. */
	sort?: TaskSort;
	/** Reverses `sort`; tasks without a value for it still come last. */
	descending?: boolean;
	/** How many of the covered tasks to skip; none when absent. */
	offset?: number;
	/** The most tasks to list: 50 when absent, and never over 500. */
	limit?: number | null;
}

/** Lists the kinds of resource shown in workspace `workspace_id`. */
export interface ListWorkspaceResourceKindsRequest {
	workspace_id: number;
}

/**
 * A client as the clients list shows it. Presence is said here and only
 * here: a client's endpoint or account is reachable while the client it
 * names is online.
 */
export type ListedClient = {
	/** Whether the client has a session open with the daemon now. */
	online: boolean;
} & Client;

/**
 * Marks actor task `task_id` read; the next stretch of work its actor
 * finishes marks it unread again.
 */
export interface MarkActorTaskReadRequest {
	task_id: number;
}

/** Marks agent `agent_id`'s conversation read. */
export interface MarkAgentReadRequest {
	agent_id: number;
}

/**
 * Marks every unread live article `filter` covers as read, as listing it
 * with `workspace_id` would cover them: "mark all as read" for a view.
 */
export interface MarkArticlesReadRequest {
	workspace_id: number;
	/** The inbox when absent. */
	filter?: ArticleFilter;
	/** Only articles with this tag of the workspace's. */
	tag_id?: number | null;
}

/** A fact an agent keeps across conversations, in its own words. */
export interface Memory {
	id: number;
	/**
	 * The agent it belongs to; `null` for a global memory, which every
	 * agent sees.
	 */
	agent_id: number | null;
	created_at: number;
	memory: string;
}

/**
 * What a resource's metadata may say, as a connector fills it. Dates are
 * ISO 8601 in UTC with a `Z` suffix (`"2026-10-24T09:30:00Z"`), so they
 * sort as text; everything else is text as the service shows it.
 *
 * - `"dateCreated"`: when the item was created.
 * - `"dateModified"`: when the item's contents last changed.
 * - `"dateDue"`: when the item is due, for a task.
 * - `"dateStart"`: when an event starts.
 * - `"dateEnd"`: when an event ends.
 * - `"author"`: who wrote or owns the item.
 * - `"url"`: where the item opens at the service.
 * - `"location"`: where an event takes place, as the service shows it.
 * - `"folder"`: the folder, notebook or path holding the item, such as
 *   `"Work/Plans"`.
 * - `"category"`: the category, project or list the item is filed under.
 * - `"keywords"`: tags or labels, separated by commas.
 * - `"status"`: the item's state at the service, such as `"Done"`.
 */
export type MetadataKey =
	| "dateCreated"
	| "dateModified"
	| "dateDue"
	| "dateStart"
	| "dateEnd"
	| "author"
	| "url"
	| "location"
	| "folder"
	| "category"
	| "keywords"
	| "status";

/**
 * Moves every resource of connector account `from_account_id` to account
 * `to_account_id` of the same connector, in every workspace. Where both
 * hold the same item, the target's copy stays.
 */
export interface MigrateResourcesRequest {
	from_account_id: number;
	to_account_id: number;
}

/**
 * What a model costs, overriding the catalog, in USD per million tokens.
 * Cache tokens without their own price are billed as input.
 */
export interface ModelPrices {
	input_token_cost: number;
	output_token_cost: number;
	cache_read_token_cost?: number | null;
	cache_write_token_cost?: number | null;
}

/**
 * Files live article `article_id`, saved to workspace `workspace_id`, in
 * that workspace's folder `folder_id`, or its inbox when absent.
 */
export interface MoveArticleRequest {
	workspace_id: number;
	article_id: number;
	folder_id?: number | null;
}

/** Moves task `task_id` into folder `folder_id`, or the inbox when absent. */
export interface MoveTaskRequest {
	workspace_id: number;
	task_id: number;
	folder_id?: number | null;
}

/**
 * A part of an account that resources are grouped into, such as a team space
 * or a project, as `getOrganizationUnits(credential)` returns them.
 */
export interface OrganizationUnit {
	/** Identifies the unit to `listResources` as `organizationUnitId`. */
	id: string;
	/** The unit's name, shown to people. */
	display: string;
}

/** The setup code a new client pairs with. */
export interface PairingCode {
	/**
	 * A [`SetupCode`](crate::SetupCode), encoded: it works for one
	 * registration, for ten minutes.
	 */
	code: string;
}

/**
 * Downloads the extension script at `source_url` (`http` or `https`) and
 * reads its manifest, without installing it.
 */
export interface PreviewExtensionRequest {
	source_url: string;
}

/**
 * Reads the manifest of an extension `script` the client already has, such
 * as one from a file, without installing it.
 */
export interface PreviewExtensionScriptRequest {
	script: string;
}

/** A provider preset, and the catalog provider it reads models from. */
export interface ProviderWording {
	kind: IntelligenceProvider;
	label: string;
	provider_identifier: string;
}

/**
 * Removes the items of feeds `feed_ids` published before `before` (Unix
 * seconds) that no workspace has saved. A removed item isn't added again
 * when its feed is next read.
 */
export interface PruneFeedsRequest {
	feed_ids: number[];
	before: number;
}

/**
 * How precisely an article's publication is known.
 *
 * - `"time"`: the moment it was published, or saved when its page gives
 *   no date.
 * - `"day"`: only the day: `publishedAt` is that day's midnight UTC, to be
 *   shown as that date in every time zone.
 */
export type PublishedPrecision =
	| "time"
	| "day";

/** A connector account without its credential, safe to send to clients. */
export interface RedactedConnectorAccount {
	id: number;
	/** What serves the account. */
	host: AccountHost;
	/** The connector the account is one of: its name, icon, unit and kinds. */
	connector: Connector;
	/**
	 * What describes the account for people: its name or email, or the
	 * client's current name for a client's account.
	 */
	description: string;
	/** When the account was added, in Unix seconds. */
	created_at: number;
	/**
	 * Whether the account's items can be browsed and imported: its
	 * extension is granted `connector`, or it is a client's account. An
	 * orphaned account's can't.
	 */
	importable: boolean;
}

/** What serves an endpoint, without its API key. */
export type RedactedEndpointBackend =
	| {
	kind: "integrated";
	/** The models.dev provider, such as `"anthropic"`. */
	provider_identifier: string;
	dialect: Dialect;
	base_url: string;
}
	| {
	kind: "client";
	/** The client serving the endpoint. */
	client_id: number;
};

/** An intelligence endpoint without its API key, safe to send to clients. */
export interface RedactedIntelligenceEndpoint {
	id: number;
	/**
	 * What the endpoint is called; for a client's endpoint, the client's
	 * current name.
	 */
	name: string;
	/**
	 * What serves the endpoint; a client's is reachable while its client
	 * is online, as the clients list says.
	 */
	backend: RedactedEndpointBackend;
}

/** Reads live feed `feed_id` now, adding the items it hasn't seen. */
export interface RefreshFeedRequest {
	feed_id: number;
}

/** Refreshes every resource in workspace `workspace_id` from its service now. */
export interface RefreshResourcesRequest {
	workspace_id: number;
}

export interface RegisterExtensionRequest {
	script: string;
	allow_overwrite: boolean;
}

/**
 * One extension a registry offers, as its globals
 * `registryResults(query: string)` and
 * `registryLookup(identifiers: string[])` return them. The daemon installs from
 * the script at `sourceURL`, reading the manifest from that script; this
 * `manifest` is what the registry lists, shown before the user reviews it.
 */
export interface RegistryResult {
	/** The extension's manifest as the registry lists it. */
	manifest: ExtensionManifest;
	/** An `http` or `https` URL serving the extension's script. */
	source_url: string;
}

/** One registry's answer to a search. */
export interface RegistrySection {
	/** The registry extension's id. */
	extension_id: number;
	/** The registry extension's name. */
	name: string;
	results: RegistryResult[];
	/**
	 * Why this registry gave no results: it failed to load, threw, or
	 * returned something other than `RegistryResult[]`.
	 */
	error: string | null;
}

/**
 * Removes cue `cue_id`, so its hook no longer wakes the agent; an agent
 * left with no cues goes idle.
 */
export interface RemoveAgentCueRequest {
	cue_id: number;
}

/**
 * Removes endpoint model `id`, unsetting any tier that uses it. Refused for
 * a client's endpoint, whose models are the ones the client offers.
 */
export interface RemoveEndpointModelRequest {
	id: number;
}

/** Retitles article folder `folder_id`. */
export interface RenameArticleFolderRequest {
	workspace_id: number;
	folder_id: number;
	title: string;
}

/** Retitles live article `article_id`, in every workspace it is saved to. */
export interface RenameArticleRequest {
	article_id: number;
	title: string;
}

/** Renames client `id`. */
export interface RenameClientRequest {
	id: number;
	client_name: string;
}

/** Retitles live document `document_id` in a workspace. */
export interface RenameDocumentRequest {
	workspace_id: number;
	document_id: number;
	title: string;
}

/** Retitles live feed `feed_id`. */
export interface RenameFeedRequest {
	feed_id: number;
	title: string;
}

/** Renames tag `tag_id` of workspace `workspace_id`. */
export interface RenameTagRequest {
	workspace_id: number;
	tag_id: number;
	name: string;
}

/** Retitles task folder `folder_id` in a workspace. */
export interface RenameTaskFolderRequest {
	workspace_id: number;
	folder_id: number;
	title: string;
}

/** Retitles task `task_id` in a workspace. */
export interface RenameTaskRequest {
	workspace_id: number;
	task_id: number;
	title: string;
}

/** Retitles workspace `id`. */
export interface RenameWorkspaceRequest {
	id: number;
	title: string;
}

/**
 * Puts a workspace's article folders in the order of `folder_ids`, first to
 * last.
 */
export interface ReorderArticleFoldersRequest {
	workspace_id: number;
	/** Every live article folder in the workspace, in its new order. */
	folder_ids: number[];
}

/** Puts the feeds in the order of `feed_ids`, first to last. */
export interface ReorderFeedsRequest {
	/** Every live feed, in its new order. */
	feed_ids: number[];
}

/** Puts the pinned agents in the order of `agent_ids`, first to last. */
export interface ReorderIntelligenceAgentsRequest {
	/** Every pinned agent, in its new order. */
	agent_ids: number[];
}

/**
 * Puts workspace `workspace_id`'s tags for `entity` in the order of
 * `tag_ids`, first to last.
 */
export interface ReorderTagsRequest {
	workspace_id: number;
	entity: TagEntity;
	/** Every tag of that kind in the workspace, in its new order. */
	tag_ids: number[];
}

/** Puts a workspace's folders in the order of `folder_ids`, first to last. */
export interface ReorderTaskFoldersRequest {
	workspace_id: number;
	/** Every live folder in the workspace, in its new order. */
	folder_ids: number[];
}

/**
 * Puts the kinds shown in workspace `workspace_id` in the order of
 * `kind_ids`, first to last.
 */
export interface ReorderWorkspaceResourceKindsRequest {
	workspace_id: number;
	/** Every kind shown in the workspace, in its new order. */
	kind_ids: number[];
}

/** Fetches live article `article_id`'s page again and replaces its snapshot. */
export interface ResnapshotArticleRequest {
	article_id: number;
}

/**
 * A read-only copy of an item imported into a workspace from a connected
 * service. The daemon refreshes it from the service periodically; scripts
 * cannot change it.
 */
export interface Resource {
	/** Unique, stable identifier. */
	id: number;
	/** Id of the workspace this resource was imported into. */
	workspace_id: number;
	/** Id of the connector account the resource came from. */
	account_id: number;
	/** The item's identifier in the connected service. */
	identifier: string;
	/** Id of the kind of item this is, one its connector declares. */
	kind_id: number;
	/**
	 * What sort of item this is, as `"<connector identifier>.<kind>"`, for
	 * example `"com.example.notion.page"`. Filter on it with
	 * `workspace.resources({ kind })`.
	 */
	kind: string;
	/** Display name. */
	title: string;
	/** Whether `contents` is Markdown, plain text or JSON text. */
	content_kind: ResourceContentKind;
	/**
	 * The item's contents: Markdown or plain text, or JSON text to
	 * `JSON.parse`, depending on the content kind.
	 */
	contents: string;
	/**
	 * When the item last changed in the connected service, in Unix
	 * **seconds** (in JavaScript use `new Date(lastUpdated * 1000)`).
	 */
	last_updated: number;
	/** When this copy last changed in Cohesion, in Unix **seconds**. */
	modified: number;
}

/**
 * What a resource's `contents` hold; stored as text.
 *
 * - `"markdown"`: Markdown text, searchable like a document.
 * - `"text"`: plain text, searchable like a document.
 * - `"json"`: a JSON document as text; parse it with `JSON.parse`. Only the
 *   title is searchable.
 */
export type ResourceContentKind =
	| "markdown"
	| "text"
	| "json";

/**
 * A kind of item a connector imports, as its definition last declared it.
 * A definition that drops a kind removes it, and its resources with it.
 */
export interface ResourceKind {
	/** Unique, stable identifier. */
	id: number;
	/** Id of the connector that declares it. */
	connector_id: number;
	/**
	 * The short key, such as `"page"`; a resource's `kind` is its
	 * connector's identifier and this.
	 */
	identifier: string;
	/** The kind's name for people, such as `"Page"`. */
	title: string;
	/** The name for several, such as `"Pages"`. */
	plural: string;
	/** What a resource's `contents` holds. */
	contents: string;
}

/** What a refresh pass did. */
export interface ResourceRefreshSummary {
	/** Resources fetched from their services. */
	checked: number;
	/** Resources whose contents changed. */
	updated: number;
	/** Resources that couldn't be fetched. */
	failed: number;
}

/**
 * The order a resource listing comes back in. Ties fall back to the
 * newest import, and resources with no value for a metadata key come last
 * in either direction.
 *
 * - `"title"`: alphabetical, ignoring case.
 * - `"lastUpdated"`: when the item last changed in the connected service.
 * - a metadata key: that key's value, as text ignoring case, so dates sort
 *   by time.
 */
export type ResourceSort = 'title' | 'lastUpdated' | MetadataKey;

/**
 * Picks option `option` (an index into its `options`) of the choice in
 * message `message_id`, which the reply follows, and queues the agent's
 * turn on the pick; like a message's, the reply doesn't wait for it. The
 * pick posts no message; the choice records it.
 */
export interface RespondToAgentChoiceRequest {
	message_id: number;
	option: number;
}

/**
 * Approves (running its script) or denies the proposal in message
 * `message_id`.
 */
export interface RespondToAgentProposalRequest {
	message_id: number;
	approve: boolean;
}

/** Evaluates a script on the server. */
export interface RunScriptRequest {
	script: string;
}

/**
 * Fetches the page at `url` (http or https) and saves it to workspace
 * `workspace_id` with a snapshot of its text. A URL already saved there is
 * re-fetched instead of added again; a live article with that URL saved
 * elsewhere, or brought in by a feed, is saved there too and re-fetched;
 * otherwise a new, unread article is added.
 */
export interface SaveArticleRequest {
	workspace_id: number;
	url: string;
}

/** An article after its page was fetched. */
export interface SavedArticle {
	article: Article;
	/**
	 * Why this fetch failed, when it did. An article whose page was fetched
	 * before keeps that snapshot; one never fetched is saved with a failed
	 * snapshot.
	 */
	failure: ArticleFetchFailure | null;
}

/**
 * Sets both dates of task `task_id` in a workspace, each a `"YYYY-MM-DD"`
 * day; `null` clears one. Any other text is a validation error.
 */
export interface ScheduleTaskRequest {
	workspace_id: number;
	task_id: number;
	start_date: string | null;
	due_date: string | null;
}

/**
 * The JSON text of a script's completion value. A newtype so that other
 * string replies can have their own `ReplyData` variant.
 */
export type ScriptResult = string;

/**
 * Lists the items of kind `kind_id` connector account `account_id` offers
 * for import into workspace `workspace_id`, optionally narrowed to an
 * organization unit or a search.
 */
export interface SearchConnectorResourcesRequest {
	account_id: number;
	workspace_id: number;
	kind_id: number;
	organization_unit_id?: string | null;
	search?: string | null;
}

/** Lists the live documents in a workspace whose title contains `query`. */
export interface SearchDocumentRequest {
	workspace_id: number;
	query: string;
}

/**
 * What kind of item a search result points at: `"document"`, `"task"`,
 * `"resource"` or `"article"`.
 */
export type SearchEntityKind =
	| "document"
	| "task"
	| "resource"
	| "article";

/**
 * Asks every extension with the `registry` permission granted for the
 * extensions it offers matching `query` (`""` lists what it features).
 */
export interface SearchExtensionRegistriesRequest {
	query: string;
}

/**
 * One page of the full-text matches among the articles that came from
 * feeds, saved to a workspace or not, best first. `query` is FTS5 syntax.
 */
export interface SearchFeedCorpusRequest {
	query: string;
	/** Only articles from these feeds; every feed when absent. */
	feed_ids?: number[] | null;
	/** How many of the matches to skip; none when absent. */
	offset?: number;
	/** The most matches to list: 50 when absent, and never over 500. */
	limit?: number | null;
}

/**
 * One full-text search hit: a snapshot of the matched document's, task's,
 * resource's or article's indexed text, plus a pointer back to it.
 */
export interface SearchResult {
	/**
	 * Id of the search index entry.
	 *
	 * This is **not** the matched item's id; that is the entity id.
	 */
	id: number;
	/** Whether the hit is a document, a task, a resource or an article. */
	entity_kind: SearchEntityKind;
	/**
	 * Id of the matched document, task, resource or article (which one depends on
	 * the entity kind).
	 */
	entity_id: number;
	/** Id of the workspace the matched item belongs to. */
	workspace_id: number;
	/** The matched item's title. */
	title: string | null;
	/**
	 * The matched document's full contents, a Markdown resource's or an article's
	 * page text; always `""` for tasks and JSON resources.
	 */
	contents: string;
}

/** Search the entire workspace. */
export interface SearchWorkspaceRequest {
	workspace_id: number;
	query: string;
}

/**
 * Says `content` in actor task `task_id`, with any images in
 * `attachments`: more to do, which starts a task that is done or failed
 * again, or a response to one of its requests. Its client must be online.
 */
export interface SendActorTaskMessageRequest {
	task_id: number;
	content: ActorUserContent;
	attachments?: ImageUpload[] | null;
}

/**
 * Sends `message` to agent `agent_id` in its foreground chat, with any
 * images in `attachments`. `message` may be empty when there are images.
 * The message is saved before the reply, which comes at once; the agent's
 * turn on it is queued behind any it is running. What the turn posts
 * arrives with the agent's invalidations, and the agent has an `activity`
 * until it ends.
 */
export interface SendAgentMessageRequest {
	agent_id: number;
	message: string;
	attachments?: ImageUpload[] | null;
}

/** Why a command failed; `field` names the offending input when there is one. */
export interface ServerError {
	code: ErrorCode;
	message: string;
	field?: string | null;
}

/** One function of a [`ServiceManifest`]. */
export interface ServiceFunctionManifest {
	/** What the function does, and what its arguments mean. */
	description: string | null;
	/**
	 * The TypeScript type of the function's one argument, such as
	 * `"{ by?: number }"`. Leave it out for a function that takes none.
	 */
	args: string | null;
	/**
	 * The TypeScript type of what it returns, such as
	 * `"{ count: number }"`. Leave it out for `unknown`.
	 */
	returns: string | null;
	/**
	 * Whether the function only reads, changing nothing, so background
	 * agents may call it. Defaults to `false`.
	 */
	read_only: boolean | null;
}

/**
 * The `service` block of an [`ExtensionManifest`]. Scripts reach the
 * service by the extension's identifier, as
 * `services.use("<identifier>")`.
 */
export interface ServiceManifest {
	/** What the service offers, in a sentence or two. */
	description: string | null;
	/** The functions, by name; each name is a JavaScript identifier. */
	functions: Record<string, ServiceFunctionManifest>;
}

/**
 * Switches actor task `task_id` to mode `mode`, one its actor offers, from
 * its next step on, even while it works. Its client must be online.
 */
export interface SetActorTaskModeRequest {
	task_id: number;
	mode: string;
}

/**
 * Grants agent `agent_id`'s background runs `kind`, or revokes it when
 * `granted` is false. Returns the grants the agent then holds.
 */
export interface SetAgentGrantRequest {
	agent_id: number;
	kind: IntelligenceAgentGrantKind;
	granted: boolean;
}

/**
 * Reacts to message `message_id`, one the agent sent, with a single emoji
 * (clients offer those in `AGENT_REACTIONS`); a blank or absent `reaction`
 * clears it. A reaction queues the agent's turn on it, which may post
 * nothing; like a message's, the reply doesn't wait for it.
 */
export interface SetAgentMessageReactionRequest {
	message_id: number;
	reaction?: string | null;
}

/**
 * Pins or unpins agent `agent_id`; a newly pinned agent goes after the
 * other pinned agents.
 */
export interface SetAgentPinnedRequest {
	agent_id: number;
	pinned: boolean;
}

/**
 * Marks live article `article_id` read or unread. Read is one flag every
 * workspace shares.
 */
export interface SetArticleReadRequest {
	article_id: number;
	read: boolean;
}

/**
 * Saves live article `article_id` to workspace `workspace_id`, or unsaves it
 * from there. An article is saved to any number of workspaces at once.
 *
 * `saved: true` files it in the workspace's inbox; one already saved there
 * stays where it is filed. A workspace has one live article per URL, so
 * saving a feed item whose URL another article saved there has throws.
 *
 * `saved: false` takes it out of the workspace and its folder there. An
 * article from a feed stays in the feed corpus; one saved by hand that is
 * then in no workspace is deleted, which is how such an article is deleted.
 * One not saved there stays as it is.
 */
export interface SetArticleSavedRequest {
	workspace_id: number;
	article_id: number;
	saved: boolean;
}

/**
 * Enables or disables `hook` for extension `extension_id`. The extension's
 * running sandbox is discarded, and enabling `launch` calls `onLaunch`.
 */
export interface SetExtensionHookRequest {
	extension_id: number;
	hook: HookKind;
	enabled: boolean;
}

/**
 * Enables or disables `permission` for extension `extension_id`. The
 * extension's running sandbox is discarded, so the change applies at once.
 */
export interface SetExtensionPermissionRequest {
	extension_id: number;
	permission: ExtensionPermissionKind;
	enabled: boolean;
}

/**
 * Sets when live feed `feed_id`'s items are read from their pages. Items
 * already added keep their text.
 */
export interface SetFeedFullPagePolicyRequest {
	feed_id: number;
	full_page_policy: FeedFullPagePolicy;
}

/**
 * Sets what reads live feed `feed_id`'s items' pages. Items already added
 * keep their text.
 */
export interface SetFeedParserRequest {
	feed_id: number;
	parser: ArticleParser;
}

/** Makes endpoint model `endpoint_model_id` the default for `tier`. */
export interface SetIntelligenceDefaultRequest {
	tier: IntelligenceTier;
	endpoint_model_id: number;
}

/** Shows kind `kind_id` in workspace `workspace_id`, or hides it there. */
export interface SetResourceKindShownRequest {
	workspace_id: number;
	kind_id: number;
	shown: boolean;
}

/**
 * Puts tag `tag_id` of workspace `workspace_id` on the task or article
 * `entity_id`, or takes it off. A task tag goes on the workspace's tasks,
 * an article tag on the articles saved to it.
 */
export interface SetTaggedRequest {
	workspace_id: number;
	tag_id: number;
	entity_id: number;
	tagged: boolean;
}

/** Sets the priority of task `task_id` in a workspace. */
export interface SetTaskPriorityRequest {
	workspace_id: number;
	task_id: number;
	priority: TaskPriority;
}

/** Sets workspace `id`'s emoji, or clears it when `emoji` is absent. */
export interface SetWorkspaceEmojiRequest {
	id: number;
	emoji?: string | null;
}

/**
 * Hands actor `actor_id` a new task, `prompt`, with any images in
 * `attachments`, in the mode, on the model and at the effort given (the
 * actor's defaults when left out), titled by the prompt's first line. Its
 * client must be online.
 */
export interface StartActorTaskRequest {
	actor_id: number;
	prompt: string;
	mode?: string | null;
	model?: string | null;
	effort?: string | null;
	attachments?: ImageUpload[] | null;
}

/**
 * Stops what actor task `task_id` is doing, telling its actor when its
 * client is online; the task is idle, until the user says more.
 */
export interface StopActorTaskRequest {
	task_id: number;
}

/**
 * A name a workspace puts on its tasks, or on the articles saved to it, to
 * group them across folders.
 */
export interface Tag {
	/** Unique, stable identifier. */
	id: number;
	/** Id of the workspace the tag belongs to. */
	workspace_id: number;
	/** What the tag is put on. */
	entity: TagEntity;
	/** Unique, ignoring case, among the workspace's tags of its kind. */
	name: string;
	/** Position among the workspace's tags of its kind, first to last. */
	sort_order: number;
	/** In Unix seconds. */
	created_at: number;
}

/**
 * What a tag is put on; stored as text.
 *
 * Each kind has its own tags in a workspace.
 *
 * - `"task"`: tasks.
 * - `"article"`: articles saved to the tag's workspace.
 */
export type TagEntity =
	| "task"
	| "article";

/** The ids of the tags on an item; read from a JSON array. */
export type TagIds = number[];

/** The item a tag was put on or taken off, as its listing shows it. */
export type TaggedItem =
	| {
	entity: "task";
	task: Task;
}
	| {
	entity: "article";
	article: ArticleSummary;
};

/** A to-do item in a workspace, optionally filed in a task folder. */
export interface Task {
	/** Unique, stable identifier. */
	id: number;
	/** Id of the workspace this task belongs to. */
	workspace_id: number;
	/**
	 * Id of the task folder this task is filed in, or `null` when it is not
	 * in a folder.
	 */
	task_folder_id: number | null;
	/** What the task is. */
	title: string;
	/**
	 * Notes on the task, as Markdown; `""` when it has none.
	 *
	 * Searched along with the title.
	 */
	description: string;
	/** Where the task stands. */
	status: TaskStatus;
	/** How urgent the task is. */
	priority: TaskPriority;
	/**
	 * The day work on the task can begin, as `"YYYY-MM-DD"`; a calendar day,
	 * the same wherever it is read.
	 *
	 * `null` when it has none.
	 */
	start_date: string | null;
	/**
	 * The day the task is due, in the same form as `start_date`.
	 *
	 * `null` when it has none.
	 */
	due_date: string | null;
	/** Whether the task has been soft-deleted. */
	deleted: boolean;
	/** Ids of the tags on the task. */
	tag_ids: TagIds;
}

/** A named group of tasks in a workspace. */
export interface TaskFolder {
	id: number;
	workspace_id: number;
	title: string;
	/** Where the folder sits among its workspace's folders; lower comes first. */
	sort_order: number;
	deleted: boolean;
}

/**
 * Which folders a task listing covers.
 *
 * - `"any"`: every task, filed or not (the default).
 * - `"inbox"`: only tasks in no folder.
 * - a folder id: only tasks filed in that folder.
 */
export type TaskFolderFilter = 'any' | 'inbox' | number;

/** One page of a listing: its tasks, and how many the whole listing has. */
export interface TaskPage {
	tasks: Task[];
	/** Every task the listing covers, on any page. */
	total: number;
}

/**
 * How urgent a task is; stored as a number so tasks sort by it, `"none"`
 * lowest.
 *
 * Unknown stored numbers read as `"none"`.
 *
 * - `"none"`: no priority set (new tasks start here).
 * - `"low"`
 * - `"medium"`
 * - `"high"`
 * - `"urgent"`
 */
export type TaskPriority =
	| "none"
	| "low"
	| "medium"
	| "high"
	| "urgent";

/**
 * The order a task listing comes back in.
 *
 * Ties fall back to creation order, and tasks with no value for the key (no
 * start or due day) come last in either direction.
 *
 * - `"created"`: oldest first (the default).
 * - `"title"`: alphabetical, ignoring case.
 * - `"priority"`: `"none"` first, `"urgent"` last.
 * - `"startDate"`: earliest start day first.
 * - `"dueDate"`: earliest due day first.
 */
export type TaskSort =
	| "created"
	| "title"
	| "priority"
	| "startDate"
	| "dueDate";

/**
 * Where a task stands; stored as text.
 *
 * Unknown stored text reads as `"incomplete"`.
 *
 * - `"incomplete"`: still to do (new tasks start here).
 * - `"completed"`: done.
 * - `"cancelled"`: will not be done.
 */
export type TaskStatus =
	| "incomplete"
	| "completed"
	| "cancelled";

/**
 * Removes extension `extension_id`, stopping its sandbox and timers and
 * dropping its permission and hook grants.
 */
export interface UninstallExtensionRequest {
	extension_id: number;
}

/** Changes agent `agent_id`; an absent field is left alone. */
export interface UpdateIntelligenceAgentRequest {
	agent_id: number;
	name?: string | null;
	color?: IntelligenceAgentColor | null;
	/** The new emoji; `""` clears it. */
	emoji?: string | null;
	personality?: IntelligenceAgentPersonality | null;
	verbosity?: IntelligenceAgentVerbosity | null;
	/** The new role; `""` clears it. */
	role?: string | null;
	/** The new directive; `""` clears it. */
	directive?: string | null;
}

/** Every kind a client names, each list in the order clients show it. */
export interface Vocabulary {
	/** Extension permissions. */
	permissions: ({ kind: ExtensionPermissionKind; title: string; description: string })[];
	/** What an agent's background runs may be granted. */
	agent_grants: ({ kind: IntelligenceAgentGrantKind; title: string; description: string })[];
	hooks: HookWording[];
	/** Most to least pressing. */
	task_priorities: ({ kind: TaskPriority; label: string })[];
	activity_statuses: ({ kind: ActivityStatus; label: string })[];
	/** An actor task's statuses: idle, then its activity's. */
	actor_task_statuses: ({ kind: ActorTaskStatus; label: string })[];
	agent_colors: ({ kind: IntelligenceAgentColor; label: string })[];
	agent_personalities: ({ kind: IntelligenceAgentPersonality; label: string })[];
	agent_verbosities: ({ kind: IntelligenceAgentVerbosity; label: string })[];
	/** Model tiers, with what each is used for. */
	tiers: ({ kind: IntelligenceTier; title: string; description: string })[];
	/** Providers with a built-in endpoint preset. */
	providers: ProviderWording[];
	dialects: ({ kind: Dialect; label: string })[];
	/** The emoji an agent message can be reacted with. */
	agent_reactions: string[];
}

/** The web UI's static build, for a client to serve. */
export interface WebBundle {
	/**
	 * Identifies this build: any change to the files changes it, so a client
	 * may keep what it unpacked for as long as the hash is unchanged.
	 */
	hash: string;
	files: WebFile[];
}

/** One file of the web UI's build. */
export interface WebFile {
	/** Relative to the build's root, with `/` separators, e.g. `_app/version.json`. */
	path: string;
	/**
	 * The file's bytes, compressed as raw deflate (RFC 1951, no zlib or gzip
	 * wrapper), base64-encoded.
	 */
	data: string;
}

/** A top-level container for documents and tasks. */
export interface Workspace {
	/** Unique, stable identifier. */
	id: number;
	/**
	 * Display name.
	 *
	 * Not guaranteed unique; looking a workspace up by title is an exact,
	 * case-sensitive match.
	 */
	title: string;
	/** An emoji shown in place of the title's initial; none when unset. */
	emoji: string | null;
	/**
	 * Whether the workspace has been soft-deleted.
	 *
	 * Lookups and listings skip deleted workspaces, so this is normally
	 * `false`.
	 */
	deleted: boolean;
}

/**
 * A kind of resource shown in a workspace. A kind is hidden in every
 * workspace until it is shown there; hidden, its resources stay.
 */
export interface WorkspaceResourceKind {
	id: number;
	workspace_id: number;
	kind_id: number;
	/**
	 * Where the kind sits among those the workspace shows; a kind shown
	 * later goes last.
	 */
	sort_order: number;
}

/** Every request `type` and the shape of its `args`. */
export interface Requests {
	about: NoArgs;
	/** Answers the web UI this cohesiond was built with, for a client to serve. */
	webBundle: NoArgs;
	/**
	 * Opens a pairing window and answers the setup code a new client
	 * registers with. It works for one registration, for ten minutes.
	 */
	beginPairing: NoArgs;
	/** Evaluates a script on the server. */
	runScript: RunScriptRequest;
	/** Lists every workspace that is not deleted. */
	listWorkspaces: NoArgs;
	/** Creates a workspace with `title`. */
	createWorkspace: CreateWorkspaceRequest;
	/** Deletes workspace `id`. */
	deleteWorkspace: DeleteWorkspaceRequest;
	/** Retitles workspace `id`. */
	renameWorkspace: RenameWorkspaceRequest;
	/** Sets or clears a workspace's emoji. */
	setWorkspaceEmoji: SetWorkspaceEmojiRequest;
	/** Fetches the journal for a date in a workspace, if it exists. */
	getJournal: GetJournalRequest;
	/** Appends `content` to the journal for a date in a workspace. */
	appendToJournal: AppendToJournalRequest;
	/** Replaces the contents of the journal for a date in a workspace. */
	editJournal: EditJournalRequest;
	/** Search documents */
	searchDocuments: SearchDocumentRequest;
	/** Lists the live documents in a workspace, most recently modified first. */
	listDocuments: ListDocumentsRequest;
	/** Fetches live document `document_id` in a workspace. */
	getDocument: GetDocumentRequest;
	/** Replaces the contents of live document `document_id` in a workspace. */
	editDocument: EditDocumentRequest;
	/** Creates an ordinary document in a workspace. */
	createDocument: CreateDocumentRequest;
	/** Retitles live document `document_id` in a workspace. */
	renameDocument: RenameDocumentRequest;
	/** Deletes document `document_id` in a workspace. */
	deleteDocument: DeleteDocumentRequest;
	/** Lists task folders */
	listTaskFolders: ListTaskFoldersRequest;
	createTaskFolder: CreateTaskFolderRequest;
	deleteTaskFolder: DeleteTaskFolderRequest;
	/** Retitles task folder `folder_id` in a workspace. */
	renameTaskFolder: RenameTaskFolderRequest;
	/** Reorders a workspace's task folders; replies with them in their new order. */
	reorderTaskFolders: ReorderTaskFoldersRequest;
	/** Lists a workspace's tags for tasks or for articles, in their order. */
	listTags: ListTagsRequest;
	/** Creates a tag for tasks or for articles in a workspace. */
	createTag: CreateTagRequest;
	/** Renames tag `tag_id` in a workspace. */
	renameTag: RenameTagRequest;
	/**
	 * Reorders a workspace's tags for tasks or for articles; replies with
	 * them in their new order.
	 */
	reorderTags: ReorderTagsRequest;
	/** Deletes tag `tag_id` in a workspace, taking it off everything. */
	deleteTag: DeleteTagRequest;
	/**
	 * Puts a tag on a task or article, or takes it off; replies with the
	 * item as its listing shows it.
	 */
	setTagged: SetTaggedRequest;
	/** Lists a page of the live tasks the filters cover. */
	listTasks: ListTasksRequest;
	createTask: CreateTaskRequest;
	/** Retitles task `task_id` in a workspace. */
	renameTask: RenameTaskRequest;
	/** Sets the priority of task `task_id` in a workspace. */
	setTaskPriority: SetTaskPriorityRequest;
	/** Replaces the description of task `task_id` in a workspace; `""` clears it. */
	editTaskDescription: EditTaskDescriptionRequest;
	/** Sets both dates of task `task_id` in a workspace; `null` clears one. */
	scheduleTask: ScheduleTaskRequest;
	/** Moves task `task_id` into folder `folder_id`, or the inbox when absent. */
	moveTask: MoveTaskRequest;
	/** Deletes task `task_id` in a workspace. */
	deleteTask: DeleteTaskRequest;
	searchWorkspace: SearchWorkspaceRequest;
	documentation: NoArgs;
	updateModelCatalog: NoArgs;
	/** Lists every intelligence endpoint. */
	listIntelligenceEndpoints: NoArgs;
	createIntelligenceEndpoint: CreateIntelligenceEndpointRequest;
	deleteIntelligenceEndpoint: DeleteIntelligenceEndpointRequest;
	/** Imports a model into an endpoint, from the catalog when it lists it. */
	addEndpointModel: AddEndpointModelRequest;
	/** Removes an endpoint's model, unsetting any tier that uses it. */
	removeEndpointModel: RemoveEndpointModelRequest;
	/** Lists the models an endpoint offers. */
	listEndpointModels: ListEndpointModelsRequest;
	/** Makes an endpoint model the default for a tier. */
	setIntelligenceDefault: SetIntelligenceDefaultRequest;
	listIntelligenceDefaults: NoArgs;
	/** Removes the default model of `tier`. */
	clearIntelligenceDefault: ClearIntelligenceDefaultRequest;
	listCatalogModels: ListCatalogModelsRequest;
	/** Fetches intelligence thread `thread_id` with its messages. */
	getIntelligenceThread: GetIntelligenceThreadRequest;
	/** Lists the `limit` most recent intelligence cost events, newest first. */
	listIntelligenceCostEvents: ListIntelligenceCostEventsRequest;
	changeTasksStatus: ChangeTasksStatusRequest;
	registerExtension: RegisterExtensionRequest;
	/**
	 * Removes extension `extension_id`, stopping its sandbox and timers and
	 * dropping its permission and hook grants.
	 */
	uninstallExtension: UninstallExtensionRequest;
	/** Lists every installed extension, in the order its hooks run. */
	listExtensions: NoArgs;
	/** Lists the permissions recorded for extension `extension_id`. */
	listExtensionPermissions: ListExtensionPermissionsRequest;
	/**
	 * Enables or disables `permission` for extension `extension_id`,
	 * restarting its sandbox so the change applies at once.
	 */
	setExtensionPermission: SetExtensionPermissionRequest;
	/** Lists the hooks recorded for extension `extension_id`. */
	listExtensionHooks: ListExtensionHooksRequest;
	/**
	 * Enables or disables `hook` for extension `extension_id`, restarting
	 * its sandbox; enabling `launch` calls `onLaunch`.
	 */
	setExtensionHook: SetExtensionHookRequest;
	/**
	 * Asks every extension granted `registry` for the extensions it offers
	 * matching `query`, one section per registry.
	 */
	searchExtensionRegistries: SearchExtensionRegistriesRequest;
	/**
	 * Lists the updates the last check found for installed extensions: one
	 * per extension whose version a registry lists differently.
	 */
	listExtensionUpdates: NoArgs;
	/**
	 * Asks every registry about the installed extensions now, and lists the
	 * updates found.
	 */
	checkExtensionUpdates: NoArgs;
	/**
	 * Downloads an extension script and reads its manifest, for review
	 * before installing it.
	 */
	previewExtension: PreviewExtensionRequest;
	/**
	 * Reads the manifest of an extension script, for review before
	 * installing it.
	 */
	previewExtensionScript: PreviewExtensionScriptRequest;
	/**
	 * Calls extension `extension_id`'s `serviceRequest(name, args)`, which
	 * needs its `service` permission, and answers what it returns.
	 */
	callExtension: CallExtensionRequest;
	/**
	 * Lists every client that is not deleted, each saying whether it is
	 * connected now.
	 */
	listClients: NoArgs;
	/**
	 * Revokes client `id`; its certificate is no longer trusted, and an
	 * client's session no longer serves its offers.
	 */
	deleteClient: DeleteClientRequest;
	/** Renames client `id`; its name is only how it is listed. */
	renameClient: RenameClientRequest;
	/** Creates an agent. */
	createIntelligenceAgent: CreateIntelligenceAgentRequest;
	/**
	 * Lists every agent: the pinned ones in their order, then the rest by
	 * latest message, newest first.
	 */
	listIntelligenceAgents: NoArgs;
	/** Reorders the pinned agents; replies with every agent in the new order. */
	reorderIntelligenceAgents: ReorderIntelligenceAgentsRequest;
	/** Pins or unpins agent `agent_id`. */
	setAgentPinned: SetAgentPinnedRequest;
	/** Fetches agent `agent_id`. */
	getIntelligenceAgent: GetIntelligenceAgentRequest;
	/** Renames, recolors, sets the emoji of or changes the model of agent `agent_id`. */
	updateIntelligenceAgent: UpdateIntelligenceAgentRequest;
	/** Deletes agent `agent_id` with its cues, runs and messages. */
	deleteIntelligenceAgent: DeleteIntelligenceAgentRequest;
	/** Marks agent `agent_id`'s conversation read. */
	markAgentRead: MarkAgentReadRequest;
	/** Pages through an agent's messages, oldest first. */
	listAgentMessages: ListAgentMessagesRequest;
	/** Fetches agent message `message_id`. */
	getAgentMessage: GetAgentMessageRequest;
	/**
	 * Reacts to an agent's message with an emoji, or clears the reaction;
	 * a reaction queues the agent's turn on it.
	 */
	setAgentMessageReaction: SetAgentMessageReactionRequest;
	/** Lists the images attached to a message. */
	listAgentMessageAttachments: ListAgentMessageAttachmentsRequest;
	/** Sends a message to an agent, queueing its turn on it. */
	sendAgentMessage: SendAgentMessageRequest;
	/** Approves or denies a background agent's proposal; returns the updated message. */
	respondToAgentProposal: RespondToAgentProposalRequest;
	/** Picks an option of an agent's choice, queueing its turn on the pick. */
	respondToAgentChoice: RespondToAgentChoiceRequest;
	/** Lists agent `agent_id`'s cues, oldest first. */
	listAgentCues: ListAgentCuesRequest;
	/** Lists the grants agent `agent_id`'s background runs hold. */
	listAgentGrants: ListAgentGrantsRequest;
	/**
	 * Grants agent `agent_id`'s background runs `kind`, or revokes it;
	 * returns the grants the agent then holds.
	 */
	setAgentGrant: SetAgentGrantRequest;
	/** Removes cue `cue_id`; an agent left with no cues goes idle. */
	removeAgentCue: RemoveAgentCueRequest;
	/**
	 * Lists the memories agent `agent_id` sees, its own and the global
	 * ones; only the global ones when absent. Oldest first.
	 */
	listMemories: ListMemoriesRequest;
	/** Forgets memory `memory_id`, returning it. */
	forgetMemory: ForgetMemoryRequest;
	/** Lists agent `agent_id`'s most recent background runs, newest first. */
	listAgentRuns: ListAgentRunsRequest;
	/**
	 * Lists the activities still running or waiting, then the `limit`
	 * that ended most recently.
	 */
	listActivities: ListActivitiesRequest;
	/** Lists the actors the clients offer. */
	listActors: NoArgs;
	/** Lists actor tasks, most recently active first. */
	listActorTasks: ListActorTasksRequest;
	getActorTask: GetActorTaskRequest;
	/** Marks actor task `task_id` read. */
	markActorTaskRead: MarkActorTaskReadRequest;
	/** Lists what was said in an actor task, oldest first. */
	listActorTaskMessages: ListActorTaskMessagesRequest;
	/** Lists the images attached to an actor task message. */
	listActorTaskMessageAttachments: ListActorTaskMessageAttachmentsRequest;
	/** Hands an actor a new task, through its client. */
	startActorTask: StartActorTaskRequest;
	/** Says something in an actor task, through its client. */
	sendActorTaskMessage: SendActorTaskMessageRequest;
	/** Stops what an actor task is doing, leaving it idle. */
	stopActorTask: StopActorTaskRequest;
	/** Switches an actor task's mode, through its client. */
	setActorTaskMode: SetActorTaskModeRequest;
	/** Lists every service a `connector`-granted extension reaches. */
	listConnectorServices: NoArgs;
	/** Asks connector extension `extension_id` for its sign-in page. */
	beginConnectorAuthentication: BeginConnectorAuthenticationRequest;
	/** Adds (or re-authenticates) the account a sign-in `code` belongs to. */
	completeConnectorAuthentication: CompleteConnectorAuthenticationRequest;
	/** Lists every connector account. */
	listConnectorAccounts: NoArgs;
	/**
	 * Removes connector account `account_id` and every resource imported
	 * from it, then tells its extension with `accountRemoved`.
	 */
	deleteConnectorAccount: DeleteConnectorAccountRequest;
	/**
	 * Moves every resource of one connector account to another of the
	 * same connector.
	 */
	migrateResources: MigrateResourcesRequest;
	/** Lists the organization units of connector account `account_id`. */
	listConnectorOrganizationUnits: ListConnectorOrganizationUnitsRequest;
	/** Lists the items a connector account offers for import into a workspace. */
	searchConnectorResources: SearchConnectorResourcesRequest;
	/** Imports one item of a connector account into a workspace as a resource. */
	importResource: ImportResourceRequest;
	/** Lists the resources in a workspace, most recently updated first. */
	listResources: ListResourcesRequest;
	/** Fetches resource `resource_id` in a workspace. */
	getResource: GetResourceRequest;
	/** Removes resource `resource_id` from a workspace. */
	deleteResource: DeleteResourceRequest;
	/** Refreshes every resource in a workspace from its service now. */
	refreshResources: RefreshResourcesRequest;
	/** Lists the kinds of resource shown in a workspace. */
	listWorkspaceResourceKinds: ListWorkspaceResourceKindsRequest;
	/** Shows or hides a kind of resource in a workspace. */
	setResourceKindShown: SetResourceKindShownRequest;
	/** Reorders the kinds of resource shown in a workspace. */
	reorderWorkspaceResourceKinds: ReorderWorkspaceResourceKindsRequest;
	/**
	 * Lists a page of the live articles in a workspace's inbox, a folder or
	 * a feed, most recently published first, without their contents.
	 */
	listArticles: ListArticlesRequest;
	/**
	 * Saves live article `article_id` to a workspace or unsaves it from
	 * there; replies with it as that workspace lists it.
	 */
	setArticleSaved: SetArticleSavedRequest;
	/** Marks live article `article_id` read or unread. */
	setArticleRead: SetArticleReadRequest;
	/** Marks every unread article a listing covers as read. */
	markArticlesRead: MarkArticlesReadRequest;
	/** Lists the feeds in their order, with their unread counts. */
	listFeeds: NoArgs;
	/** Reads a feed and follows it. */
	addFeed: AddFeedRequest;
	/** Reads live feed `feed_id` now. */
	refreshFeed: RefreshFeedRequest;
	/** Reads every live feed now. */
	refreshFeeds: NoArgs;
	/** Retitles live feed `feed_id`. */
	renameFeed: RenameFeedRequest;
	/** Reorders the feeds; replies with them in their new order. */
	reorderFeeds: ReorderFeedsRequest;
	/** Sets when live feed `feed_id`'s items are read from their pages. */
	setFeedFullPagePolicy: SetFeedFullPagePolicyRequest;
	/** Sets what reads live feed `feed_id`'s items' pages. */
	setFeedParser: SetFeedParserRequest;
	/** Stops following feed `feed_id`, removing its unsaved items. */
	deleteFeed: DeleteFeedRequest;
	/** Removes feeds' unsaved items published before a time. */
	pruneFeeds: PruneFeedsRequest;
	/** A page of the full-text matches among the articles from feeds. */
	searchFeedCorpus: SearchFeedCorpusRequest;
	/**
	 * Files live article `article_id` in a workspace's folder, or its inbox
	 * when absent; replies with it as that workspace lists it.
	 */
	moveArticle: MoveArticleRequest;
	/** Lists a workspace's article folders in their order. */
	listArticleFolders: ListArticleFoldersRequest;
	/** Adds an article folder, last in its workspace's order. */
	createArticleFolder: CreateArticleFolderRequest;
	/** Retitles article folder `folder_id` in a workspace. */
	renameArticleFolder: RenameArticleFolderRequest;
	/**
	 * Reorders a workspace's article folders; replies with them in their new
	 * order.
	 */
	reorderArticleFolders: ReorderArticleFoldersRequest;
	/** Deletes article folder `folder_id`; its articles move to the inbox. */
	deleteArticleFolder: DeleteArticleFolderRequest;
	/** Fetches live article `article_id` as a workspace's reader shows it. */
	getArticle: GetArticleRequest;
	/**
	 * Fetches a page and saves it to a workspace as an article, or re-fetches
	 * the article already saved with that URL.
	 */
	saveArticle: SaveArticleRequest;
	/** Fetches live article `article_id`'s page again. */
	resnapshotArticle: ResnapshotArticleRequest;
	/** Retitles live article `article_id`. */
	renameArticle: RenameArticleRequest;
}

/** The `ok.data` each request type answers with. */
export interface Replies {
	about: AboutResponse;
	/** Answers the web UI this cohesiond was built with, for a client to serve. */
	webBundle: WebBundle;
	/**
	 * Opens a pairing window and answers the setup code a new client
	 * registers with. It works for one registration, for ten minutes.
	 */
	beginPairing: PairingCode;
	/** Evaluates a script on the server. */
	runScript: ScriptResult;
	/** Lists every workspace that is not deleted. */
	listWorkspaces: Workspace[];
	/** Creates a workspace with `title`. */
	createWorkspace: Workspace;
	/** Deletes workspace `id`. */
	deleteWorkspace: Workspace;
	/** Retitles workspace `id`. */
	renameWorkspace: Workspace;
	/** Sets or clears a workspace's emoji. */
	setWorkspaceEmoji: Workspace;
	/** Fetches the journal for a date in a workspace, if it exists. */
	getJournal: Document | null;
	/** Appends `content` to the journal for a date in a workspace. */
	appendToJournal: Document;
	/** Replaces the contents of the journal for a date in a workspace. */
	editJournal: Document;
	/** Search documents */
	searchDocuments: Document[];
	/** Lists the live documents in a workspace, most recently modified first. */
	listDocuments: Document[];
	/** Fetches live document `document_id` in a workspace. */
	getDocument: Document;
	/** Replaces the contents of live document `document_id` in a workspace. */
	editDocument: Document;
	/** Creates an ordinary document in a workspace. */
	createDocument: Document;
	/** Retitles live document `document_id` in a workspace. */
	renameDocument: Document;
	/** Deletes document `document_id` in a workspace. */
	deleteDocument: Document;
	/** Lists task folders */
	listTaskFolders: TaskFolder[];
	createTaskFolder: TaskFolder;
	deleteTaskFolder: TaskFolder;
	/** Retitles task folder `folder_id` in a workspace. */
	renameTaskFolder: TaskFolder;
	/** Reorders a workspace's task folders; replies with them in their new order. */
	reorderTaskFolders: TaskFolder[];
	/** Lists a workspace's tags for tasks or for articles, in their order. */
	listTags: Tag[];
	/** Creates a tag for tasks or for articles in a workspace. */
	createTag: Tag;
	/** Renames tag `tag_id` in a workspace. */
	renameTag: Tag;
	/**
	 * Reorders a workspace's tags for tasks or for articles; replies with
	 * them in their new order.
	 */
	reorderTags: Tag[];
	/** Deletes tag `tag_id` in a workspace, taking it off everything. */
	deleteTag: Tag;
	/**
	 * Puts a tag on a task or article, or takes it off; replies with the
	 * item as its listing shows it.
	 */
	setTagged: TaggedItem;
	/** Lists a page of the live tasks the filters cover. */
	listTasks: TaskPage;
	createTask: Task;
	/** Retitles task `task_id` in a workspace. */
	renameTask: Task;
	/** Sets the priority of task `task_id` in a workspace. */
	setTaskPriority: Task;
	/** Replaces the description of task `task_id` in a workspace; `""` clears it. */
	editTaskDescription: Task;
	/** Sets both dates of task `task_id` in a workspace; `null` clears one. */
	scheduleTask: Task;
	/** Moves task `task_id` into folder `folder_id`, or the inbox when absent. */
	moveTask: Task;
	/** Deletes task `task_id` in a workspace. */
	deleteTask: Task;
	searchWorkspace: SearchResult[];
	documentation: DocumentationResponse;
	updateModelCatalog: AcceptedResponse;
	/** Lists every intelligence endpoint. */
	listIntelligenceEndpoints: RedactedIntelligenceEndpoint[];
	createIntelligenceEndpoint: RedactedIntelligenceEndpoint;
	deleteIntelligenceEndpoint: RedactedIntelligenceEndpoint;
	/** Imports a model into an endpoint, from the catalog when it lists it. */
	addEndpointModel: EndpointModel;
	/** Removes an endpoint's model, unsetting any tier that uses it. */
	removeEndpointModel: EndpointModel;
	/** Lists the models an endpoint offers. */
	listEndpointModels: EndpointModel[];
	/** Makes an endpoint model the default for a tier. */
	setIntelligenceDefault: AcceptedResponse;
	listIntelligenceDefaults: IntelligenceDefault[];
	/** Removes the default model of `tier`. */
	clearIntelligenceDefault: AcceptedResponse;
	listCatalogModels: CatalogModel[];
	/** Fetches intelligence thread `thread_id` with its messages. */
	getIntelligenceThread: IntelligenceThreadDetail;
	/** Lists the `limit` most recent intelligence cost events, newest first. */
	listIntelligenceCostEvents: IntelligenceCostEvent[];
	changeTasksStatus: Task[];
	registerExtension: AcceptedResponse;
	/**
	 * Removes extension `extension_id`, stopping its sandbox and timers and
	 * dropping its permission and hook grants.
	 */
	uninstallExtension: AcceptedResponse;
	/** Lists every installed extension, in the order its hooks run. */
	listExtensions: ExtensionSummary[];
	/** Lists the permissions recorded for extension `extension_id`. */
	listExtensionPermissions: ExtensionPermission[];
	/**
	 * Enables or disables `permission` for extension `extension_id`,
	 * restarting its sandbox so the change applies at once.
	 */
	setExtensionPermission: AcceptedResponse;
	/** Lists the hooks recorded for extension `extension_id`. */
	listExtensionHooks: ExtensionHook[];
	/**
	 * Enables or disables `hook` for extension `extension_id`, restarting
	 * its sandbox; enabling `launch` calls `onLaunch`.
	 */
	setExtensionHook: AcceptedResponse;
	/**
	 * Asks every extension granted `registry` for the extensions it offers
	 * matching `query`, one section per registry.
	 */
	searchExtensionRegistries: RegistrySection[];
	/**
	 * Lists the updates the last check found for installed extensions: one
	 * per extension whose version a registry lists differently.
	 */
	listExtensionUpdates: ExtensionUpdate[];
	/**
	 * Asks every registry about the installed extensions now, and lists the
	 * updates found.
	 */
	checkExtensionUpdates: ExtensionUpdate[];
	/**
	 * Downloads an extension script and reads its manifest, for review
	 * before installing it.
	 */
	previewExtension: ExtensionPreview;
	/**
	 * Reads the manifest of an extension script, for review before
	 * installing it.
	 */
	previewExtensionScript: ExtensionPreview;
	/**
	 * Calls extension `extension_id`'s `serviceRequest(name, args)`, which
	 * needs its `service` permission, and answers what it returns.
	 */
	callExtension: ExtensionCallResult;
	/**
	 * Lists every client that is not deleted, each saying whether it is
	 * connected now.
	 */
	listClients: ListedClient[];
	/**
	 * Revokes client `id`; its certificate is no longer trusted, and an
	 * client's session no longer serves its offers.
	 */
	deleteClient: Client;
	/** Renames client `id`; its name is only how it is listed. */
	renameClient: Client;
	/** Creates an agent. */
	createIntelligenceAgent: IntelligenceAgent;
	/**
	 * Lists every agent: the pinned ones in their order, then the rest by
	 * latest message, newest first.
	 */
	listIntelligenceAgents: IntelligenceAgent[];
	/** Reorders the pinned agents; replies with every agent in the new order. */
	reorderIntelligenceAgents: IntelligenceAgent[];
	/** Pins or unpins agent `agent_id`. */
	setAgentPinned: IntelligenceAgent;
	/** Fetches agent `agent_id`. */
	getIntelligenceAgent: IntelligenceAgent;
	/** Renames, recolors, sets the emoji of or changes the model of agent `agent_id`. */
	updateIntelligenceAgent: IntelligenceAgent;
	/** Deletes agent `agent_id` with its cues, runs and messages. */
	deleteIntelligenceAgent: IntelligenceAgent;
	/** Marks agent `agent_id`'s conversation read. */
	markAgentRead: IntelligenceAgent;
	/** Pages through an agent's messages, oldest first. */
	listAgentMessages: IntelligenceAgentMessage[];
	/** Fetches agent message `message_id`. */
	getAgentMessage: IntelligenceAgentMessage;
	/**
	 * Reacts to an agent's message with an emoji, or clears the reaction;
	 * a reaction queues the agent's turn on it.
	 */
	setAgentMessageReaction: AcceptedResponse;
	/** Lists the images attached to a message. */
	listAgentMessageAttachments: IntelligenceAgentAttachment[];
	/** Sends a message to an agent, queueing its turn on it. */
	sendAgentMessage: AcceptedResponse;
	/** Approves or denies a background agent's proposal; returns the updated message. */
	respondToAgentProposal: IntelligenceAgentMessage;
	/** Picks an option of an agent's choice, queueing its turn on the pick. */
	respondToAgentChoice: AcceptedResponse;
	/** Lists agent `agent_id`'s cues, oldest first. */
	listAgentCues: IntelligenceAgentCue[];
	/** Lists the grants agent `agent_id`'s background runs hold. */
	listAgentGrants: IntelligenceAgentGrant[];
	/**
	 * Grants agent `agent_id`'s background runs `kind`, or revokes it;
	 * returns the grants the agent then holds.
	 */
	setAgentGrant: IntelligenceAgentGrant[];
	/** Removes cue `cue_id`; an agent left with no cues goes idle. */
	removeAgentCue: AcceptedResponse;
	/**
	 * Lists the memories agent `agent_id` sees, its own and the global
	 * ones; only the global ones when absent. Oldest first.
	 */
	listMemories: Memory[];
	/** Forgets memory `memory_id`, returning it. */
	forgetMemory: Memory;
	/** Lists agent `agent_id`'s most recent background runs, newest first. */
	listAgentRuns: IntelligenceAgentRun[];
	/**
	 * Lists the activities still running or waiting, then the `limit`
	 * that ended most recently.
	 */
	listActivities: Activity[];
	/** Lists the actors the clients offer. */
	listActors: Actor[];
	/** Lists actor tasks, most recently active first. */
	listActorTasks: ActorTask[];
	getActorTask: ActorTask;
	/** Marks actor task `task_id` read. */
	markActorTaskRead: ActorTask;
	/** Lists what was said in an actor task, oldest first. */
	listActorTaskMessages: ActorTaskMessage[];
	/** Lists the images attached to an actor task message. */
	listActorTaskMessageAttachments: ActorTaskAttachment[];
	/** Hands an actor a new task, through its client. */
	startActorTask: ActorTask;
	/** Says something in an actor task, through its client. */
	sendActorTaskMessage: ActorTaskMessage;
	/** Stops what an actor task is doing, leaving it idle. */
	stopActorTask: ActorTask;
	/** Switches an actor task's mode, through its client. */
	setActorTaskMode: ActorTask;
	/** Lists every service a `connector`-granted extension reaches. */
	listConnectorServices: ConnectorService[];
	/** Asks connector extension `extension_id` for its sign-in page. */
	beginConnectorAuthentication: ConnectorAuthentication;
	/** Adds (or re-authenticates) the account a sign-in `code` belongs to. */
	completeConnectorAuthentication: RedactedConnectorAccount;
	/** Lists every connector account. */
	listConnectorAccounts: RedactedConnectorAccount[];
	/**
	 * Removes connector account `account_id` and every resource imported
	 * from it, then tells its extension with `accountRemoved`.
	 */
	deleteConnectorAccount: RedactedConnectorAccount;
	/**
	 * Moves every resource of one connector account to another of the
	 * same connector.
	 */
	migrateResources: AcceptedResponse;
	/** Lists the organization units of connector account `account_id`. */
	listConnectorOrganizationUnits: OrganizationUnit[];
	/** Lists the items a connector account offers for import into a workspace. */
	searchConnectorResources: ImportableResource[];
	/** Imports one item of a connector account into a workspace as a resource. */
	importResource: Resource;
	/** Lists the resources in a workspace, most recently updated first. */
	listResources: Resource[];
	/** Fetches resource `resource_id` in a workspace. */
	getResource: Resource;
	/** Removes resource `resource_id` from a workspace. */
	deleteResource: Resource;
	/** Refreshes every resource in a workspace from its service now. */
	refreshResources: ResourceRefreshSummary;
	/** Lists the kinds of resource shown in a workspace. */
	listWorkspaceResourceKinds: WorkspaceResourceKind[];
	/** Shows or hides a kind of resource in a workspace. */
	setResourceKindShown: WorkspaceResourceKind[];
	/** Reorders the kinds of resource shown in a workspace. */
	reorderWorkspaceResourceKinds: WorkspaceResourceKind[];
	/**
	 * Lists a page of the live articles in a workspace's inbox, a folder or
	 * a feed, most recently published first, without their contents.
	 */
	listArticles: ArticlePage;
	/**
	 * Saves live article `article_id` to a workspace or unsaves it from
	 * there; replies with it as that workspace lists it.
	 */
	setArticleSaved: ArticleSummary;
	/** Marks live article `article_id` read or unread. */
	setArticleRead: Article;
	/** Marks every unread article a listing covers as read. */
	markArticlesRead: ArticlesMarkedRead;
	/** Lists the feeds in their order, with their unread counts. */
	listFeeds: FeedSummary[];
	/** Reads a feed and follows it. */
	addFeed: Feed;
	/** Reads live feed `feed_id` now. */
	refreshFeed: Feed;
	/** Reads every live feed now. */
	refreshFeeds: Feed[];
	/** Retitles live feed `feed_id`. */
	renameFeed: Feed;
	/** Reorders the feeds; replies with them in their new order. */
	reorderFeeds: FeedSummary[];
	/** Sets when live feed `feed_id`'s items are read from their pages. */
	setFeedFullPagePolicy: Feed;
	/** Sets what reads live feed `feed_id`'s items' pages. */
	setFeedParser: Feed;
	/** Stops following feed `feed_id`, removing its unsaved items. */
	deleteFeed: Feed;
	/** Removes feeds' unsaved items published before a time. */
	pruneFeeds: FeedCleanup;
	/** A page of the full-text matches among the articles from feeds. */
	searchFeedCorpus: FeedCorpusPage;
	/**
	 * Files live article `article_id` in a workspace's folder, or its inbox
	 * when absent; replies with it as that workspace lists it.
	 */
	moveArticle: ArticleSummary;
	/** Lists a workspace's article folders in their order. */
	listArticleFolders: ArticleFolder[];
	/** Adds an article folder, last in its workspace's order. */
	createArticleFolder: ArticleFolder;
	/** Retitles article folder `folder_id` in a workspace. */
	renameArticleFolder: ArticleFolder;
	/**
	 * Reorders a workspace's article folders; replies with them in their new
	 * order.
	 */
	reorderArticleFolders: ArticleFolder[];
	/** Deletes article folder `folder_id`; its articles move to the inbox. */
	deleteArticleFolder: ArticleFolder;
	/** Fetches live article `article_id` as a workspace's reader shows it. */
	getArticle: ArticleDetail;
	/**
	 * Fetches a page and saves it to a workspace as an article, or re-fetches
	 * the article already saved with that URL.
	 */
	saveArticle: SavedArticle;
	/** Fetches live article `article_id`'s page again. */
	resnapshotArticle: SavedArticle;
	/** Retitles live article `article_id`. */
	renameArticle: Article;
}
