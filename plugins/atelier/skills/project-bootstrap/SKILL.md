---
name: project-bootstrap
description: Scaffold a new project from scratch — folder, .gitignore, README, LICENSE, git init + first commit, and (if gh is authed) create the GitHub repo with description, topics, and visibility. Use when user says "start a new project", "bootstrap", "new repo", "scaffold X", or asks to set up a fresh codebase.
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
   - **Stack** (Node/Fastify, Next.js, Vite/React, Python, Go, static HTML, or "empty" for language-agnostic)
   - **License** (MIT default, or "none" to skip)
   - **GitHub**: create a repo now? public/private? topics (comma-separated, e.g. `fastify,api,typescript`)?

2. **Scan the parent folder first.** Confirm the target path doesn't already have a folder with that name. If it does, stop and ask.

3. **Create the folder + scaffolding**:
   - Root folder at the path the user chose (default: current working directory).
   - `.gitignore` matching the stack (see templates below).
   - `README.md` with title, one-line purpose, install/run section stubbed for the stack, and a "License" line.
   - `LICENSE` file if requested (MIT by default — pull from stack template).
   - Stack-appropriate starter files (see below). Keep to the *minimum* — no test framework, no linter config, no CI unless user asks. This is a bootstrap, not a full kit.

4. **`git init`** and make the first commit. Message format: `Initial commit — <one-line purpose>`. **Do NOT add `Co-Authored-By: Claude` trailer.**

5. **GitHub (if requested)**:
   - Check `gh auth status` first. If not authed, print the exact `gh auth login` command and skip repo creation.
   - Run `gh repo create <name> --description "<purpose>" --public|--private --source=. --remote=origin --push`
   - Add topics: `gh repo edit --add-topic <topic1> --add-topic <topic2> ...`
   - Print the repo URL.

6. **Summarize** in ~3 lines: what was created, git status, GitHub URL (if made). Nothing more.

## Stack starters

Keep each starter tiny — the user can grow from here.

### Node / Fastify (TypeScript)
Files: `package.json`, `tsconfig.json`, `src/server.ts` (Fastify hello-world), `.gitignore` (see below).
`package.json` scripts: `dev`, `build`, `start`. Deps: `fastify`. DevDeps: `typescript`, `@types/node`, `tsx`.

### Next.js
Delegate to `npx create-next-app@latest <name> --typescript --app --tailwind --eslint --no-src-dir --import-alias "@/*"`. Then add README + topics on top.

### Vite / React
`npm create vite@latest <name> -- --template react-ts`. Then add README + topics.

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
