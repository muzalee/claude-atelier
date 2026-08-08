---
name: keep-it-simple
description: Apply to all written output — commit messages, PR descriptions, code comments, documentation, and explanations. Keep it short, no over-explaining, no filler. Never add "Co-Authored-By Claude" trailer on commits. Trigger on any writing task, especially git commit, PR create, adding comments/docstrings, or writing README/docs.
---

Default to the shortest form that still conveys the point.

## Rules

1. **Commit messages**: 1–2 sentences focused on *why*, not a bullet list of what changed. Skip the boilerplate. **Do NOT add `Co-Authored-By: Claude <...>` trailer.**

2. **PR descriptions**: short summary (1–3 bullets), short test plan. No essay. No "🤖 Generated with Claude Code" trailer unless the user asks for it.

3. **Code comments**: only write one when the *why* is non-obvious (a hidden constraint, a workaround for a specific bug, a subtle invariant). Never restate what the code does. Never write multi-line comment blocks.

4. **Docstrings**: one short line max. Skip entirely if the function name and signature already tell the story.

5. **Explanations to the user**: answer first, elaborate only if asked. Skip preamble ("Sure! I'll now...", "Great question!"). No trailing recap of what you just did — the diff shows it.

6. **README / docs**: cover what the reader needs to *do*, not everything you know. Bullet lists beat paragraphs.

## Why

Over-explanation wastes tokens, obscures the point, and rots (comments that describe the *what* diverge from the code the moment either changes). Short output respects the reader.

## Examples

**Bad commit:**
```
feat: Add user authentication middleware

This commit introduces a new middleware for handling user authentication.
It validates JWT tokens on incoming requests, extracts the user ID, and
attaches it to the request object for downstream handlers to use...

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Good commit:**
```
Add JWT auth middleware — routes under /api now require a valid token.
```

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
