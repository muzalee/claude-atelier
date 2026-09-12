---
name: ship
description: Explicit-invocation-only orchestrator that takes a feature from a completed `.design/<slug>/` folder all the way to a review-ready pull request, unattended — branch off latest main, open a draft PR, build committing per phase, functionally test the result in a real browser, run a warm review, fix, run a cold review in a fresh session against the whole PR, fix, then flip the PR to ready. Invoked ONLY when the user types /ship or explicitly asks to "ship this", "run the ship pipeline", or "build and open a PR unattended". DO NOT auto-trigger from adjacent talk about branches, PRs, building, or reviewing — those have their own skills.
---

This skill runs the whole delivery loop without asking permission between steps. The user typed `/ship` because they want to come back to a finished pull request, not to a question.

Where `/build` stops at working code and `/review` stops at a report, this closes the loop: the code gets built, exercised, reviewed twice, fixed, and handed over as a PR that is ready to read.

```
/design  → docs         /build → code         /review → report
/ship    → branch → draft PR → build → browser test → warm review → fix
                  → cold review (fresh session, whole PR) → fix → ready PR
```

## Prerequisites

- `.design/<slug>/` with at minimum `DESIGN_BRIEF.md` and `TASKS.md`. Without them there is nothing to build — stop and tell the user to run `/design` first.
- A clean working tree. Uncommitted changes would end up in the PR attributed to this run. Stop and ask.
- `gh` authenticated (`gh auth status`). Without it, run everything else and stop before the PR step, telling the user what is left.

## Operating rules

1. **Unattended means unattended.** Announce each stage in one line as you enter it, then do it. No "Ready?", no checkpoints, no summaries between stages. The user chose this skill over `/build` + `/review` precisely to avoid those.

2. **Stop only on a real blocker.** Exactly four things halt the run:
   - A `/build` blocker under its own rule 6 (docs contradict the codebase, a destructive migration, an unavailable dependency with no obvious fallback).
   - A failing test you cannot fix within the scope of the task.
   - A **must-fix finding from `security-review`**. Security findings are not "note it in the PR" material.
   - **A stage asking for a human decision.** Unattended means you do not interrupt for progress reports; it does not mean you guess at a question that was put to you. If the build stops and asks something, that question is the blocker.

   When you stop, always do all five of these. A halted run that preserved its work is recoverable; one that discarded it is not.

   1. **Push what the build already committed.** Do not commit work it left half-finished mid-phase — that code is not yours and its author did not think it was done. Say it is there and uncommitted.
   2. **Leave the PR as a draft**, and write the blocker into its "Known findings" section. The PR body is the only channel that survives this transcript; a blocker that exists only in chat is lost the moment the session ends.
   3. **Leave a spawned terminal open at its prompt.** Stage 3's "close the terminal" step is for a finished run. Closing a halted one throws away the build's accumulated context and forces a restart from the beginning. Record the handle and read cursor so the run can resume.
   4. **Name the stage that stopped and quote the failure or question verbatim.** Paraphrasing a question loses the detail that made it unanswerable.
   5. **Recommend, but do not apply.** Saying what you would do if told to proceed is useful and is not the same as deciding — the ban in stage 3 is on *answering* the build, not on having an opinion for the user.

3. **Everything else gets fixed or written down.** A finding you cannot fix cleanly goes in the PR description under "Known findings", with its id. Silently dropping a finding is the one outcome worse than leaving it open.

4. **One fix pass per review.** Fix the warm findings once, fix the cold findings once, then finish. Re-reviewing after each fix until clean sounds thorough and in practice loops on findings that contradict each other. Anything still open after its one pass goes in the PR description.

5. **Pass the conventions down explicitly.** When you invoke `build`, name its house conventions and its no-historical-comments rule in the instruction. A sub-skill that is not told builds to its own defaults, and the fix passes are exactly where "// changed per review feedback" comments creep in.

6. **Commit per phase, never in one lump.** Each build phase is its own commit, following `keep-it-simple`. A reviewer reading a 40-file single commit cannot tell the frontend work from the backend work, and neither can `git bisect`.

## Stage 1: Branch

```bash
git fetch origin
git checkout -b <type>/<slug> origin/main    # or origin/master — check which exists
```

Branch type follows `keep-it-simple`: `feat/`, `fix/`, `chore/`. Derive the slug from the design folder. Branch off the **freshly fetched** remote main, not the local one — a stale local main produces a PR full of other people's changes.

## Stage 2: First build phase, then the draft PR

Run the first build phase — in a terminal, by the procedure in [Stage 3](#stage-3-remaining-build-phases) — commit it, push, and open the PR as a draft immediately. Opening it early rather than at the end means the work is visible while it happens, and a run that halts later still leaves something to look at.

```bash
git push -u origin <branch>
gh pr create --draft --title "<conventional commit title>" --body "<body>"
```

The PR body is written now and updated as the run proceeds. Follow `keep-it-simple`: what changed and why, no ceremony. Include the design folder path so a reader can find the intent, and leave a "Known findings" section that later stages fill in or remove.

## Stage 3: Remaining build phases

The build runs in its own terminal rather than inline, so a long build does not occupy this session and its state is observable from outside. Hand it:

- the design folder path,
- the house conventions it must load (its own House Conventions section lists them),
- the no-historical-comments rule, restated — comments describe the code as it is, never how it got here,
- the instruction to commit at the end of each phase.

### Spawning it

Use an **interactive** session, not `claude -p`. Print mode cannot ask a question — it either finishes or fails — which throws away the signal this whole arrangement exists to detect.

```bash
orca terminal create --worktree active --command "claude" --json     # returns a handle
orca terminal send --terminal <handle> --text "<the build instruction>" --enter
```

**Without Orca, ship still works — it just runs the build inline.** Check `command -v orca`, and that `orca status --json` reports the runtime reachable (if Orca is installed but closed, `orca open` first). If either check fails, follow `build/SKILL.md` directly in this session, say so in one line, and skip the state-detection procedure below entirely — there is no separate session to inspect, so "finished, errored, or waiting" is simply whatever you observe as you go. Everything else in the pipeline is unchanged: same stages, same blockers, same PR.

The terminal is an optimization, not a dependency. It buys isolation and lets a long build run without occupying this session; it is not what makes ship correct.

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

**Never answer a question the build asks you.** It stopped because the answer was not derivable from the design docs — which is exactly the situation where guessing produces code that looks agreed and is not. Rule 2 applies: that question is the blocker.

When the phases are done, close the terminal (`orca terminal close --terminal <h>`) and push.

## Stage 4: Functional browser test

**This is not the design review.** The design review looks at the page; this stage *uses* it. Click the button. Type in the field. Submit the form. Verify what the brief said would happen actually happens.

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

**What to actually test:** walk the primary user journey from the brief. For each interactive element the change touched — does it respond, does it do the right thing, does it handle the empty and invalid case. Check the browser console for errors that the happy path produced anyway.

Save screenshots to `.design/<slug>/screenshots/`, and write what you exercised and what happened to `.design/<slug>/FUNCTIONAL_TEST.md`. A failure here is a finding, fixed in this stage before review — reviewing code you already know is broken wastes the review.

## Stage 5: Warm review

Read and follow, in order, against the changes on this branch:

1. `code-review/SKILL.md` → `.design/<slug>/CODE_REVIEW.md`
2. Claude Code's built-in `security-review` → `.design/<slug>/SECURITY_REVIEW.md`
3. `design-review/SKILL.md` → `.design/<slug>/DESIGN_REVIEW.md` (skip when there is no UI)

Run the three skills directly rather than the `/review` orchestrator — it gates on confirmation between phases, which is correct for interactive use and wrong here.

This review is **warm**: you built this, so you know what every line was meant to do. That is worth something on intent and worth nothing on blind spots, which is what stage 7 is for.

**Give every finding a stable id** — `CR-1`, `SEC-1`, `DR-1` — so the fix pass can report against them one by one and the PR can name what is still open.

## Stage 6: Fix the warm findings

Fix must-fix and should-fix findings. Consider-level findings are optional; take the cheap ones.

The conventions still apply while fixing — `errors`, `logging`, `typescript-conventions`, and **no historical comments**. A fix is ordinary code, not an annotation on a review.

Commit the fixes (`fix:` per `keep-it-simple`), re-run the tests, and push. Report each finding as fixed, or as not-fixed with a one-line reason. Anything not fixed goes to the PR's Known findings.

## Stage 7: Cold review

The point of a cold review is that it has no idea what you meant. A reviewer who watched the code get written rationalizes it; one who arrives at the diff cold reads what is actually there. Almost everything stage 5 missed is the kind of thing only a stranger sees.

**Spawn a subagent with no context from this conversation.** Give it only:

- the **full PR diff** — every change in the PR, not just the most recent phase. **Paste the output of `gh pr diff <number>` into the instruction** rather than telling the agent to run it. An agent with a shell will also reach `git log`, the commit messages, and the warm `CODE_REVIEW.md` sitting in the same design folder — and arrives warm, having defeated the entire stage. Tell it explicitly not to read git history or the rest of `.design/<slug>/`.
- the **PR title and description**, labelled as *an unverified claim about the code, not a specification*. That label is what stops the reviewer "fixing" correct code to match a stale sentence.
- the design brief as the statement of intent, and the PRD if one exists — say so plainly when there is none rather than implying it is required.
- the instruction to read `code-review/SKILL.md` and follow it, then run `security-review`.

Spawn a **fresh general-purpose agent, never a fork** — a fork inherits this conversation, which is the one thing the stage exists to prevent.

**The parent writes `COLD_REVIEW.md`,** not the subagent: the reviewer should not be browsing the folder it is fenced out of. Have it report findings back and save them yourself.

Do not tell it what you built, what you already fixed, or which parts you think are fine. Every one of those is a hint that stops it looking — and "the code is correct and tested" buys a rubber stamp, not a review.

**`design-review` is deliberately not part of this stage.** A reviewer working from a diff cannot see the rendered page, and stage 5 already covered the visual pass with a running app in front of it.

**It reviews the PR text too, not only the code.** A title that describes something other than what shipped, or a description that no longer matches the diff, is a finding — it is what every future reader sees first, and a wrong one sends them into the code with the wrong model. Findings get ids `CCR-1`, `CSEC-1`.

Save to `.design/<slug>/COLD_REVIEW.md`.

## Stage 8: Fix the cold findings, then flip to ready

Same rules as stage 6, one pass. Then:

1. Update the PR description: what the run did, what the browser test exercised, and every finding left open with its id and why.
2. `gh pr ready <number>`.
3. Report: branch, PR link, commits, browser test result, finding counts per review, and what is still open.

If a security must-fix appeared in the cold review and could not be fixed, **leave the PR as a draft** and say so. Rule 2 applies at the end of the run exactly as it does in the middle.

## What this skill is not

- Not a designer. `.design/<slug>/` must already exist; `/ship` implements it.
- Not a merge. It hands over a PR for a human to read; it never merges and never pushes to main.
- Not a replacement for `/build` or `/review` alone — reach for those when you want to stop after one of them.
- Not a wrapper. Every stage runs the real `SKILL.md` of the skill it names, in full.

## Done when

- The PR exists, is no longer a draft, and its description matches what actually shipped
- Every review ran and every finding is either fixed or listed in the PR under Known findings
- The browser test ran, or you said plainly why it could not
- Tests are green on the final commit

**Then hand off.** Say: "PR #N is ready: `<url>`." Give commits, browser test result, finding counts per review, and what is still open with its id. Then stop — **a human reads the PR from here. Never merge it.**

If the run halted instead, say which stage stopped it and what you need, and leave the PR as a draft.
