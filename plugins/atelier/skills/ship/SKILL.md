---
name: ship
description: Explicit-invocation-only orchestrator that takes a feature from a completed `.design/YYYY-MM-DD-<slug>.md` all the way to a review-ready pull request, unattended — branch off latest main, open a draft PR, build committing per phase, functionally test the result in a real browser, run a warm review, fix, run a cold review in a fresh session against the whole PR, fix, then flip the PR to ready. Invoked ONLY when the user types /ship or explicitly asks to "ship this", "run the ship pipeline", or "build and open a PR unattended". DO NOT auto-trigger from adjacent talk about branches, PRs, building, or reviewing — those have their own skills.
---

This skill runs the whole delivery loop without asking permission between steps. The user typed `/ship` because they want to come back to a finished pull request, not to a question.

Where `/build` stops at working code and `/review` stops at a report, this closes the loop: the code gets built, exercised, reviewed twice, fixed, and handed over as a PR that is ready to read.

```
/design  → docs         /build → code         /review → report
/ship    → branch → draft PR → build → browser test → warm review → fix
                  → cold review (fresh session, whole PR) → fix → ready PR
```

## Prerequisites

- A design file with at minimum `## Problem`, `## Solution` and `## Tasks` filled. Find the feature's design file by the procedure in `design/SKILL.md` → **Finding the design file** (glob `.design/*.md`; two legacy folder shapes still read; several matches take the most recent date and say which; reuse the name verbatim; never create a second one). Every stage below reads it and writes only its `## Implementation` section; `/ship` never creates or renames a design file. This gate is real here, unlike in `/build`: ship runs unattended through build, review, fix, and PR, and every one of those stages measures against the plan. Without it there is nothing to check the work against and nothing to write a PR description from.

  Stop and offer the fork: `/design` if it is a feature, or `/build` then `/atelier:code-review` and a commit if it is small enough not to want a plan. Do not ship a small change through a pipeline built for features.
- A clean working tree. Uncommitted changes would end up in the PR attributed to this run. Stop and ask.

  **An uncommitted `.design/YYYY-MM-DD-<slug>.md` is the exception.** It belongs in the repo — commit it as `docs(design): <slug> design` per `keep-it-simple`, say you did in one line, and carry on. Only the design file gets this; a dirty source file still stops the run.
- `gh` authenticated (`gh auth status`), **and a remote configured** (`git remote -v`). These fail independently: `gh` can be authenticated in a repo that has no remote at all.
  - **No remote** — `git fetch origin` fails in stage 1 too, not just the PR step. Branch off local `main`, say so in one line, and run everything except the push and the PR.
  - **No `gh`** — run everything else and stop before the PR step, telling the user what is left.

## Operating rules

1. **Unattended means unattended.** Announce each stage in one line as you enter it, then do it. No "Ready?", no checkpoints, no summaries between stages. The user chose this skill over `/build` + `/review` precisely to avoid those.

2. **Stop only on a real blocker.** Exactly four things halt the run:
   - A `/build` blocker under its own rule 6 (docs contradict the codebase, a destructive migration, an unavailable dependency with no obvious fallback).
   - A failing test you cannot fix within the scope of the task.
   - A **must-fix finding from `security-review` that you cannot fix within the task's scope.** A fixable one goes through stage 6 like any other finding; an unfixable one halts, because security findings are never "note it in the PR and ship anyway" material. Unfixable means the repo lacks what the fix needs — no auth layer, no user model — not that the fix is tedious.
   - **A stage asking for a human decision.** Unattended means you do not interrupt for progress reports; it does not mean you guess at a question that was put to you. If the build stops and asks something, that question is the blocker.

   When you stop, always do all five of these. A halted run that preserved its work is recoverable; one that discarded it is not.

   1. **Push what the build already committed.** Do not commit work it left half-finished mid-phase — that code is not yours and its author did not think it was done. Say it is there and uncommitted.
   2. **Leave the PR as a draft**, and write the blocker into its "Known findings" section. The PR body is the only channel that survives this transcript; a blocker that exists only in chat is lost the moment the session ends.
   3. **Leave a spawned terminal open at its prompt.** Stage 3's "close the terminal" step is for a finished run. Closing a halted one throws away the build's accumulated context and forces a restart from the beginning. Record the handle and read cursor so the run can resume.
   4. **Name the stage that stopped and quote the failure or question verbatim.** Paraphrasing a question loses the detail that made it unanswerable.
   5. **Recommend, but do not apply.** Saying what you would do if told to proceed is useful and is not the same as deciding — the ban in stage 3 is on *answering* the build, not on having an opinion for the user.

3. **Everything else gets fixed or written down.** A finding you cannot fix cleanly goes in the PR description under "Known findings", with its id. Silently dropping a finding is the one outcome worse than leaving it open.

   **The reviews write no files.** `code-review`, `security-review` and `design-review` print their findings; the ids (`CR-n`, `SEC-n`, `DR-n`, `CCR-n`, `CSEC-n`, plus `FT-n` from stage 4) are how a fix pass reports back and how the PR names what is still open. Each finding ends up in exactly one of two places: fixed and recorded in `## Implementation`, or open and listed in the PR body. There is no third place, and no report file to commit.

4. **One fix pass per review.** Fix the warm findings once, fix the cold findings once, then finish. Re-reviewing after each fix until clean sounds thorough and in practice loops on findings that contradict each other. Anything still open after its one pass goes in the PR description.

5. **Pass the conventions down explicitly.** When you invoke `build`, name its house conventions and its no-historical-comments rule in the instruction. A sub-skill that is not told builds to its own defaults, and the fix passes are exactly where "// changed per review feedback" comments creep in.

6. **Commit per phase, never in one lump.** Each build phase is its own commit, following `keep-it-simple`. A reviewer reading a 40-file single commit cannot tell the frontend work from the backend work, and neither can `git bisect`.

   The commit carries that phase's code **and** the `## Implementation` lines recorded for it. The log and the diff it explains land together, or a reviewer reads them a commit apart and the record trails the work it describes.

7. **The build runs with its gates off, and you say so in the instruction.** `/build` asks "Next phase: X. Go?" between phases by default. Nobody is at this terminal to answer, so **every instruction this skill sends to a build begins with `go all phases — do not gate between them, there is nobody at this terminal to answer`** — in the literal text, not implied by the fact that an orchestrator sent it. A build that gates inside an unattended run stops at phase 1, stage 3 reads that prompt as a question, and rule 2 halts the whole run over a checkpoint nobody needed.

## Stage 1: Branch

```bash
git fetch origin
git checkout -b <type>/<slug> origin/main    # or origin/master — check which exists
```

Branch type follows `keep-it-simple`: `feat/`, `fix/`, `chore/`. Derive the slug from the design folder. Branch off the **freshly fetched** remote main, not the local one — a stale local main produces a PR full of other people's changes.

## The build terminal — read this before stage 2

Stages 2 and 3 both run build phases, and both run them the same way: in a terminal spawned here, not inline in this session. The procedure is here, ahead of its first use, because a forward reference to a procedure is not a procedure.

### Is Orca usable?

Three conditions, all required:

```bash
command -v orca                 # 1. installed
orca status --json              # 2. runtime reachable — `orca open` first if installed but closed
orca terminal create --worktree active --command "claude" --json   # 3. actually returns a handle
```

A reachable runtime is not the same as a usable terminal: Orca scopes terminals to worktrees it manages, so `terminal create` returns `selector_not_found` in any directory outside one — with `status` reporting perfectly healthy. Treat a failure from `terminal create` exactly like Orca being absent.

**The terminal is the normal path. Inline is the exception.** It buys isolation, lets a long build run without occupying this session, and makes the build's state observable from outside — which is the whole point of the state detection below. Do not fall back to inline because inline looks simpler; fall back only when one of the three conditions actually failed.

**When you do fall back, name which of the three failed** — "`orca` is not installed", "`orca status` reports the runtime unreachable", "`orca terminal create` returned `selector_not_found`; this directory is not an Orca worktree" — in one line, then follow `build/SKILL.md` directly in this session and skip the state-detection procedure entirely; there is no separate session to inspect, so "finished, errored, or waiting" is simply whatever you observe as you go. Everything else in the pipeline is unchanged: same stages, same blockers, same PR. A fallback with no reason given reads like a choice, and the next reader cannot tell whether Orca was broken or just unexamined.

### Spawning it

Use an **interactive** session, not `claude -p`. Print mode cannot ask a question — it either finishes or fails — which throws away the signal this whole arrangement exists to detect.

```bash
orca terminal create --worktree active --command "claude" --json     # returns a handle
orca terminal send --terminal <handle> --text "<the build instruction>" --enter
```

### What the instruction must contain

Every build instruction sent from this skill, at stage 2, stage 3, and the fix stages, contains all five of these **in the literal text**:

1. **`go all phases — do not gate between them, there is nobody at this terminal to answer`.** `/build` gates between phases by default and would stop at phase 1 waiting for a human. Rule 7. This goes first, in those words.
2. The **design file path**, `.design/YYYY-MM-DD-<slug>.md`.
3. The **house conventions it must load** — its own House Conventions section lists them.
4. The **no-historical-comments rule**, restated: comments describe the code as it is, never how it got here.
5. The instruction to **commit at the end of each phase**, carrying that phase's `## Implementation` lines.

```bash
orca terminal send --terminal <h> --enter --text "Read build/SKILL.md and follow it. go all phases — do not gate between them, there is nobody at this terminal to answer. Design file: .design/2026-09-02-user-settings.md. Load the house conventions from build's House Conventions section — errors, logging, keep-it-simple, plus the stack conventions. No historical comments: comments describe the code as it is, never how it got here. Commit at the end of each phase, with that phase's ## Implementation lines in the same commit."
```

### Telling finished from errored from waiting (terminal mode only)

This is the part that goes wrong if rushed. A terminal that has stopped producing output is *either* done, *or* asking you something, *or* wedged — and they look identical until you read it.

```bash
orca terminal wait --terminal <h> --for exit --timeout-ms 600000 --json
```

- **Returns with exit code 0** → the phase finished. Read the tail to confirm what it did, then continue.
- **Returns with a non-zero exit code** → it failed. Read the output, and treat it as a blocker unless the failure is something you can fix inside the task's scope.
- **Times out** → not finished. Do not assume either way. Check whether it is idle:

```bash
orca terminal wait --terminal <h> --for tui-idle --timeout-ms 60000 --json
orca terminal read --terminal <h> --cursor <n> --json
```

**`tui-idle` is not "done" and it is not "stuck" — it is "stopped producing output", and only reading the tail distinguishes them.** Treating idle as done is how a run reports success on a build that never started, so read before deciding:

| The tail shows | It means | Do |
| -------------- | -------- | -- |
| A question, a prompt, a permission request, a menu | It is waiting on a human | **Blocker.** Push, keep the PR draft, quote the question verbatim, ask, wait. |
| A completion summary, "done", a clean exit message | It finished without exiting the session | Continue. |
| An error, a stack trace, a failed command | It failed | Read it; fix if in scope, otherwise blocker. |
| Nothing new since the last cursor, and no prompt | Wedged | Blocker. Say it produced no output for N minutes rather than claiming it failed — you do not know that it did. |

Track the cursor from each `terminal read` and pass it to the next so you read only new output. Poll rather than waiting one long blind timeout: a phase that has been silent for ten minutes is worth reporting even if the timeout was thirty.

**Never answer a question the build asks you.** It stopped because the answer was not derivable from the design file — which is exactly the situation where guessing produces code that looks agreed and is not. Rule 2 applies: that question is the blocker. A build that got the `go all` instruction should not be asking about phases at all; if it is asking, it is asking about something real.

## Stage 2: First build phase, then the draft PR

Spawn the build terminal and send the first phase — the commands, in order, not a reference to them:

```bash
orca terminal create --worktree active --command "claude" --json     # returns a handle
orca terminal send --terminal <h> --enter --text "<the instruction, with `go all phases` first — see 'What the instruction must contain'>"
```

If Orca is not usable by the three conditions above, say which one failed and run the phase inline instead.

Then wait for the phase by the state-detection procedure above, commit it, push, and open the PR as a draft immediately. Opening it early rather than at the end means the work is visible while it happens, and a run that halts later still leaves something to look at.

```bash
git push -u origin <branch>
gh pr create --draft --title "<conventional commit title>" --body "<body>"
```

The PR body is written now and updated as the run proceeds. Follow `keep-it-simple`: what changed and why, no ceremony. Include the design file path so a reader can find the intent, and leave a "Known findings" section that later stages fill in or remove.

## Stage 3: Remaining build phases

Same terminal, same procedure — it is already running and already has the `go all` instruction, so the remaining phases run without another prompt. Watch them by the state-detection table above.

When the phases are done, close the terminal (`orca terminal close --terminal <h>`) and push.

## Stage 4: Functional browser test

**This is not the design review.** The design review looks at the page; this stage *uses* it. Click the button. Type in the field. Submit the form. Verify what `## Experience` said would happen actually happens.

Skip this stage only when the change genuinely has no user-facing surface — a migration, a build script, an internal refactor. Say you skipped it and why.

**Pick a driver, in this order:**

1. **Orca** — if `command -v orca` succeeds and `orca status --json` reports the runtime reachable. If Orca is installed but not running, `orca open` first.
2. **Claude-in-Chrome** — the `mcp__claude-in-chrome__*` tools, if available.
3. **Neither available** — say so, skip the stage, and note in the PR that the changes were not exercised in a browser. Do not pretend a code read is a functional test.

**Driving Orca** (verified command surface):

```bash
orca tab create --url http://localhost:3000/<route>
orca snapshot                                  # accessibility tree with refs e1, e2, ...
orca click --element e3
orca fill --element e5 --value "test@example.com"
orca keypress --key Enter
orca get --element e7 --what text              # text | html | value | url | title
orca is  --element e7 --what visible           # visible | enabled | checked
orca screenshot --format png
orca wait --timeout 2000
```

**Element refs change after any navigation — re-snapshot before interacting.** This is the single most common way a browser script silently clicks the wrong thing.

Start the dev server first if it is not running, and shut down anything you started when the stage ends.

**What to actually test:** walk the primary user journey named in `## Experience`. For each interactive element the change touched — does it respond, does it do the right thing, does it handle the empty and invalid case. Check the browser console for errors that the happy path produced anyway.

Take screenshots if they help you see what is happening. **Nothing is saved and nothing is committed** — no `screenshots/` folder, no test record file. What you exercised goes in the PR description at stage 8; what broke goes through the steps below.

### Fix what the browser found, before stage 5

Reviewing code you already know is broken wastes the review. So this stage does not end at "found three problems" — it ends with them fixed, or named.

1. **Number each defect `FT-1`, `FT-2`,** in the order found. The `FT-` prefix keeps a browser defect distinct from `CR-n` and `DR-n`, so the PR and `## Implementation` can tell which pass caught what.
2. **Fix them through `build`'s "from a review report" path**, exactly as stages 6 and 8 do — same house conventions, same ban on historical comments, same `go all` instruction if you spawn a terminal for it.
3. **Commit** (`fix:` per `keep-it-simple`), re-run the tests, push.
4. **Record each one in `## Implementation`**: the id, what was broken, what fixed it — one line each, the same shape as a review finding.
5. **Only then enter stage 5.**

**A defect you cannot fix inside the task's scope** is a rule 2 blocker if it breaks the primary journey, and a Known findings entry in the PR — its id and a one-line reason — if it does not. Do not enter the warm review with a known-broken journey, and do not carry an `FT-n` forward silently: every one is fixed and recorded, blocked on, or listed in the PR.

## Stage 5: Warm review

Read and follow, in order, against the changes on this branch:

1. `code-review/SKILL.md` → `CR-n` findings
2. Claude Code's built-in `security-review` → `SEC-n` findings
3. `design-review/SKILL.md` → `DR-n` findings (skip when there is no UI)

**The findings stay in this session.** No report files: what gets fixed in stage 6 is recorded in `## Implementation`, what stays open goes in the PR's Known findings. Keep the full list to hand until stage 6 has worked through it.

Run the three skills directly rather than the `/review` orchestrator — it gates on confirmation between phases, which is correct for interactive use and wrong here.

Two things that go wrong in an unattended run:

- **`design-review` will try to stop and ask for screenshots** when it cannot drive a browser — correct interactively, wrong here. If no driver worked in stage 4, or the app will not start, **skip the design review and say why**, in the PR. It is not a rule 2 blocker; it is the same skip stage 4 already took, for the same reason.
- **`security-review` resolves its own diff, and can resolve the wrong one.** Confirm the findings it returns are about files in this branch before trusting them — a review of some other tree reads exactly like a clean one. If it targeted the wrong repository, run the security pass against the correct diff yourself and say plainly that you substituted.

This review is **warm**: you built this, so you know what every line was meant to do. That is worth something on intent and worth nothing on blind spots, which is what stage 7 is for.

**Every finding carries a stable id** — `CR-n` from `code-review`, `DR-n` from `design-review`, and `SEC-n` which you assign as the security findings come back, since `security-review` does not number its own. The fix pass reports against them one by one, and the PR names what is still open by id.

## Stage 6: Fix the warm findings

Read `build/SKILL.md` and follow its **"from a review report"** path — fixing findings is a build pass, and it carries the same conventions, the same ban on historical comments, the same `go all` instruction when you spawn a terminal for it, and the same duty to record what changed in `## Implementation`, one line per finding id.

Fix must-fix and should-fix findings. Consider-level ones are optional; take the cheap ones. A finding you disagree with is not one you ignore: say why in a line and leave it, which is a position the user can overrule.

Commit the fixes (`fix:` per `keep-it-simple`), re-run the tests, and push. Report each finding as fixed, or as not-fixed with a one-line reason. Every fix gets its line in `## Implementation`; anything not fixed goes to the PR's Known findings. Those two places are the entire record — there is no report file to update.

## Stage 7: Cold review

The point of a cold review is that it has no idea what you meant. A reviewer who watched the code get written rationalizes it; one who arrives at the diff cold reads what is actually there. Almost everything stage 5 missed is the kind of thing only a stranger sees.

**Spawn a subagent with no context from this conversation.** Give it only:

- the **full PR diff** — every change in the PR, not just the most recent phase. **Paste the output of `gh pr diff <number>` into the instruction** rather than telling the agent to run it. Where no PR exists (no remote), paste `git diff main...HEAD` instead — the point is the complete set of changes, not the transport. An agent with a shell will also reach `git log`, the commit messages, and the `## Implementation` section of the design file — each of which arrives warm, having defeated the entire stage. Tell it explicitly not to read git history, and to read `## Problem`, `## Solution`, `## Scope` and `## Experience` of the design file but **not** `## Implementation`.
- the **PR title and description**, labelled as *an unverified claim about the code, not a specification*. That label is what stops the reviewer "fixing" correct code to match a stale sentence.
- the design file's intent sections — `## Problem`, `## Solution`, `## Scope`, `## Experience` — as the statement of intent, and the PRD if one exists; say so plainly when there is none rather than implying it is required.
- the instruction to read `code-review/SKILL.md` and follow it, then run `security-review`.

Spawn a **fresh general-purpose agent, never a fork** — a fork inherits this conversation, which is the one thing the stage exists to prevent.

**The subagent reports its findings back to you and writes nothing.** It should not be editing the file it is fenced out of, and the cold review does not become a document either — same rule as the warm one: fixed and recorded in `## Implementation`, or open and named in the PR.

Do not tell it what you built, what you already fixed, or which parts you think are fine. Every one of those is a hint that stops it looking — and "the code is correct and tested" buys a rubber stamp, not a review.

**`design-review` is deliberately not part of this stage.** A reviewer working from a diff cannot see the rendered page, and stage 5 already covered the visual pass with a running app in front of it.

Findings from this stage are numbered `CCR-n` and `CSEC-n` — the cold prefix keeps them distinct from stage 5's, so "CR-3 and CCR-3" are two findings rather than one confusingly renumbered.

**It reviews the PR text too, not only the code.** A title that describes something other than what shipped, or a description that no longer matches the diff, is a finding — it is what every future reader sees first, and a wrong one sends them into the code with the wrong model. 

Keep the returned findings to hand for stage 8. They go nowhere else.

## Stage 8: Fix the cold findings, then flip to ready

Same rules as stage 6, one pass, working from the `CCR-n` / `CSEC-n` findings the subagent returned — hand them to `build`'s "from a review report" path exactly as stage 6 did with the warm findings. Then:

1. Update the PR description: what the run did, which interactions the browser test actually drove (the reader wants the list, not that a test "ran"), and every finding left open with its id and why — `FT-n`, `CR-n`, `SEC-n`, `DR-n`, `CCR-n`, `CSEC-n` alike.
2. `gh pr ready <number>`.
3. Report: branch, PR link, commits, browser test result, finding counts per review, and what is still open.

If a security must-fix appeared in the cold review and could not be fixed, **leave the PR as a draft** and say so. Rule 2 applies at the end of the run exactly as it does in the middle.

## What this skill is not

- Not a designer. `.design/YYYY-MM-DD-<slug>.md` must already exist; `/ship` implements it.
- Not a merge. It hands over a PR for a human to read; it never merges and never pushes to main.
- Not a replacement for `/build` or `/review` alone — reach for those when you want to stop after one of them.
- Not a wrapper. Every stage runs the real `SKILL.md` of the skill it names, in full.

## Done when

- The PR exists, is no longer a draft, and its description matches what actually shipped
- Every review ran and every finding is either fixed and recorded in `## Implementation`, or listed in the PR under Known findings — including every `FT-n` from stage 4
- The cold findings were acted on, not merely collected
- The browser test ran and its defects were fixed before stage 5, or you said plainly why it could not run
- Tests are green on the final commit
- The working tree is clean, and the design file's `## Implementation` updates are committed and pushed — no report files, no screenshots, nothing else this run produced

**Then hand off.** Say: "PR #N is ready: `<url>`." Give commits, browser test result, finding counts per review, and what is still open with its id. Then stop — **a human reads the PR from here. Never merge it.**

If the run halted instead, say which stage stopped it and what you need, and leave the PR as a draft.
