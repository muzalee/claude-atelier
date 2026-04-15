# claude-atelier

A workshop of personal Claude Code skills — design, build, and writing craft.

## Install

Symlink each skill into `~/.claude/skills/`:

```bash
# from repo root
for s in skills/*/; do
  name=$(basename "$s")
  ln -sfn "$(pwd)/$s" "$HOME/.claude/skills/$name"
done
```

## Skills

**Design pipeline** (chain via `design` or `design-flow`):
- `grill-me` — stress-test a plan with relentless questions
- `design-brief` — write a design brief through interview + codebase scan
- `information-architecture` — structure, nav, flows before visuals
- `backend-design` — data model, API, auth, scale, observability
- `design-tokens` — CSS variables / Tailwind config for a chosen aesthetic
- `brief-to-tasks` — break a brief into vertical-slice tasks
- `frontend-design` — build production-grade UI with strong aesthetics
- `design-review` — structured critique against brief + code
- `design` — orchestrator: full pipeline end-to-end
- `design-flow` — orchestrator: frontend-only sequence

**Engineering**:
- `project-bootstrap` — scaffold a new project (folder, .gitignore, README, LICENSE, git init, optional GitHub repo with topics)
- `fastify-route` — scaffold a Fastify route matching project conventions
- `test-plan` — name the cases that must pass before writing code

**Writing craft**:
- `keep-it-simple` — terse commits, PRs, comments, and docs
