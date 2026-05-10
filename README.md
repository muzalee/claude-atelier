# claude-atelier

A workshop of personal Claude Code skills — design, build, review, and writing craft.

## Install

Symlink each skill into `~/.claude/skills/`:

```bash
# from repo root
for s in skills/*/; do
  name=$(basename "$s")
  ln -sfn "$(pwd)/$s" "$HOME/.claude/skills/$name"
done
```

## The pipeline

Four orchestrators run the show. Everything else is a phase skill callable directly.

```
/project-bootstrap → scaffold a new project
        │
        ▼
/design  →  docs in .design/<slug>/  (no code)
        │
        ▼
/build   →  reads those docs, writes code
        │
        ▼
/review  →  reviews the code against the docs
```

## Orchestrators

- `project-bootstrap` — scaffold a new project (folder, `.gitignore`, README, LICENSE, git init, optional GitHub repo with topics)
- `design` — pure-design pipeline: grill-me → brief → backend-design → IA → tokens → tasks. Output is markdown only, saved to `.design/<slug>/`.
- `build` — reads `.design/<slug>/` and implements: materializes the tokens spec, runs frontend-design against `TASKS.md`, then backend-build against `BACKEND_DESIGN.md`.
- `review` — runs code-review + design-review against the built code, using the design docs as the yardstick. Reports back into `.design/<slug>/`.

## Phase skills (callable directly)

**Design phase:**
- `grill-me` — stress-test a plan with relentless questions
- `design-brief` — write a design brief through interview + codebase scan
- `backend-design` — data model, API, auth, scale, observability
- `information-architecture` — structure, nav, flows before visuals
- `design-tokens` — colors, spacing, typography, motion as a `DESIGN_TOKENS.md` spec (not code)
- `brief-to-tasks` — break a brief into vertical-slice tasks

**Build phase:**
- `frontend-design` — build production-grade UI with strong aesthetics; materializes the token spec if needed
- `backend-build` — implement a backend from `BACKEND_DESIGN.md` (plugins, routes, migrations, tests)
- `fastify-route` — scaffold a Fastify route matching project conventions
- `test-plan` — name the cases that must pass before writing code

**Review phase:**
- `code-review` — technical review of changed code (correctness, security, tests, error handling)
- `design-review` — visual critique against the brief with screenshots at mobile/tablet/desktop

## Writing craft

- `keep-it-simple` — terse commits, PRs, comments, and docs
