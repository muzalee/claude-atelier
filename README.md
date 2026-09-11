# claude-atelier

A workshop of personal Claude Code skills — design, build, review, and writing craft.

## Install

### Recommended — as Claude Code plugins

One marketplace, two plugins:

- **`atelier`** — the stack-agnostic core: design → build → review pipeline + writing-craft skills.
- **`atelier-typescript`** — TS/Fastify-specific skills. Install only in projects where you work with Fastify.

Inside Claude Code:

```
/plugin marketplace add muzalee/claude-atelier
/plugin install atelier@atelier
/plugin install atelier-typescript@atelier   # optional, TS/Fastify only
```

Skills are namespaced under each plugin, e.g. `/atelier:design`, `/atelier-typescript:fastify-route`.

**Turn on auto-update** (third-party marketplaces default off): `/plugin` → **Marketplaces** → `atelier` → **Enable auto-update**. New versions land in the background; you'll be prompted to `/reload-plugins` when they do.

Or, for zero-toggle install with auto-update on, drop this in `~/.claude/settings.json` (user-level) or a project's `.claude/settings.json` (project-scoped):

```json
{
  "extraKnownMarketplaces": {
    "atelier": {
      "source": { "source": "github", "repo": "muzalee/claude-atelier" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "atelier@atelier": true,
    "atelier-typescript@atelier": true
  }
}
```

Drop `atelier-typescript@atelier` from `enabledPlugins` if you don't want the TS skills in that scope.

### Alternative — symlinks (for hacking on the skills)

Clone somewhere durable and link each skill into `~/.claude/skills/`:

```bash
git clone https://github.com/muzalee/claude-atelier.git ~/code/claude-atelier
cd ~/code/claude-atelier
for s in skills/*/; do ln -sfn "$(pwd)/$s" "$HOME/.claude/skills/$(basename "$s")"; done
```

For a single project only, swap `$HOME/.claude/skills` for `/path/to/project/.claude/skills`. Re-run the loop after `git pull` to pick up new skills.

## The pipeline

Five orchestrators run the show. Everything else is a phase skill callable directly.

```
/project-bootstrap → scaffold a new project
        │
        ▼
/prd     →  scope contract in docs/prd/NNNN-<slug>.md   (optional, project-level)
        │
        ▼
/design  →  docs in .design/<slug>/  (no code)
        │
        ▼
/preflight → checks the plan still matches the repo   (optional, before building)
        │
        ▼
/build   →  reads those docs, writes code
        │
        ▼
/review  →  reviews the code against the docs

/ship    →  all of the above, unattended, ending in a review-ready PR
```

## Orchestrators

- `project-bootstrap` — scaffold a new project (folder, `.gitignore`, README, LICENSE, git init, optional GitHub repo with topics)
- `design` — pure-design pipeline: grill-me → brief → backend-design → IA → tokens → test-plan → tasks. Output is markdown only, saved to `.design/<slug>/`.
- `build` — reads `.design/<slug>/` and implements: materializes the tokens spec, runs frontend-design against `TASKS.md`, then backend-build against `BACKEND_DESIGN.md`.
- `review` — runs code-review + security-review + design-review against the built code, using the design docs as the yardstick. Reports back into `.design/<slug>/`.
- `ship` — the unattended loop: branch off main, draft PR, build committing per phase, functional browser test (Orca or Claude-in-Chrome), warm review, fix, cold review in a fresh session against the whole PR, fix, flip to ready.

`/prd` is not part of the `/design` pipeline — it sits above it. One PRD covers an initiative; several `.design/<slug>/` folders can hang off it. When design or build discovers a requirement is wrong, they stop and offer to amend the PRD rather than quietly diverging from it.

## Phase skills (callable directly)

**Scope:**
- `prd` — product requirements doc: problem, users, requirements, success metrics, non-goals, phases, dependencies, risks. Numbered files in `docs/prd/`, amended in place with a changelog.

**Design phase:**
- `grill-me` — stress-test a plan with relentless questions
- `preflight` — check a plan's claims against the actual repo (files, symbols, signatures, deps, scripts) before building it
- `design-brief` — write a design brief through interview + codebase scan
- `backend-design` — data model, API, auth, scale, observability
- `information-architecture` — structure, nav, flows before visuals
- `design-tokens` — colors, spacing, typography, motion as a `DESIGN_TOKENS.md` spec (not code)
- `test-plan` — name the cases (unit / integration / e2e), what to assert, and what NOT to test
- `brief-to-tasks` — break a brief (and test plan) into vertical-slice tasks

**Build phase:**
- `frontend-design` — build production-grade UI with strong aesthetics; materializes the token spec if needed
- `backend-build` — implement a backend from `BACKEND_DESIGN.md` (plugins, routes, migrations, tests)

**Runtime discipline (callable anytime during design or build):**
- `errors` — design typed errors with stable codes and cause chains, so a log line tells the full story
- `logging` — emit structured, context-rich logs at the right level; pairs with `errors` for end-to-end debuggability

**Review phase:**
- `code-review` — technical review of changed code (correctness, security, tests, error handling)
- Claude Code's built-in `security-review` runs as its own phase inside `/review` — a dedicated pass, not a duplicate of the checklist above
- `design-review` — visual critique against the brief with screenshots at mobile/tablet/desktop

## Writing craft

- `keep-it-simple` — conventional commit format, PR titles/bodies, branch names, code comments (necessity bar, not brevity bar), and terse docs

## atelier-typescript skills

Install `atelier-typescript` in projects where you work with TypeScript — React on the front, Node/Fastify on the back:

- `typescript-conventions` — house TS rules (type discipline, module shape, async, validation boundaries) plus `references/react.md` and `references/fastify.md`. `/build` detects a TypeScript repo and loads the relevant half automatically.
- `fastify-route` — scaffold a new Fastify route matching the project's existing conventions (schema strategy, auth pattern, error shape, test framework)
