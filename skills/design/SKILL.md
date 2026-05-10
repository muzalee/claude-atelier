---
name: design
description: Explicit-invocation-only orchestrator that runs the pure-design phase end-to-end — grill → brief → backend-design → IA → tokens → tasks — with confirmation gates between every phase. Every output is a markdown doc saved to `.design/<slug>/`. NO CODE is written in this skill. Invoked ONLY when the user types /design or explicitly asks to "run the design pipeline" / "run the design orchestrator". After this, the user runs `/build` to implement and `/review` to check the result. DO NOT auto-trigger from adjacent talk about briefs, IA, tokens, tasks, or building — those have their own skills.
---

This skill is the **pure-design** orchestrator. It runs six phases in strict order and produces markdown docs only — no code. Everything lands in `.design/<slug>/` and becomes the input to `/build`.

The three-part pipeline:
- `/design` — this skill. Produces docs.
- `/build`  — reads the docs and writes the code.
- `/review` — reviews the code against the docs.

## The Sequence

```
1. Grill Me                 → shared understanding
2. Design Brief             → .design/<slug>/DESIGN_BRIEF.md
3. Backend Design           → .design/<slug>/BACKEND_DESIGN.md
4. Information Architecture → .design/<slug>/INFORMATION_ARCHITECTURE.md
5. Design Tokens            → .design/<slug>/DESIGN_TOKENS.md   (spec, not code)
6. Brief to Tasks           → .design/<slug>/TASKS.md
```

At the end, every artifact is markdown inside `.design/<slug>/`. Nothing has been implemented. The user then runs `/build`.

## Operating Rules

1. **Open with the map.** Tell the user the six-phase sequence, name the artifact each phase produces, and ask if any phase should be skipped. Common skips:
   - Already have a clear idea → skip grill-me
   - Pure-frontend feature with no server work → skip backend-design
   - Backend-only service → skip IA + tokens
   - Single component, not a full page → skip information-architecture
   - Existing project with an established token system → skip design-tokens

2. **Announce each phase before entering it.** Format: "Phase N: [name]. This will [what it does] and produce [artifact]. Ready?" Wait for confirmation.

3. **Run each phase by reading its SKILL.md and following it in full.** Do not summarize, paraphrase, or skip steps — the sub-skills exist to be executed, not narrated.

4. **This skill writes no code.** Even the tokens phase produces a `DESIGN_TOKENS.md` spec, not a `.css` or `tailwind.config`. Materialization happens in `/build`. If the user starts asking you to code mid-`/design`, remind them that `/build` is the next step and offer to close out design first.

5. **Thread outputs forward.** Before each phase, restate what's already produced and hand file paths to the next skill. Examples:
   - Before phase 3, tell `backend-design` the brief is at `.design/<slug>/DESIGN_BRIEF.md`.
   - Before phase 4, tell `information-architecture` that both briefs are written; URLs and flows must reflect the API surface in `BACKEND_DESIGN.md`.
   - Before phase 5, name the philosophy from the brief so tokens derive from it.
   - Before phase 6, point at brief + IA + tokens spec so tasks reflect every decision.

6. **End each phase with a checkpoint.** Summarize the artifact filename, 2-3 key decisions, any open questions. Then ask: "Ready for the next phase?" Do not proceed until the user says yes.

7. **The user can stop or pause at any point.** If they say "that's enough for now," list artifacts so far and tell them which phase they'd resume from.

8. **Resume on later invocations.** If `.design/<slug>/` already contains some artifacts, list what exists, ask which slug to continue, and offer to resume from the next incomplete phase rather than restart from grill-me.

9. **Close the loop.** After phase 6, tell the user: "Design done. Everything is in `.design/<slug>/`. Run `/build` when you're ready to implement, then `/review` when the code is ready to be checked."

## Phase Details

### Phase 1: Grill Me

Read `grill-me/SKILL.md` and follow it. Surface and resolve open decisions before they bake into a brief.
- **Input**: user's initial prompt + codebase.
- **Produces**: shared understanding. No file.
- **Transition**: "Decisions resolved. Capture this as a design brief?"

### Phase 2: Design Brief

Read `design-brief/SKILL.md` and follow it.
- **Input**: outcome of phase 1 + any existing `.design/` content.
- **Produces**: `.design/<slug>/DESIGN_BRIEF.md`. Lock the `<slug>` here — every later phase uses it.
- **Transition**: "Brief saved. Next is the backend brief — skip if this feature has no server work. Continue?"

### Phase 3: Backend Design

Read `backend-design/SKILL.md` and follow it. Tell it to read `.design/<slug>/DESIGN_BRIEF.md` first so the data model and endpoints serve the frontend flows already named.
- **Input**: `DESIGN_BRIEF.md` + codebase.
- **Produces**: `.design/<slug>/BACKEND_DESIGN.md`.
- **Transition**: "Backend brief saved. Next: information architecture. Continue?"

### Phase 4: Information Architecture

Read `information-architecture/SKILL.md` and follow it. Tell it to read both briefs so URLs and flows align with the API.
- **Input**: brief + backend brief.
- **Produces**: `.design/<slug>/INFORMATION_ARCHITECTURE.md`.
- **Transition**: "IA defined. Next: design tokens spec. Continue?"

### Phase 5: Design Tokens

Read `design-tokens/SKILL.md` and follow it. Name the philosophy from `DESIGN_BRIEF.md` up front so tokens derive from it. The output is a `DESIGN_TOKENS.md` **spec** (token name, value, role) — **not** an actual CSS or Tailwind file. Materialization happens in `/build`.
- **Input**: brief (philosophy) + codebase (for existing token conventions).
- **Produces**: `.design/<slug>/DESIGN_TOKENS.md`.
- **Transition**: "Tokens spec ready. Next: break into tasks. Continue?"

### Phase 6: Brief to Tasks

Read `brief-to-tasks/SKILL.md` and follow it. Tell it to read brief + IA + tokens spec so tasks reflect every decision so far.
- **Input**: brief + IA + tokens spec.
- **Produces**: `.design/<slug>/TASKS.md`.
- **Transition**: "Tasks ready. Design phase complete. Run `/build` to implement, then `/review` to check the code."

## Project Files Structure

```
.design/
└── <feature-slug>/
    ├── DESIGN_BRIEF.md              ← Phase 2
    ├── BACKEND_DESIGN.md            ← Phase 3
    ├── INFORMATION_ARCHITECTURE.md  ← Phase 4
    ├── DESIGN_TOKENS.md             ← Phase 5 (spec, not code)
    └── TASKS.md                     ← Phase 6
```

Everything is markdown. No code files.

## What This Skill Is Not

- Not a builder — this skill writes no code. `/build` does that.
- Not a reviewer — `/review` handles code + visual review after the build.
- Not a wrapper — it runs the actual SKILL.md of each phase in full.
- Not a fire-and-forget — the confirmation gate between every phase is the point.
