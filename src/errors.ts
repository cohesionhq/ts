import type { ErrorCode, ServerError } from './generated.ts';

/** A request cohesiond refused, as its reply said. */
export class CohesionError extends Error {
	readonly code: ErrorCode;
	/** The argument at fault, when one was. */
	readonly field: string | null;

	constructor(error: ServerError) {
		super(error.message);
		this.name = 'CohesionError';
		this.code = error.code;
		this.field = error.field ?? null;
	}
}

/** The session ended before a request was answered. */
export class SessionClosedError extends Error {
	constructor() {
		super('The session with cohesiond closed.');
		this.name = 'SessionClosedError';
	}
}
