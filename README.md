# claude-atelier

A workshop of personal Claude Code skills — design, build, review, and writing craft.

## Install

### Recommended — as Claude Code plugins

One marketplace, three plugins:

- **`atelier`** — the stack-agnostic core: design → build → review pipeline + writing-craft skills.
- **`atelier-typescript`** — TypeScript skills (React + Fastify conventions, route scaffolding). Install in TypeScript projects.
- **`atelier-flutter`** — Flutter skills (feature-first structure and conventions). Install in Flutter projects.

Inside Claude Code:

```
/plugin marketplace add muzalee/claude-atelier
/plugin install atelier@atelier
/plugin install atelier-typescript@atelier   # optional, TS/Fastify only
/plugin install atelier-flutter@atelier      # optional, Flutter only
```

Skills are namespaced under each plugin, e.g. `/atelier:design`, `/atelier-typescript:fastify-route`. **Always type `/atelier:design`, not `/design`** — a bare `/design` collides with Claude Code's built-in design canvas and with `ui-ux-pro-max:design`.

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

#### Install scope

Plugins install at one of three scopes. The CLI takes `--scope`; the default is `user`.

| Scope | Written to | Who gets it |
| ----- | ---------- | ----------- |
| `user` (default) | `~/.claude/settings.json` | you, in every project |
| `project` | `<repo>/.claude/settings.json` | anyone who clones the repo — commit this file |
| `local` | `<repo>/.claude/settings.local.json` | just you, in that repo — gitignored |

```bash
claude plugin install atelier@atelier                          # everywhere
cd ~/my-flutter-app
claude plugin install atelier-flutter@atelier --scope project  # this repo, and everyone who clones it
```

Keeping `atelier` at user scope and the stack plugins wherever suits you both work — `/build` detects the stack *and* whether the plugin is installed, so a missing one makes it say so and carry on rather than fail. Project scope earns its keep for shared repos, where committing `.claude/settings.json` gives teammates the same skills without being told, and for bulky collections you only want in one kind of repo.

To update everything already installed:

```bash
claude plugin marketplace update atelier
claude plugin update atelier@atelier          # restart to apply
```

### Alternative — symlinks (for hacking on the skills)

Clone somewhere durable and link each skill into `~/.claude/skills/`:

```bash
git clone https://github.com/muzalee/claude-atelier.git ~/code/claude-atelier
cd ~/code/claude-atelier
for s in plugins/*/skills/*/; do ln -sfn "$(pwd)/$s" "$HOME/.claude/skills/$(basename "$s")"; done
```

For a single project only, swap `$HOME/.claude/skills` for `/path/to/project/.claude/skills`. Re-run the loop after `git pull` to pick up new skills.

## The pipeline

Five orchestrators run the show. Everything else is a phase skill callable directly.

```
/bootstrap → scaffold a new project
        │
        ▼
/prd     →  scope contract in docs/prd/NNNN-<slug>.md   (optional, project-level)
        │
        ▼
/design  →  one file, .design/YYYY-MM-DD-<slug>.md  (no code)
        │
        ▼
/preflight → checks the plan still matches the repo   (optional, before building)
        │
        ▼
/build   →  reads it, writes code
        │
        ▼
/review  →  reviews the code against it
```

`/ship` replaces the last two steps. Given a finished `.design/YYYY-MM-DD-<slug>.md`, it runs
build → browser test → review → fix → cold review → fix unattended, and leaves a
review-ready PR behind. It does not design anything — `/design` still comes first.

```
.design/YYYY-MM-DD-<slug>.md  →  /ship  →  a PR you only have to read
```

## Orchestrators

- `bootstrap` — scaffold a new project: folder, stack starter, the right folder structure for that stack written to `.claude/rules/0001-structure.md` + CLAUDE.md, `.gitignore`, README, LICENSE, git init, optional GitHub repo with topics
- `design` — pure-design pipeline: grill-me → brief → backend-design → IA → tokens → test-plan → tasks. Output is one markdown file, `.design/YYYY-MM-DD-<slug>.md` — a short form (Problem, Solution, Tasks, Implementation) for small changes, the full form for features. Invoke as `/atelier:design`.
- `build` — reads `.design/YYYY-MM-DD-<slug>.md` and implements: materializes the `### Tokens` spec, runs ui-build against `## Tasks`, then backend-build against `## Architecture`, recording what it built in `## Implementation`.
- `review` — runs code-review + security-review + design-review against the built code, using the design file as the yardstick. Prints findings with stable ids and writes nothing.
- `ship` — `/build` + `/review` run unattended, ending in a PR: branch off main, draft PR, build committing per phase, functional browser test (Orca or Claude-in-Chrome), warm review, fix, cold review in a fresh session against the whole PR, fix, flip to ready. Needs a finished `.design/YYYY-MM-DD-<slug>.md` — it builds, it does not design.

`/prd` is not part of the `/design` pipeline — it sits above it. One PRD covers an initiative; several `.design/YYYY-MM-DD-<slug>.md` files can hang off it, and a design under a PRD has no `## Scope` of its own — the PRD is its scope. When design or build discovers a requirement is wrong, they stop and offer to amend the PRD rather than quietly diverging from it.

## The design file

One markdown file per feature, committed with the code. Each phase skill owns one section, and anything enumerable is a table so a human can scan it.

| Section | Filled by | Holds |
| ------- | --------- | ----- |
| `## Problem` | `design-brief` | The human friction |
| `## Solution` | `design-brief` | The experience, plus a "Considered and rejected" table |
| `## Scope` | `design-brief` | In / out of scope — only when there is no PRD |
| `## Experience` | `design-brief`, `design-tokens` | Philosophy, components, key interactions, responsive, accessibility, and a `### Tokens` block |
| `## Architecture` | `backend-design` | Data model, API surface, auth, invariants, failure modes |
| `## Structure` | `information-architecture` | Routes, navigation, flows, component reuse |
| `## Tests` | `test-plan` | One case per row, plus a "Not testing" table |
| `## Tasks` | `brief-to-tasks` | The build checklist — checkboxes, not a table, so `/build` can tick them |
| `## Implementation` | `/build` and fix passes | A **Built** table per task, and a **Findings** table per review finding fixed |

The short form keeps only Problem, Solution, Tasks and Implementation.

## Phase skills (callable directly)

**Scope:**
- `prd` — product requirements doc: problem, users, requirements, success metrics, non-goals, phases, dependencies, risks. Numbered files in `docs/prd/`, amended in place with a changelog.

**Design phase:**
- `grill-me` — stress-test a plan with relentless questions
- `preflight` — check a plan's claims against the actual repo (files, symbols, signatures, deps, scripts) before building it
- `design-brief` — write a design brief through interview + codebase scan
- `backend-design` — data model, API, auth, scale, observability
- `information-architecture` — structure, nav, flows before visuals
- `design-tokens` — colors, spacing, typography, motion as a spec in the `### Tokens` block of `## Experience` (not code)
- `test-plan` — name the cases (unit / integration / e2e), what to assert, and what NOT to test
- `brief-to-tasks` — break a brief (and test plan) into vertical-slice tasks

**Build phase:**
- `ui-build` — build the frontend from `## Tasks` with strong aesthetics; materializes the token spec if needed. Renamed from `frontend-design` to avoid colliding with Anthropic's official plugin of that name.
- `backend-build` — implement a backend from `## Architecture` (plugins, routes, migrations, tests)

**Runtime discipline (callable anytime during design or build):**
- `errors` — design typed errors with stable codes and cause chains, so a log line tells the full story
- `logging` — emit structured, context-rich logs at the right level; pairs with `errors` for end-to-end debuggability

**Review phase:**
- `code-review` — technical review of changed code (correctness, security, tests, error handling)
- Claude Code's built-in `security-review` runs as its own phase inside `/review` — a dedicated pass, not a duplicate of the checklist above
- `design-review` — visual critique against the brief with screenshots at mobile/tablet/desktop

## Writing craft

- `keep-it-simple` — conventional commit format, PR titles/bodies, branch names, code comments (necessity bar, not brevity bar), and terse docs

## When no skill fits

Atelier does not replace everything. For anything a skill does not cover — a language-specific bug, a stdlib question, a git command, a one-off script, a config tweak — Claude should use its own knowledge rather than force an ill-fitting skill onto it. Skills for the named workflows above, baseline knowledge for everything else.

## atelier-flutter skills

Install `atelier-flutter` in Flutter projects:

- `flutter-conventions` — the official Flutter layout (`lib/{data,domain,ui}` — UI by feature, data/domain by type), one-way layer dependencies, widget and state rules. Defers to the Flutter team's official skills for framework detail and recommends installing them if missing.

## atelier-typescript skills

Install `atelier-typescript` in projects where you work with TypeScript — React on the front, Node/Fastify on the back:

- `typescript-conventions` — house TS rules (type discipline, module shape, async, validation boundaries) plus `references/react.md` and `references/fastify.md`. `/build` detects a TypeScript repo and loads the relevant half automatically.
- `fastify-route` — scaffold a new Fastify route matching the project's existing conventions (schema strategy, auth pattern, error shape, test framework)

## Evals

`plugins/atelier/evals/` holds one case directory per scenario, in the format
`claude plugin eval` runs natively: a `case.yaml` (prompt + limits), one
grader per assertion under `graders/`, and a `scaffold.sh` that copies the
case's fixture from `evals/fixtures/<skill>/` into the run workspace.

```bash
# one suite, one cost ceiling — the usual way to run these
plugins/atelier/evals/run.sh logging

# every suite, each under its own ceiling
plugins/atelier/evals/run.sh all

# knobs
EVAL_RUNS=3 EVAL_BUDGET_USD=12 plugins/atelier/evals/run.sh errors
EVAL_ABLATION=with-without plugins/atelier/evals/run.sh prd
```

`run.sh` wraps the CLI with the flags that are easy to get wrong and a
`--max-cost-usd` ceiling **per suite**, so a budget hit costs one suite's
results rather than the whole 21-case pass. The raw form is:

```bash
claude plugin eval plugins/atelier --tag logging --runs 1 \
  --scaffold --trust-plugin --allow-tools Bash Write Edit
```

`--scaffold` is required — without it the fixture never lands and every case
runs against an empty directory. `--ablation none` skips the no-plugin
baseline arm and halves the cost when you only want the with-plugin score.
Results land in `plugins/atelier/evals/results/` (gitignored).

### What a grader can read

A grader's `focus` decides what the judge is shown, and it defaults to the
agent's closing summary — so an unfocused grader scores the write-up, not the
code. Three forms are accepted:

| `focus` | judge sees |
| --- | --- |
| `last_message` (default) | the agent's closing summary |
| `{source: file, path: src/routes/projects.ts}` | that file's post-run contents |
| `files` | **broken** — reports `(no file changes)` even when the workspace holds the right answer |

So every assertion about code carries the path it is actually about:

```markdown
---
type: llm
focus: {source: file, path: src/routes/projects.ts}
weight: 1
---

Replaces `throw new Error("not found")` with a typed error carrying a stable code
```

Only fixture paths are used as targets. A path the agent invents (`src/lib/errors.ts`)
is not guaranteed to exist under that name, and a grader pointed at a missing file
risks passing vacuously — which is the failure mode to watch for generally, since a
negative assertion ("the postgres message is NOT returned") passes whenever the judge
is shown nothing.

Assertions about what the agent *said* — what it noticed, asked, recommended, or
refused — correctly stay on `last_message`. 72 of the 148 judged graders read a file; the
other 76 are genuinely about the reply.

Grader `type` is one of `regex`, `tool_order`, `tool_used`, `file_exists`, `llm`,
`baseline`. Only `llm` and `baseline` cost a judge call, but the free ones cannot
replace the file assertions: `regex` rejects `focus` in every form and has no
negation, so it cannot be pointed at a file or express absence, and `file_exists`
(with `path`, and optionally `exists: false`) only sees whether a whole file is
there. Every case does carry one free `tool_used: Skill` grader, which is the
ground truth for whether the run measured the skill at all or just plain Claude.

`focus: file` shows the file's contents, never a diff — so "does not edit X" is
only checkable when the forbidden edit would be *visible* as content (a softened
non-goal, a renumbered code). "Stopped rather than editing" is a property of the
reply, not of the file, and belongs on `last_message`.

### Judge model

`run.sh` overrides the CLI's default judge (haiku) with sonnet. Haiku mis-votes a
whole class of assertion: bare negatives ("does not suggest `/atelier:build`") and
anything phrased as a tool action ("**reads** `docs/prd/0001.md`"), failing them
3-0 against messages that plainly comply. On preflight, with grader wording left
untouched, `prd-gate` went 0.33 → 1.00 and `ambiguous-step` 0.33 → 0.71. The judge
was $0.0117 of a $0.31 run, so the fidelity costs almost nothing. Override with
`EVAL_JUDGE=`.
