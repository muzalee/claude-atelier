---
name: prd
description: Write or amend a PRD — the scope contract covering problem, users, requirements, metrics, non-goals, milestones, dependencies — as a numbered file in `docs/prd/`. Use when the user mentions a PRD, product spec, requirements or project scope, or wants in/out of scope pinned before design, even without saying "PRD". Also to amend one when requirements change — something cut or added, a change of plan, a late constraint.
---

A PRD answers **what we are building, for whom, and why** — and just as importantly, **what we are not building**. It is the scope contract for an initiative. Design briefs and backend briefs sit downstream of it and decide *how*; this document decides *what* and *whether*.

## Example prompts

- "Write a PRD for the billing portal"
- "I need to nail down the scope before we start building the invite flow"
- "What's in scope and what's not for the analytics rebuild?"
- "We decided to drop SSO from v1 — update the PRD"
- "Product spec for a usage-based pricing tier"

## Step 1: Mode detection

Do this before anything else — before interviewing, before sizing, before reading the template. The two modes share almost nothing, and the cost of guessing wrong is high: writing a new PRD for something an existing one already covers splits the scope contract in two, and nobody knows which half counts.

1. List `docs/prd/`. Read the title and `## Summary` of each PRD found — filenames go stale once scope drifts, so do not judge by name alone.
2. **Does one of them cover this initiative?**
   - **Yes** → [Amend mode](#amend-mode). This includes small asks: a one-line change to a live PRD is an amendment, not a new document, and amending is cheap.
   - **No** → [Create mode](#create-mode).
3. If a PRD is *adjacent* but not the same initiative — same customers, overlapping vocabulary, a dependency between them — stay in Create mode, but note the relationship. Section 3 of Create mode covers what to do about it.

## Step 2: Size the document to the initiative

A PRD's length should track the size of the decision it is recording, not the length of the template. The template below has sixteen sections; most initiatives need six to eight of them.

**A section with nothing real in it is worse than no section at all.** A Stakeholders table with one row reading "me", a Dependencies table reading "none", a Rollout plan for a change that ships in one commit — each one teaches the reader that this document is padding, and the skimming that follows costs you on the sections that *are* load-bearing.

| Initiative size | What it looks like | Shape of the doc |
| --------------- | ------------------ | ---------------- |
| **Large** | Multi-feature, multi-week, several people need to agree on boundaries, touches billing/auth/data model | Most of the template. Phases, rollout, dependencies, stakeholders all earn their place. |
| **Medium** | One substantial feature, a week or two, one or two decisions that will be argued about later | Core sections plus whichever extended ones have real content — usually phases and risks. |
| **Small** | A single component, a setting, a UI affordance | Core sections only. One page. No phases, no stakeholders, no rollout — but keep Risks if the initiative rests on one real bet. |

Size is a floor on judgement, not a ceiling: a small PRD carrying one genuinely dangerous assumption should carry the Risks section that names it. Real content always beats the size label.

On a small ask, **name the cheaper path first in a sentence, then write the doc anyway** — do not refuse. Often the PRD is not where the real work hides: a "dark mode toggle" is thirty lines of toggle and three weeks of de-hardcoding colors, and saying so up front is worth more than any section of the document. If `design-brief` or `design-tokens` is the artifact that would actually help, say which and offer to run it — then deliver what was asked, because refusing is obstructive when someone has already told you what they want.

The one case worth pushing back on outright: the ask is a bug fix or a task, not a decision. There is nothing to contract about. Say so and offer to just do the work.

## Create mode

### 1. Understand the initiative

Ask the user for a paragraph: what they want to build, who it is for, what problem it solves, and what triggered it now. "Why now" matters more than it sounds — an initiative with no forcing function usually has soft requirements, and soft requirements produce a PRD nobody honors.

### 2. Explore before asking

Read the repo before the interview so you do not ask questions the code already answers. Look for:

- `README.md`, `docs/` — stated product purpose, existing feature set
- `docs/prd/` — prior PRDs; a new one must not contradict a live one
- `.design/*.md` — features already designed, and the non-goals in their `## Scope` sections (a design under a PRD has none — the PRD is its scope). Two legacy folder shapes also exist and still read; see **Finding the design file** in `${CLAUDE_SKILL_DIR}/../design/SKILL.md`
- `package.json` / dependency manifests — what the product currently *is* (SaaS app, CLI, library, mobile)
- Auth, billing, or tenancy code — reveals the existing user model, which constrains who a new feature can serve
- Open `TODO`/`FIXME` clusters and issue templates — the backlog the user is implicitly working around

Bring findings into the interview: "I see billing already uses Stripe subscriptions — is the new tier a Stripe price, or a separate system?" That is a far better question than "how should billing work?"

### 3. Check for collisions with live PRDs

Mode detection already told you no existing PRD *covers* this initiative. Now check whether the new one will *collide* with one:

- **Vocabulary collision** — the new PRD uses a word an active PRD already uses for something else (one says "workspace" meaning the company tenant, the other means a team grouping inside it). Two live documents in one folder using one word for two things is a bug that surfaces months later in a build.
- **Requirement dependency** — the new initiative needs something an existing PRD has scheduled, cut, or deferred.
- **Contradiction** — the new initiative assumes something an active PRD ruled out as a non-goal.

Raise any of these with the user and offer a resolution. Do not silently edit an active PRD to make room for a new one — that PRD is somebody's agreed scope. Propose, then let them decide.

### 4. Interview

Ask one question at a time. Propose a recommended answer with each so the user can react instead of generate — reacting is faster and surfaces disagreement sooner. Skip anything the repo already settled, and skip whole blocks that the document's size does not warrant.

**Problem and users**
- What specific problem does this solve, and for whom? Name the user segment, not "users".
- What do those people do today instead? (The status quo is the real competitor.)
- How do we know this is a real problem — support tickets, churn, sales asks, a metric?
- What happens if we build nothing?

**Scope**
- What is the smallest version that is genuinely useful? (This becomes v1.)
- What is deliberately *not* in this initiative? Push for explicit non-goals — a PRD without them is a wish list.
- What is in scope but deferred to a later phase vs. cut entirely? These are different and get different sections.

**Requirements**
- Walk the primary user journey end to end; each step usually maps to one functional requirement.
- What must be true for this to be shippable vs. what would be nice?
- Any non-functional bars: performance, availability, accessibility, compliance, data residency, audit?

**Success**
- What metric moves if this works? What is the current baseline and target?
- When do we measure it? A target with no date is a hope.
- What would make us roll this back?

**Constraints and dependencies** *(skip for small initiatives)*
- Hard deadline or event this is tied to?
- What must exist before we can start — another team's API, a vendor contract, a migration, a design system?
- Who must approve or be consulted?

**Risks**
- What is most likely to go wrong, and what would we do about it?
- What assumption, if wrong, invalidates the whole initiative?

Do not accept vague answers on **scope, success metrics, and non-goals**. Those three are what people actually re-read six weeks later when they are arguing about whether something is in scope. Everything else can be fuzzy; those cannot.

When the user is not available to answer, make the most reasonable assumption from the repo and the prompt, and state every assumption explicitly **in your reply** — mapped to the requirement it lands in, so each can be checked one by one rather than re-read as prose. Assumptions you made belong in the reply; only genuinely unresolved decisions that need someone else's answer belong in the document's Open Questions.

### 5. Write the PRD

Save to `docs/prd/NNNN-<slug>.md`:

- `NNNN` is the next number, zero-padded to 4. Take the highest existing number and add one; in an empty or absent `docs/prd/`, start at `0001`. Never reuse a number, even for a cancelled PRD — the number is a stable reference people paste into chat.
- `<slug>` is lowercase-hyphenated, derived from the initiative (`billing-portal`, `team-invites`, `usage-analytics`).

```
docs/prd/
├── 0001-billing-portal.md
├── 0002-team-invites.md
└── 0003-usage-analytics.md
```

Two rules that keep this folder readable:

1. **One initiative per file. Never split one PRD across several files.** Scope lives in one place or it does not live anywhere — a reader (human or Claude) should never have to open five files to learn what is in scope.
2. **A PRD past ~400 lines means the initiative is too big, not the document.** Split the initiative into two numbered PRDs and cross-link them. Document length is a useful smoke alarm; do not disable it by sharding the file.

Create `docs/prd/` if it does not exist. Do not add an index file — `ls` is the index until there are ten or more PRDs.

### 6. Cross-link with design

If a design file exists for work under this PRD — found by the procedure in `${CLAUDE_SKILL_DIR}/../design/SKILL.md` → **Finding the design file** — link both directions so any skill entering from either side can find the other. Copy the name exactly as it is on disk; this skill never creates or renames one:

- In the PRD front matter: `design: .design/2026-09-08-billing-portal.md`
- Under the title of each `.design/YYYY-MM-DD-<slug>.md` covered by this PRD: `> PRD: docs/prd/0001-billing-portal.md`

Omit the `design:` key entirely until a design file exists. An empty pointer is a broken one.

### 7. Close out

Tell the user the path, the number, and the 2-3 decisions most likely to be contested later (usually a non-goal or a deferred phase). Then point them at the next step: `/design` for the first feature under this PRD.

## Amend mode

Requirements change. A PRD that is never amended is not stable — it is abandoned, and people route around it. Amending is normal and should feel cheap.

What matters is that the *current* state stays readable while the *change* stays traceable:

1. **Edit the body in place.** Update the affected requirements, scope lists, metrics, or milestones so the document reads as the current truth. Do not leave strikethrough text, `CUT` priorities, or "EDIT:" notes scattered through the sections — a reader must be able to read top to bottom and learn what is true now, without reconstructing the edit history to do it. History belongs in the Changelog, and only there.

2. **Retire cut requirement IDs — never renumber them.** `FR-N` ids get cited in tasks, tests, commits, and review comments. Renumbering `FR-3` to `FR-2` because `FR-2` was cut silently breaks every one of those references, and the breakage is invisible until someone chases a citation to the wrong requirement. So when a requirement is cut: remove its row from the table, move it to Non-Goals with the reason, and let its number stay dead. The next new requirement takes the next unused number, not the gap.

   A gap in a numbered table looks like a typo, and the next writer will fill it. So leave one standing line under the table — *"ids are permanent; FR-2 is retired; next is FR-6"* — stating the rule in the present tense. That is not edit history, it is the numbering contract, and it belongs in the body.

3. **Add only the sections the change requires, in the template's shape.** A change often needs a section the document never had — a legal retention mandate needs an NFR section; a newly discovered dependency needs a Dependencies table. Add that one section, and read the template below for its column layout so it matches every other PRD in the folder. Do not backfill the rest of the template while you are in there: the sizing rule applies to amendments exactly as it does to new documents, and an amendment is a bad moment to pad a doc someone already agreed to.

4. **Log every change in `## Changelog`** at the bottom: date, what changed, why, who decided. One row per logical change, not one per editing session — someone tracing why SCIM died should find that reason on its own line, not folded into a row that also moved a retention bar.

5. **Bump `updated:` in the front matter.** Leave `created:` and the PRD number alone.

6. **Check for contradictions the change creates.** Two places to look:
   - *Inside the PRD* — a surviving requirement that the change just invalidated. (A custom-retention-window requirement cannot survive a legal 7-year floor untouched.)
   - *Downstream* — design-folder briefs, tasks, or tests that design work the change just cut or contradicted. Say so explicitly and offer to update them. A PRD that quietly diverges from its briefs is worse than no PRD.

7. **Correct a false premise rather than encoding it.** If the user says "change X from 90 days to 7 years" and the document never said 90 days, do not invent the history — make the change and tell them the figure was not in the PRD, because it means the number lives somewhere else that may now contradict this one.

8. **Never renumber or rename an amended PRD.** The number is a permanent reference.

If an initiative is cancelled or superseded, set `status: cancelled` or `status: superseded by 0007`, add a Changelog entry with the reason, and leave the file in place. Deleting it erases the reasoning that future readers need most.

## PRD Template

Sections are marked **core** (almost always earn their place) or **add when** (include only when the answer is real). Follow the sizing rule above — a small PRD that stops after Success Metrics is finished, not incomplete.

```markdown
---
prd: NNNN
title: [Initiative Name]
status: draft | active | shipped | cancelled | superseded by NNNN
owner: [name]
created: YYYY-MM-DD
updated: YYYY-MM-DD
design: .design/YYYY-MM-DD-<slug>.md      # its real name on disk; omit until one exists
---

# PRD NNNN: [Initiative Name]

## Summary                                                          [core]

Three to five sentences: what this is, who it serves, and why now. Written so someone with no context can decide in 30 seconds whether they need to read further.

## Problem                                                          [core]

The problem in the user's terms, with evidence — tickets, churn numbers, sales objections, a metric that is worse than it should be. State what people do today instead, and why that is inadequate.

## Goals                                                            [core]

What success looks like, in outcomes, not features.

1. [Outcome]

## Non-Goals                                                        [core]

Explicitly not part of this initiative, and why. This is the section people re-read when arguing about scope — make it specific enough to settle an argument.

- [Thing] — [why it is out: not now / not ever / belongs elsewhere]

## Users                                          [add when >1 segment]

| Segment | What they need | How they reach it today | Priority |
| ------- | -------------- | ----------------------- | -------- |
| [segment] | [need] | [current workaround] | primary / secondary |

## User Journey                     [add when the flow is non-obvious]

The primary path end to end, in the user's words. Numbered steps. Note where the journey breaks today.

1. [Step]

## Functional Requirements                                          [core]

Numbered so they can be referenced in tasks, tests, and review comments. `MUST` = shippable bar, `SHOULD` = expected but cuttable under pressure, `MAY` = optional. Numbers are permanent: a cut requirement's id is retired, never reused.

| ID | Requirement | Priority | Notes |
| -- | ----------- | -------- | ----- |
| FR-1 | The system MUST ... | MUST | |

## Non-Functional Requirements        [add when there is a real bar]

| ID | Requirement | Target |
| -- | ----------- | ------ |
| NFR-1 | [performance / availability / accessibility / compliance / privacy] | [measurable target] |

## Success Metrics                                                  [core]

| Metric | Baseline | Target | Measured when | Source |
| ------ | -------- | ------ | ------------- | ------ |
| [metric] | [today] | [goal] | [date / N weeks post-launch] | [dashboard, query, tool] |

A baseline you do not have yet is written as "unknown — [how to get it], owed by [when]". Never fabricate one; an invented baseline makes the whole table unreadable, because a reader cannot tell which numbers are real.

State the rollback trigger too: the result that would make us revert or stop.

## Scope by Phase                    [add when it ships in >1 release]

| Phase | Contents | Requirements covered | Exit criteria |
| ----- | -------- | -------------------- | ------------- |
| 1 | [what] | FR-1, FR-2 | [what must be true to call it done] |

Phase 1 is the smallest genuinely useful version. Where the premise itself is unproven, a phase 0 that validates it — with a stated condition that would cancel the rest — is worth more than any later phase.

## Rollout                 [add when it needs more than a deploy]

- **Strategy**: [dark launch / internal only / % rollout / flag-gated / full]
- **Flag**: [name, default, who can flip it]
- **Migration**: [what existing data or users need moving, and how]
- **Rollback**: [how, how fast, what data is lost if we do]
- **Comms**: [who needs telling — users, support, sales — and when]

## Dependencies                          [add when something blocks]

| Dependency | Owner | Needed by | Status | If it slips |
| ---------- | ----- | --------- | ------ | ----------- |
| [team, vendor, migration, API] | [who] | [phase / date] | [confirmed / at risk] | [fallback] |

## Stakeholders            [add when >1 person must agree — omit for a solo decider]

| Person / role | Interest | Involvement |
| ------------- | -------- | ----------- |
| [name or role] | [what they care about] | approves / consulted / informed |

## Risks & Assumptions                     [core for medium and large]

| Risk or assumption | Impact if wrong | Mitigation |
| ------------------ | --------------- | ---------- |
| [what we are betting on] | [blast radius] | [what we do about it] |

## Open Questions                        [add when something is open]

Unresolved decisions with an owner and a by-when. Move each into the body once answered rather than leaving the answer stranded here.

| Question | Owner | Needed by |
| -------- | ----- | --------- |

## Changelog                                                        [core]

| Date | Change | Why | Decided by |
| ---- | ------ | --- | ---------- |
| YYYY-MM-DD | Created | | |
```

## Writing notes

- **Requirements are testable or they are decoration.** "The dashboard should be fast" is not a requirement; "p95 dashboard load under 800ms on a 4G connection" is. If a requirement cannot fail a test, rewrite it or drop it.
- **Prefer fewer, sharper requirements.** Twenty MUSTs means nothing is a MUST. If everything is the shippable bar, the bar is meaningless and the first schedule pressure collapses it arbitrarily.
- **Non-goals do the heaviest lifting.** Most scope disputes are resolved by what the PRD refused, not by what it asked for. Spend real interview time there.
- **Do not design in the PRD.** No schemas, no component names, no endpoints, no library choices. Those belong in `backend-design` and `design-brief`. A PRD that specifies implementation removes the room those skills need and goes stale the moment the code disagrees. Referencing an existing file as a *constraint* ("seats are metered in `src/billing.ts` and that does not change") is fine — that is scope, not design.
- **Write for the person reading it in six weeks**, mid-argument, skimming for one answer. Tables over prose for anything enumerable; that is why this template leans on them.

## Done when

- The PRD is saved at `docs/prd/NNNN-<slug>.md` with the next unused number
- Non-goals, success metrics, and functional requirements are specific enough to settle an argument
- Every assumption you made on the user's behalf is stated in your reply, mapped to the requirement it lands in
- In Amend mode: the body reads as current truth, cut requirement ids are retired not renumbered, `updated:` is bumped, and the Changelog has a row per logical change

**Then hand off.** Say: "PRD `NNNN` saved to `docs/prd/NNNN-<slug>.md`." Name the 2-3 decisions most likely to be contested later, then: "Next: **`/atelier:design`** to design the first feature under it." 
