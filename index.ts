// A client for cohesiond: reach it over its Unix socket or its `/connect`
// WebSocket over mutual TLS, run its requests, hear its invalidations, and
// offer what this client serves, such as actors.

export * from './src/generated.ts';
export * from './src/frames.ts';
export { Client, type ClientOptions, type ClientState } from './src/client.ts';
export { CohesionError, SessionClosedError } from './src/errors.ts';
export { generateIdentity, keyFingerprint, type ClientIdentity } from './src/identity.ts';
export {
	DEFAULT_PORT,
	decodeSetupCode,
	defaultSocketPath,
	localServer,
	pair,
	type LocalIdentity,
	type Server,
	type SetupCode,
} from './src/server.ts';
export { Session, type CallHandler, type ServerHello, type SessionEnd } from './src/session.ts';
export { connectTransport, type Transport } from './src/transport.ts';
