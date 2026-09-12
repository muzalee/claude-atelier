---
name: bootstrap
description: Scaffold a new project from scratch — folder, stack starter, the right folder structure for that stack, CLAUDE.md, `.claude/rules/`, .gitignore, README, LICENSE, git init + first commit, and (if gh is authed) the GitHub repo with description, topics, and visibility. Use when the user says "start a new project", "bootstrap", "new repo", "scaffold X", or asks to set up a fresh codebase.
---

Bootstrap a new project end-to-end. Ask the small handful of things you actually need, then build it. Don't over-configure — a bootstrap is a starting point, not a finished template.

## Example prompts

- "Start a new project for a Fastify API called notes-api"
- "Bootstrap a Next.js app and push it to GitHub"
- "Scaffold a Node CLI project"
- "New repo: a static site for my resume"
- "Set up a fresh Python project"

## Process

1. **Ask 4 questions max** (batch them if you can, but respect the user's preference — they may want one at a time):
   - **Name + one-line purpose** (used for folder name, README title, repo description)
   - **Stack** (Node/Fastify, Next.js, Vite/React, Flutter, Python, Go, static HTML, or "empty" for language-agnostic)
   - **License** (MIT default, or "none" to skip)
   - **GitHub**: create a repo now? public/private? topics (comma-separated, e.g. `fastify,api,typescript`)?

2. **Scan the parent folder first.** Confirm the target path doesn't already have a folder with that name. If it does, stop and ask.

3. **Create the folder + scaffolding**:
   - Root folder at the path the user chose (default: current working directory).
   - `.gitignore` matching the stack (see templates below).
   - `README.md` with title, one-line purpose, install/run section stubbed for the stack, and a "License" line.
   - `LICENSE` file if requested (MIT by default — pull from stack template).
   - Stack-appropriate starter files (see below). Keep to the *minimum* — no test framework, no linter config, no CI unless user asks. This is a bootstrap, not a full kit.

4. **Lay out the folder structure for the stack, and write it down.** A structure chosen now and recorded is a structure the next fifty files follow; one chosen now and left implicit is one that drifts by the third feature.

   Get the structure from the stack's conventions skill rather than inventing one:

   | Stack | Structure from | Shape |
   | ----- | -------------- | ----- |
   | React / Next.js | `typescript-conventions` → `references/react.md` | bulletproof-react: `src/{app,components,config,features,hooks,lib,stores,types,utils}`, features self-contained, deps flow shared → features → app |
   | Node / Fastify | `typescript-conventions` → `references/fastify.md` | `src/plugins/` for infrastructure, `src/modules/<domain>/` per domain, `app.ts` separate from `server.ts` |
   | Flutter | `flutter-conventions` (from `atelier-flutter`) | official Flutter layout: `lib/{data,domain,ui}`, UI by feature, data/domain by type, `test/` mirrors `lib/` |
   | Python / Go / static | no house structure — use the ecosystem default and say so | |

   If the stack's plugin is not installed, say so in one line, use the ecosystem default, and continue.

   Create the directories, with a `.gitkeep` in any that would otherwise be empty — an empty folder is invisible to git, so the structure you just designed would not survive the first clone.

   Then record the decision in two places:

   - **`.claude/rules/0001-structure.md`** — the full convention: the tree, what belongs in each folder, and the rule for when something gets promoted to shared. Numbered so later rules (`0002-`, `0003-`) sit beside it in order, the same way `docs/prd/` numbers PRDs. This is what `/build` reads before writing a file.
   - **`CLAUDE.md`** — a short section pointing at it, because `CLAUDE.md` is what Claude Code loads automatically every session:

     ```markdown
     ## Project structure

     Feature-first. See `.claude/rules/0001-structure.md` for the full convention.
     New code goes in `src/features/<feature>/`; promote to shared only on the second real consumer.
     ```

   Keep `CLAUDE.md` to what is true on day one — the stack, how to run it, the structure pointer. Do not pad it with aspirations. For auditing and growing it later, point the user at the `claude-md-improver` skill rather than doing that work now; there is nothing to audit in a repo with four files.

5. **`git init`** and make the first commit. Message format: `Initial commit — <one-line purpose>`. **Do NOT add `Co-Authored-By: Claude` trailer.**

6. **GitHub (if requested)**:
   - Check `gh auth status` first. If not authed, print the exact `gh auth login` command and skip repo creation.
   - Run `gh repo create <name> --description "<purpose>" --public|--private --source=. --remote=origin --push`
   - Add topics: `gh repo edit --add-topic <topic1> --add-topic <topic2> ...`
   - Print the repo URL.

7. **Summarize** in ~3 lines: what was created, git status, GitHub URL (if made). Nothing more.

## Stack starters

Keep each starter tiny — the user can grow from here.

### Node / Fastify (TypeScript)
Files: `package.json`, `tsconfig.json`, `src/server.ts` (Fastify hello-world), `.gitignore` (see below).
`package.json` scripts: `dev`, `build`, `start`. Deps: `fastify`. DevDeps: `typescript`, `@types/node`, `tsx`.

### Next.js
Delegate to `npx create-next-app@latest <name> --typescript --app --tailwind --eslint --no-src-dir --import-alias "@/*"`. Then add README + topics on top.

### Vite / React
`npm create vite@latest <name> -- --template react-ts`. Then add README + topics.

### Flutter
`flutter create <name> --org com.<yourorg> --platforms ios,android`. Then restructure `lib/` feature-first per `flutter-conventions` — `flutter create` produces a single `main.dart`, which is the layer-first default this house does not use. Recommend the official Flutter skills if they are not installed.

### Python
Files: `pyproject.toml` (or `requirements.txt`), `src/<name>/__init__.py`, `README.md`.
Use `uv init` if `uv` is installed, else `pyproject.toml` by hand.

### Go
`go mod init github.com/<user>/<name>` (ask for github user if not knowable), `main.go` with hello-world.

### Static HTML
`index.html`, `styles.css`, `README.md`. No build step.

### Empty
Just `.gitignore` (with `.DS_Store`, `.env`, `node_modules/`), `README.md`, and a `src/` folder if the user wants one.

## .gitignore templates

Always include: `.DS_Store`, `.env`, `.env.*`, `*.log`.

Add per stack:
- **Node/JS/TS**: `node_modules/`, `dist/`, `build/`, `.next/`, `coverage/`, `.turbo/`
- **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`, `.pytest_cache/`, `.ruff_cache/`
- **Go**: `bin/`, `*.exe`, `vendor/`
- **Static**: nothing extra beyond the always-include set.

## README template

```markdown
# <name>

<one-line purpose>

## Getting started

<stack-appropriate install + run commands>

## License

<MIT | none>
```

Keep it under 20 lines. The `keep-it-simple` skill applies — no over-explaining.

## GitHub topics

If the user doesn't provide topics, suggest 3–5 based on the stack and purpose, then confirm before setting. Examples:
- Fastify API: `fastify`, `nodejs`, `typescript`, `api`
- Next.js app: `nextjs`, `react`, `typescript`, `tailwindcss`
- Python CLI: `python`, `cli`, `command-line`

## Rules

- **Ask before overwriting.** If any target file or folder exists, stop and ask.
- **No boilerplate the user didn't ask for.** No ESLint, Prettier, Husky, GitHub Actions, Dockerfile, or test framework unless requested. Each of those is its own decision.
- **`gh` is opt-in.** Don't run it if the user didn't say "and push to GitHub" or similar. Local scaffolding is always the default.
- **Commit message follows `keep-it-simple`.** One sentence. No Co-Authored-By trailer.
- **Don't lecture the user on what was created.** Short summary at the end, done.

## Anti-patterns

- Generating a 200-line README with badges, screenshots, contributing guide, code of conduct. This is a bootstrap.
- Installing a test runner, linter, formatter, and CI on day one. Let the user pull those in when they need them.
- Running `gh repo create` without confirming public/private and topics first.
- Creating the folder outside the user's chosen path because it "seemed more organized."

## Done when

- The folder exists with the stack starter, `.gitignore`, `README.md`, and `LICENSE` if requested
- The folder structure for the stack is created, with `.gitkeep` in any empty directory
- `.claude/rules/0001-structure.md` records the convention, and `CLAUDE.md` points at it
- `git init` done and the first commit made
- The GitHub repo exists with description and topics, or you said why it does not

**Then hand off.** Say: "`<name>` is set up at `<path>`. Next: **`/atelier:prd`** to pin down what you're building and what's out of scope, or **`/atelier:design`** to go straight at the first feature." 
