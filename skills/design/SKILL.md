---
name: design
description: Explicit-invocation-only orchestrator that runs the full design pipeline end-to-end with confirmation gates between every phase. Invoked ONLY when the user types /design or explicitly asks to "run the design pipeline" / "run the design orchestrator". DO NOT auto-trigger from adjacent talk about briefs, IA, tokens, tasks, frontend, backend, or reviews — those have their own skills, and `design-flow` handles the frontend-only sequence. This skill chains: grill-me → design-brief → backend-design → information-architecture → design-tokens → brief-to-tasks → frontend-design → design-review, passing each phase's output file path into the next.
---

This skill is an orchestrator. It runs eight design phases in strict order and waits for the user to confirm before moving to the next. You are a guide, not a rusher. Each phase produces an artifact (or a shared understanding); the next phase reads it as input.

This is distinct from `design-flow`. Use this skill only when the user explicitly invokes `/design` or asks for the full pipeline including the backend phase.

## The Sequence

```
1. Grill Me                 → shared understanding
2. Design Brief             → .design/<slug>/DESIGN_BRIEF.md
3. Backend Design           → .design/<slug>/BACKEND_DESIGN.md
4. Information Architecture → .design/<slug>/INFORMATION_ARCHITECTURE.md
5. Design Tokens            → tokens file (CSS / Tailwind / theme)
6. Brief to Tasks           → .design/<slug>/TASKS.md
7. Frontend Design          → built code
8. Design Review            → .design/<slug>/DESIGN_REVIEW.md + screenshots
```

## Operating Rules

1. **Open with the map.** Tell the user the eight-phase sequence, name the artifacts each phase produces, and ask if any phase should be skipped. Common skips:
   - Already have a clear idea → skip grill-me
   - Pure-frontend feature with no server work → skip backend-design
   - Single component, not a full page → skip information-architecture
   - Existing project with an established token system → skip design-tokens
   - Nothing built yet → skip design-review (run it later via `/design-review`)

2. **Announce each phase before entering it.** Format: "Phase N: [name]. This will [what it does] and produce [artifact]. Ready?" Wait for confirmation before starting.

3. **Run each phase by reading its SKILL.md and following it in full.** Do not summarize, paraphrase, or skip steps inside a phase. The skills exist to be executed, not narrated.

4. **Thread outputs forward.** Before starting each phase, restate the artifacts already produced and tell the upcoming phase to read them. The phase skills already do codebase scans for `.design/<slug>/`, but explicitly hand them the file paths so nothing is missed. Examples:
   - Before phase 3, tell `backend-design` the brief is at `.design/<slug>/DESIGN_BRIEF.md` so the data model and endpoints serve those flows.
   - Before phase 4, tell `information-architecture` that both briefs (frontend + backend) are written and that URLs / flows must reflect the API surface from `BACKEND_DESIGN.md`.
   - Before phase 5, name the philosophy chosen in `DESIGN_BRIEF.md` so the tokens phase derives values from it.
   - Before phase 6, point at the IA, brief, and tokens so tasks reflect the full structural and visual decisions.
   - Before phase 7, hand `frontend-design` the `TASKS.md` path and have it work through tasks in order.
   - Before phase 8, point at every prior artifact so the review can measure the build against intent.

5. **End each phase with a checkpoint.** Summarize: artifact filename, the 2-3 key decisions made, any open questions. Then ask: "Ready to move to the next phase?" Do not proceed until the user says yes. If the user wants to revise the prior phase, loop back into it before continuing.

6. **The user can stop or pause at any point.** If they say "that's enough for now," summarize where they are in the sequence, list the artifacts produced so far, and tell them which phase they would resume from. Do not auto-resume on a future invocation — they will re-run `/design`.

7. **Resume on later invocations.** If `.design/<slug>/` already contains some artifacts when `/design` is invoked again, list what exists, ask the user which feature slug to continue, and offer to resume from the next incomplete phase rather than restart from grill-me.

## Phase Details

### Phase 1: Grill Me

Read `grill-me/SKILL.md` and follow it. Goal: surface and resolve the open decisions before they get baked into a brief.
- **Input**: the user's initial prompt and the codebase.
- **Produces**: shared understanding. No file.
- **Transition**: "Decisions are resolved. Capture this as a design brief?"

### Phase 2: Design Brief

Read `design-brief/SKILL.md` and follow it.
- **Input**: outcome of phase 1, plus any existing `.design/` content.
- **Produces**: `.design/<slug>/DESIGN_BRIEF.md`. Lock in the `<slug>` here — every later phase uses it.
- **Transition**: "Brief saved at `.design/<slug>/DESIGN_BRIEF.md`. Next is the backend brief — skip if this feature has no server work. Continue?"

### Phase 3: Backend Design

Read `backend-design/SKILL.md` and follow it. Tell it to read `.design/<slug>/DESIGN_BRIEF.md` first so the data model and endpoints serve the frontend flows already named.
- **Input**: `DESIGN_BRIEF.md` + codebase.
- **Produces**: `.design/<slug>/BACKEND_DESIGN.md`.
- **Transition**: "Backend brief saved. Next is information architecture — page structure, navigation, URLs. The IA should reflect the API surface we just defined. Continue?"

### Phase 4: Information Architecture

Read `information-architecture/SKILL.md` and follow it. Tell it to read both `DESIGN_BRIEF.md` and `BACKEND_DESIGN.md` so URLs and flows align with the API.
- **Input**: brief + backend brief.
- **Produces**: `.design/<slug>/INFORMATION_ARCHITECTURE.md`.
- **Transition**: "IA defined. Next: design tokens, derived from the philosophy named in the brief. Continue?"

### Phase 5: Design Tokens

Read `design-tokens/SKILL.md` and follow it. Name the philosophy from `DESIGN_BRIEF.md` up front so tokens derive from it rather than re-asking.
- **Input**: brief (philosophy + aesthetic direction) + codebase.
- **Produces**: token file in the project's stack-appropriate format.
- **Transition**: "Tokens generated. Next: break the brief into tasks. Continue?"

### Phase 6: Brief to Tasks

Read `brief-to-tasks/SKILL.md` and follow it. Tell it to read `DESIGN_BRIEF.md`, `INFORMATION_ARCHITECTURE.md`, and the tokens file so tasks reflect every decision so far.
- **Input**: brief + IA + tokens.
- **Produces**: `.design/<slug>/TASKS.md`.
- **Transition**: "Tasks ready. Now we build. Continue?"

### Phase 7: Frontend Design

Read `frontend-design/SKILL.md` and follow it. Work through `TASKS.md` in order. After each task, check it off in `TASKS.md` and confirm with the user before starting the next.
- **Input**: `TASKS.md`, brief, IA, tokens.
- **Produces**: built components and pages.
- **Transition**: "Build is done. Last phase is the design review — capture screenshots and critique against the brief. Continue?"

### Phase 8: Design Review

Read `design-review/SKILL.md` and follow it. Tell it to compare against `DESIGN_BRIEF.md` and to use the philosophy and component inventory from there. The review captures screenshots via Playwright MCP, the Cursor IDE Browser, or by asking the user to provide them.
- **Input**: built code + brief + tokens.
- **Produces**: `.design/<slug>/DESIGN_REVIEW.md` + `.design/<slug>/screenshots/`.
- **Transition**: "Review is done. Must-fix items can be addressed now, or you can revisit any phase by calling its skill directly."

## Project Files Structure

```
.design/
└── <feature-slug>/
    ├── DESIGN_BRIEF.md              ← Phase 2
    ├── BACKEND_DESIGN.md            ← Phase 3
    ├── INFORMATION_ARCHITECTURE.md  ← Phase 4
    ├── DESIGN_TOKENS.*              ← Phase 5 (or stack-appropriate location)
    ├── TASKS.md                     ← Phase 6
    ├── DESIGN_REVIEW.md             ← Phase 8
    └── screenshots/                 ← Phase 8
```

## What This Skill Is Not

- Not a replacement for `design-flow` — that one is the frontend-only auto-triggerable orchestrator. This one is explicit-invocation-only and includes the backend phase.
- Not a wrapper that simulates the sub-skills — it runs the actual SKILL.md of each phase in full.
- Not a fire-and-forget — the confirmation gate between every phase is the point.
