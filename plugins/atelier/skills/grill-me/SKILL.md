---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview the user relentlessly about every aspect of the plan until you reach shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one at a time. For each question, propose your recommended answer and the tradeoff so they can push back — never a bare question.

## Example prompts

- "Grill me on this plan before I start"
- "Stress-test my approach to the notifications feature"
- "I want you to poke holes in this design"
- "Interview me on the migration plan"

## Rules

1. **One question at a time.** No lists of questions. Wait for the answer before asking the next.
2. **If the codebase can answer it, read the codebase.** Don't waste the user's time asking things a `grep` or file read would resolve.
3. **Always propose your recommended answer** and the tradeoff. Bare questions ("how should we handle auth?") are lazy — give a starting point.
4. **Order matters.** Resolve foundational decisions before dependent ones. Don't ask about button hover states before the page structure is decided.
5. **Stop when the tree is resolved.** When there are no more unknowns that could change the plan meaningfully, say so and summarize the decisions. Don't manufacture questions to seem thorough.
6. **Capture the outcome.** At the end, restate the resolved decisions as a short bulleted summary the user can paste into a brief or ticket.
