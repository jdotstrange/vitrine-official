# Model Routing

Last updated: 2026-04-29

## Core Rule
Recommend a model family based on task fit, not habit or the currently active model.

## Before Meaningful Work
Classify:
- Ambiguity
- Architecture impact
- Code edit volume
- Need for exactness
- Need for broad synthesis
- Need for speed/cost efficiency
- Security/data risk
- UI/design judgment
- Debugging depth
- Current-docs dependency

## Recommendation Format
```txt
Recommended family:
Suggested Cursor choice:
Why:
Acceptable alternatives:
Avoid or constrain:
Escalate if:
```

## Routing Guidance
- Architecture, auth, Supabase schema/RLS, large refactors: use frontier reasoning or a two-model plan/review workflow.
- Bounded UI implementation after a clear plan: use GPT/Codex-family or strong mid-tier implementation model.
- Broad docs/context synthesis: use Gemini-family or another strong large-context model.
- Handoff/docs cleanup: use strong mid-tier unless docs encode major architecture decisions.

## Thinktank Advisory Input
If needed, consult `C:\Users\johnj\thinktank\models\TASK_ROUTING_RUBRIC.md`. Do not load all model notes by default.
