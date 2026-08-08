---
name: keep-it-simple
description: Apply to all written output — commit messages, PR titles/descriptions, code comments, documentation, and explanations. Enforces conventional-commit format for git (feat/fix/chore/etc. + scope + short subject), matches project convention if `.commitlintrc.*` is present, keeps everything short and why-focused, and never adds "Co-Authored-By Claude" or "Generated with Claude Code" trailers. Trigger on any writing task, especially git commit, gh pr create, adding comments/docstrings, or writing README/docs.
---

Default to the shortest form that still conveys the point. Structure follows a convention where one exists; tone stays terse everywhere.

## Rules

1. **Commit messages** — always conventional-commit format:

   ```
   <type>(<scope>): <subject>

   [optional body — only if the "why" isn't in the subject]
   ```

   - **Types**: `feat` `fix` `perf` `refactor` `docs` `test` `build` `ci` `chore` `revert`.
   - **Subject**: imperative mood, no trailing period, ≤72 chars, focused on *why* not just *what*.
   - **Body**: 1–2 sentences, only when the subject doesn't cover it. Skip otherwise.
   - **Detect project convention first**: check `.commitlintrc.json` / `.commitlintrc.yml` / `commitlint.config.js` / `commitlint` key in `package.json`. If a `scope-enum` exists, use only those scopes. If none, derive from the touched area or omit.
   - **Do NOT add `Co-Authored-By: Claude <...>` trailer.** Ever.

2. **PR titles** — same conventional format as commits. Since squash-merge uses the PR title as the commit message on main, a bad title poisons history.

3. **PR descriptions** — short summary (1–3 bullets), short test plan (checklist). No essay. **Do NOT add "🤖 Generated with Claude Code" trailer.**

4. **Code comments** — only write one when the *why* is non-obvious (a hidden constraint, a workaround for a specific bug, a subtle invariant). Never restate what the code does. Never write multi-line comment blocks.

5. **Docstrings** — one short line max. Skip entirely if the function name and signature already tell the story.

6. **Explanations to the user** — answer first, elaborate only if asked. Skip preamble ("Sure! I'll now...", "Great question!"). No trailing recap of what you just did — the diff shows it.

7. **README / docs** — cover what the reader needs to *do*, not everything you know. Bullet lists beat paragraphs.

## Git mechanics

- **Pick one type + one scope per commit.** If the diff spans multiple concerns, split into multiple commits rather than forcing them into one.
- **Use HEREDOC for multi-line messages** to preserve formatting:

  ```bash
  git commit -m "$(cat <<'EOF'
  type(scope): subject

  Optional body.
  EOF
  )"
  ```

- **No `--no-verify`.** If a pre-commit hook fails, fix the underlying issue.
- **No `--amend` on pushed commits.** Only amend an unpushed commit you authored in this session.
- **Match the repo's prior style.** If recent commits use short one-liners, do the same. If they include bodies, do the same.

## Why

Over-explanation wastes tokens, obscures the point, and rots (comments that describe the *what* diverge from the code the moment either changes). Conventional-commit format makes history parseable by tools (release-please, changelog generators) and by humans running `git log --oneline`. Short output respects the reader.

## Examples

**Bad commit:**
```
Add user authentication middleware

This commit introduces a new middleware for handling user authentication.
It validates JWT tokens on incoming requests, extracts the user ID, and
attaches it to the request object for downstream handlers to use...

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Good commit:**
```
feat(auth): add JWT middleware so /api routes require a valid token
```

**Bad commit** (no scope, generic subject):
```
chore: update
```

**Good commit** (scope + specific subject):
```
chore(deps): bump fastify to 5.1.0 for the async-hooks fix
```

**Bad PR title:** `Fixes bug in auth`
**Good PR title:** `fix(auth): reject expired tokens instead of treating them as anonymous`

**Bad comment:**
```js
// This function takes a user object and returns their full name by
// concatenating first and last name with a space in between.
function fullName(user) { return `${user.first} ${user.last}`; }
```

**Good comment:** (none — the code is self-explanatory)
```js
function fullName(user) { return `${user.first} ${user.last}`; }
```

**Bad explanation:** "Sure! I've now finished implementing the changes you requested. Here's a summary of what I did: 1) I edited file X, 2) I added function Y, 3) ..."

**Good explanation:** "Done. Added `parseConfig` in config.ts:42."
