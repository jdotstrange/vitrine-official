# Session Starter Prompts

Last updated: 2026-04-29

## New Chat Rehydration Prompt
```txt
Read AGENTS.md, docs/ai-context/CURRENT_STATE.md, docs/ai-context/DO_NOT_BREAK.md, docs/ai-context/ARCHITECTURE.md, and docs/ai-context/OPEN_THREADS.md. Then inspect the current files relevant to my request before making changes.
```

## Focused Implementation Prompt
```txt
Use the project memory first, then implement only the requested change. Preserve Expo Go compatibility, avoid secrets, and check relevant lints after substantive edits.
```

## Handoff Prompt
```txt
Update docs/ai-context/CURRENT_STATE.md, IMPLEMENTATION_LOG.md, OPEN_THREADS.md, and HANDOFF.md with what changed, validation, risks, and the next best task. Only update DECISION_LOG.md if a durable decision changed.
```

## Mid-Tier Model Prompt
```txt
This is a bounded implementation task. Read the relevant project memory and files, avoid architecture changes, keep edits narrow, and validate if possible.
```

## Current Docs Prompt
```txt
Use Context7 for current docs before implementing library-specific setup or version-sensitive API usage.
```

## Thinktank Pattern Prompt
```txt
Project-local memory is canonical. Consult Thinktank only for advisory reusable patterns or model routing, starting with INDEX.md and the narrowest relevant note.
```
