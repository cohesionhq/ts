#!/bin/sh
# Rewrites src/generated.ts from cohesion-core's TsWire types, as the web UI's
# `npm run generate` does. COHESION is the cohesion checkout, ../cohesion
# unless set.
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
cohesion=${COHESION:-$here/../cohesion}
header='// Generated from cohesion-core by `bun run generate`; do not edit.'
(cd "$cohesion" && cargo run -q -p cohesion-core --example ts_client) |
	sed "1s|.*|$header|" > "$here/src/generated.ts"
