---
name: preflight
description: Check a plan against the actual repository before anyone builds it and drive it to a buildable state — verify every file, symbol, dependency, command, and assumption the plan names, fix what has one right answer, ask about what has several, and stop only at decisions that are genuinely the user's. Use this skill whenever the user has a plan, task list, TASKS.md, PRD, design doc, migration plan, or issue breakdown and wants to know if it is still accurate, will actually run, or has gone stale — and whenever they say "check this plan", "can this run", "is this plan still valid", "sanity check this before I build", or hand over a plan written in an earlier session.
---

A plan is a set of claims about a repository: this file exists, that function takes these arguments, this dependency is installed, this command runs. Every one of those claims is checkable, and a plan is only as good as the claims it got right.

This skill checks them, and reports what would break — before a build hits the wrong assumption at step 4 and quietly improvises the rest. That improvisation is the failure this exists to prevent: the plan was reviewed and agreed, the code that shipped was something else, and nobody saw the divergence because it happened mid-execution.

**This skill fixes the plan; it never touches the code.** It corrects what has one right answer, asks about what has several, and stops only at decisions that are genuinely the user's — so what comes out the other side is a plan `/build` can run, not a list of chores handed back.

## Example prompts

- "Check this plan against the repo before I run it"
- "I wrote this TASKS.md last week — is it still accurate?"
- "Can this migration plan actually run?"
- "Sanity check the plan in `.design/billing/TASKS.md`"
- "Will this still work? The codebase moved since I wrote it"

## Step 1: Locate the plan

If the user named a file, use it. Otherwise look, in order: `.design/*/TASKS.md`, `.design/*/BACKEND_DESIGN.md`, `docs/prd/*.md`, `PLAN.md`, `TODO.md`, a plan pasted into the conversation. If several exist, list them and ask which one — checking the wrong plan wastes the whole pass.

Note when it was last modified and how many commits have landed since. A plan written thirty commits ago is a different risk profile from one written this morning, and it tells you how hard to look.

## Step 2: Extract the claims

Read the plan and pull out everything it asserts about the world. Claims hide in prose as much as in checklists, so read it all, not just the bullets.

| Claim type | Looks like | How to verify |
| ---------- | ---------- | ------------- |
| **File exists** | "update `src/auth/session.ts`" | Read it. Missing is fine if the plan creates it — check whether it says so. |
| **Symbol exists** | "extend `createUser` to take a `role`" | Grep for the definition. Confirm the signature matches what the plan assumes. |
| **Shape holds** | "the `User` type already has `tenantId`" | Read the type. Assumed fields are the most common stale claim. |
| **Dependency available** | "use `zod` to validate" | Check the manifest. Not installed is a finding, not a detail. |
| **Command runs** | "run `npm run migrate`" | Check `package.json` scripts, Makefile, task runner. A named script that does not exist stops the build dead. |
| **State assumed** | "there is no auth yet" | Verify. Plans go stale in exactly this direction. |
| **Ordering** | "step 5 uses the client from step 2" | Read the steps as a dependency graph, not a list. |
| **Scope boundary** | "this does not touch billing" | Grep the surface it claims not to touch. |

## Step 3: Verify each one against the code

Read the actual files. Grep for the actual symbols. Open the manifest.

**Every finding cites evidence** — `file:line`, or the exact grep that came back empty. "This looks out of date" is not a finding; "`src/auth/session.ts:42` defines `createSession(userId)`, the plan's step 3 calls it with `(userId, tenantId)`" is. A preflight that reports vibes is worse than no preflight, because it costs the trust that makes the real findings land.

Three things deserve more attention than their share of the plan's text:

- **Signatures the plan extends.** "Add a parameter to X" assumes X's current parameters. This is where plans are most often subtly wrong, and it is invisible until compile time.
- **Claims about what does not exist.** "There is no rate limiting yet" is the claim most likely to have been falsified since the plan was written, because somebody else's branch landed.
- **Steps that depend on earlier steps.** A plan can have every individual claim right and still be unrunnable because step 2 needs what step 6 creates.

## Step 4: Report

Give a verdict first — the reader wants to know whether to proceed before they want the detail.

| Verdict | Means |
| ------- | ----- |
| **Ready** | Every claim checks out. Build it. |
| **Ready with fixes** | Real problems, all mechanical — a renamed symbol, a missing script, a wrong path. Fix the plan, then build. |
| **Blocked** | At least one problem needs a decision, not a correction: the plan's approach assumes an architecture the repo does not have, or a step is impossible as described. |

Then the findings, each with a stable id so a later fix pass can report against them one by one:

```markdown
## Preflight: <plan file>

**Verdict**: Ready with fixes — 2 blocking, 1 worth knowing.
**Plan**: `.design/billing/TASKS.md`, last modified 12 days and 31 commits ago.
**Checked**: 14 claims across 9 files.

### 🔴 Blocking
- **PF-1** — Step 3 calls `createSession(userId, tenantId)`; `src/auth/session.ts:42` defines it as `createSession(userId)`. Tenancy was never threaded through. Either add the parameter first, or the step needs rewriting.
- **PF-2** — Step 7 runs `npm run migrate`; `package.json` has no `migrate` script. Closest is `db:push`, which is not the same operation.

### 🟡 Worth knowing
- **PF-3** — The plan states "no rate limiting exists". `src/plugins/rate-limit.ts:1` registers `@fastify/rate-limit`, added in `a3f21c8` after the plan was written. Step 9 would add a second limiter.

### ✅ Verified
- `src/billing.ts` exists, exports `PLANS` as the plan assumes (`src/billing.ts:2`)
- `zod` is in `package.json` at `^3.23.0`
- Steps 1-2 create everything steps 4-6 depend on; ordering holds
```

The **Verified** section is not padding — it tells the reader which claims you actually checked, which is the only way they can judge how much the verdict is worth. A report listing three problems and nothing else leaves them unable to distinguish a thorough pass from a shallow one.

When the plan lives in a `.design/<slug>/` folder, save the report as `.design/<slug>/PREFLIGHT.md` alongside the others. Otherwise report inline — a standalone plan check does not need a file nobody will open twice.

## Step 5: Drive the plan to Ready

A verdict of "Ready with fixes" that stops there hands the user a list of chores and makes them come back. The point of this skill is a plan that can be built, so keep going until it is one — or until the only thing left is genuinely the user's to decide.

Work in this order, because each step is cheaper than the next:

**1. Apply the mechanical fixes yourself.** A renamed symbol, a wrong path, a script that is now called something else, a step that assumes a field which already exists — these have exactly one correct answer, sitting in the repo. Edit the plan file, and list each edit in your report so the user sees what moved. Asking permission for a corrected path is just a slower way of getting the same edit.

**2. Ask about everything with more than one defensible answer.** Batch the questions — one round, not a trickle — and for each one give the evidence from the repo, your recommended answer, and the consequence of choosing otherwise. Then apply the answers to the plan. Most "Blocked" verdicts collapse here: a step is unrunnable because a decision was never made, and making it takes one sentence from the user.

**3. Re-verify what you changed.** A fixed step can break a later one — a renamed function is used in three steps, not one. Re-check the claims your edits touched before declaring Ready.

**4. Stop for a real gate.** Some decisions are not yours no matter how obvious they look:

- It changes scope — a PRD requirement, a stated non-goal, what ships in v1
- It costs money, touches production data, or changes the security or auth model
- It is irreversible, or expensive to reverse
- Two approaches are genuinely equal and the choice depends on something you cannot see — team plans, a customer conversation, a roadmap

For these, say plainly that it is a gate, give both options and their consequences, and wait. A gate is not a failure of the skill; guessing past one is.

**Update the plan file itself**, not just the report. A plan that stays wrong while a separate document records that it is wrong has two sources of truth, and `/build` reads the wrong one. Where a fix changes what a step does rather than how it is worded, say so in the step so the change is visible to whoever agreed the original.

Then restate the verdict. If it is now Ready, say so and hand off.

## Rules

- **Verify, do not assume.** If a claim cannot be checked from the repo — "the design team will provide assets" — mark it unverifiable rather than guessing. An unverifiable claim is itself worth reporting.
- **A missing file is not automatically a finding.** Plans create files. Check whether the plan says it creates this one before flagging it.
- **Do not review the plan's judgement.** Whether the approach is wise is a different question, and mixing it in dilutes the factual findings. Stick to whether it will run. If the approach looks genuinely wrong, say so in one line at the end, clearly separated.
- **Fix the plan, never the code.** Mechanical corrections to the plan are the job (step 5). Touching the implementation is not — that is `/build`, and a preflight that starts coding has stopped being a check.
- **Never fix silently.** Every edit you make to the plan appears in the report. The user agreed to the original; they are entitled to see what changed without diffing it themselves.
- **Say when you ran out of road.** A plan referencing an external service, another team's API, or a machine you cannot see has claims you cannot check. Name them; do not quietly treat unchecked as verified.

## When to stop and ask

- The plan is very large (50+ steps). Offer to check the first phase, or the steps touching a named area, rather than burning a full pass on all of it.
- You cannot find the plan, or several candidates look equally plausible.
- The plan is written against a different repository or a branch that is not checked out.

## Done when

- Every claim the plan makes has been checked against the repo, or marked unverifiable with the reason
- Mechanical problems are fixed in the plan file, and every edit is listed in the report
- Everything with more than one defensible answer was asked in one batched round and applied
- What remains is only genuine gates — scope, money, production data, security, irreversibility
- The plan re-verifies clean after your edits, including the steps they touched
- Findings carry `PF-n` ids, and the Verified section lists what you actually checked

**Then hand off.** **Ready** → "Plan checks out — N claims verified, M fixed." List the edits, then: "Next: **`/atelier:build`**, or **`/atelier:ship`** to build, test, review and open a PR unattended."
**Blocked on a gate** → name the gate, give both options and their consequences, and say the plan is Ready apart from it. Do not suggest building until it is answered.
