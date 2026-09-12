---
name: preflight
description: Check a plan against the actual repository before anyone builds it — verify every file, symbol, dependency, command, and assumption the plan names really exists in the shape the plan expects, and report what would break. Use this skill whenever the user has a plan, task list, TASKS.md, PRD, design doc, migration plan, or issue breakdown and wants to know if it is still accurate, will actually run, or has gone stale — and whenever they say "check this plan", "can this run", "is this plan still valid", "sanity check this before I build", or hand over a plan written in an earlier session.
---

A plan is a set of claims about a repository: this file exists, that function takes these arguments, this dependency is installed, this command runs. Every one of those claims is checkable, and a plan is only as good as the claims it got right.

This skill checks them, and reports what would break — before a build hits the wrong assumption at step 4 and quietly improvises the rest. That improvisation is the failure this exists to prevent: the plan was reviewed and agreed, the code that shipped was something else, and nobody saw the divergence because it happened mid-execution.

**This skill reports. It does not build, and it does not fix.** Reporting and fixing in one pass means the reader cannot tell which problems you found from which you introduced.

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

## Step 5: Offer the next step

Close with the smallest useful next action: "Fix the plan?" for mechanical problems, or name the specific decision needed for a blocking one. Do not start fixing — the user may want to change the approach rather than patch the step.

## Rules

- **Verify, do not assume.** If a claim cannot be checked from the repo — "the design team will provide assets" — mark it unverifiable rather than guessing. An unverifiable claim is itself worth reporting.
- **A missing file is not automatically a finding.** Plans create files. Check whether the plan says it creates this one before flagging it.
- **Do not review the plan's judgement.** Whether the approach is wise is a different question, and mixing it in dilutes the factual findings. Stick to whether it will run. If the approach looks genuinely wrong, say so in one line at the end, clearly separated.
- **Do not fix anything.** Not the plan, not the code. Report and offer.
- **Say when you ran out of road.** A plan referencing an external service, another team's API, or a machine you cannot see has claims you cannot check. Name them; do not quietly treat unchecked as verified.

## When to stop and ask

- The plan is very large (50+ steps). Offer to check the first phase, or the steps touching a named area, rather than burning a full pass on all of it.
- You cannot find the plan, or several candidates look equally plausible.
- The plan is written against a different repository or a branch that is not checked out.
