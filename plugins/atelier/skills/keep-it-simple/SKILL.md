---
name: keep-it-simple
description: House rules for everything written — conventional commits and matching branch names (respecting `.commitlintrc`), PR titles and bodies, code comments (none by default, never historical, a low ratio), and docs. Short, why-focused, no Claude trailers. Use on any git commit, `gh pr create` or `git checkout -b`, and whenever writing or reviewing code comments, docstrings, or README/docs.
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

4. **Code comments** — necessity bar, not brevity bar. The default is **no comment**. Most functions need none: a good name and a clear signature already say it.

   **Write one only when the *why* is non-obvious** — a hidden constraint, a workaround for a specific bug, a subtle invariant, a landmine for a future refactor, a non-obvious reason for an ordering. Then **keep it fully**: a 3-line note explaining a real invariant earns its length, and cutting it to look terse makes a later reader pay for it.

   **Watch the ratio.** Comments should be rare enough to be a signal. More than roughly one per ten lines of new code means they have stopped marking the interesting parts and become narration — at that point a reader skims past all of them, including the one that mattered. If a file's diff has a comment on most lines, delete until only the non-obvious ones remain.

   **Never write a historical comment.** Comments describe the code as it is, never how it got here. Git already has the history, and a comment about a change rots the moment the next change lands:

   ```js
   // ✗ every one of these is deleted, not reworded
   // Changed per review feedback
   // Added in the auth refactor
   // Previously this used a Map
   // TODO: remove once the old flow is gone   ← if it must exist, it is an issue, not a comment
   // as discussed with the user
   // used by the flow above
   ```

   **Also cut**: restating what the code obviously does, commented-out code, fluff paragraphs that repeat the diff, and decorative section banners (`// ===== HELPERS =====`).

   The test: if removing the comment would not confuse a reader six months from now who has never seen this PR, delete it.

5. **Docstrings** — one short line max. Skip entirely if the function name and signature already tell the story.

6. **Explanations to the user** — answer first, elaborate only if asked. Skip preamble ("Sure! I'll now...", "Great question!"). No trailing recap of what you just did — the diff shows it.

7. **README / docs** — cover what the reader needs to *do*, not everything you know. Bullet lists beat paragraphs.

## Git mechanics

- **Branch names** use the same conventional-commit prefix as the commit that will merge them: `<type>/<short-kebab-desc>`. Type matches the leading commit type (`feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`, `build`, `perf`, `revert`). Description is kebab-case, ≤50 chars, no trailing issue number.
  - Good: `feat/test-plan-in-design`, `fix/expired-token-401`, `ci/rename-release-workflow`
  - Bad: `my-branch`, `stuff`, `feat-test-plan-in-design` (hyphen instead of slash), `feature/adds-a-new-thing-that-does-lots-of-stuff` (`feature` isn't a conventional-commit type; also too long)
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
