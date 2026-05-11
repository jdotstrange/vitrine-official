# MCP Strategy

Last updated: 2026-04-29

## Core Rule
Use MCPs only when they reduce context waste, improve precision, or prevent outdated implementation.

## Available / Relevant MCPs
- Serena: useful for semantic code navigation and large refactor planning.
- Context7: use for current docs for libraries/frameworks/SDKs.
- Supabase: useful for database inspection, but use read-only or explicit-approval mode first.
- Browser: useful for UI verification and web/app testing when needed.

## Recommended Defaults
- Do not install new MCPs automatically.
- Do not configure production write access.
- Do not commit MCP credentials or secrets.
- Prefer project-scoped config only when a server is truly project-specific.

## Use Cases
- Use Context7 before implementing library-specific setup or version-sensitive APIs.
- Use Serena when finding symbols or relationships across the codebase.
- Use Supabase MCP only when DB state/schema inspection is necessary and safe.
- Use browser MCP for UI verification after starting a local app/server.

## Not Recommended Yet
- Broad production-write Supabase MCP access.
- Extra MCPs for convenience.
- GitHub write operations without explicit approval.

## Security
Never reveal or store secrets, service-role keys, private keys, or production access details.
