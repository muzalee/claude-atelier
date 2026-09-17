---
name: design-review
description: Run a structured design critique against the design file and codebase. Checks visual hierarchy, consistency, responsiveness, accessibility, and aesthetic fidelity. Findings are printed with `DR-n` ids; nothing is written to the repo. Use when user wants a design review, critique, QA pass, polish pass, or mentions "review" after building.
---

This skill runs a structured design review of what has been built, measured against the `## Experience` section of the feature's design file and the aesthetic philosophy named there.

> **CRITICAL — look at the running application**
>
> You MUST view the running application at each breakpoint as part of every design review. Code review alone is insufficient — you need to see what the user sees. Follow the capture protocol in Step 3 below. This is not optional.
>
> **Nothing is saved.** Take a screenshot, look at it, review from it. No `screenshots/` folder, no image committed to the repo. The findings are the output.

**The review is printed, not filed.** Findings carry `DR-n` ids so a fix pass can report against them and a PR can name what is still open. The fix pass records what it did in the design file's `## Implementation` section; this skill writes nothing.

## Example prompts

- "Review what I just built"
- "Run a design critique on the landing page"
- "Check this against the brief"
- "Here's a screenshot. How does it look?" [paste screenshot]
- "QA pass before I ship this"

## Process

1. **Read the design.** Find the feature's design file by the procedure in `design/SKILL.md` → **Finding the design file** (glob `.design/*.md`; two legacy folder shapes still read; several matches take the most recent date and say which; reuse the name verbatim; never create a second one). Read `## Experience` for the philosophy and the component list, `## Tokens` for the token roles, and `## Structure` for the routes to visit. If several features are in play, ask the user which to review. If nothing exists, ask the user what the intended design direction was and say in the findings that you reviewed against the codebase rather than a design.

2. **Explore the built code.** Examine every component, page, and style file that was created or modified. Scan specifically for:
   - All new or modified components and their relationship to pre-existing components
   - Token/variable usage: are components using shared tokens or hardcoding values?
   - Duplicate components that should be consolidated
   - File naming and organization: do new files follow the project's conventions?
   - Understand what was actually built, not what was planned.

3. **Look at the running application.**

   This step is **mandatory**. Do not skip it. Do not rely only on a code read.

   ### Browser driver priority

   Try each option in order. Use the first one that is available:
   1. **Orca (preferred where installed).** If `command -v orca` succeeds and `orca status --json` reports the runtime reachable, use it — `orca open` first if Orca is installed but closed. It gives precise viewport control and device emulation from the shell:

      ```bash
      orca tab create --url http://localhost:3000/<route>
      orca set device --name "iPhone 12"          # or drive widths directly
      orca set media --color-scheme dark          # dark-mode variants
      orca screenshot --format png
      orca snapshot                               # accessibility tree — refs change after navigation
      ```

   2. **Playwright MCP.** If the `plugin-playwright-playwright` MCP server is available, use it — precise viewport sizing, full-page captures, file naming.
   3. **Claude-in-Chrome.** The `mcp__claude-in-chrome__*` tools, if available: `navigate`, `resize_window`, `computer` for screenshots.
   4. **Cursor IDE Browser.** The `cursor-ide-browser` MCP server's `browser_take_screenshot` tool.
   5. **Ask the user (last resort).** If no driver above is available, you MUST ask the user to paste screenshots into the chat. Be specific about what you need:
      - "I don't have access to a browser tool. To complete the visual review I need screenshots of the running application. Please paste:"
      - A full-page screenshot at **desktop** width (1280px)
      - A full-page screenshot at **tablet** width (768px)
      - A full-page screenshot at **mobile** width (375px)
      - Dark mode variants (if applicable)
      - Any specific component or interactive state you want reviewed
      - **Do not skip the visual review.** Wait for the images before proceeding with the checklist.

      **Exception — an unattended run.** When `/ship` or another orchestrator is driving and there is nobody to ask, waiting is not an option: it would stall the whole pipeline on a phase that is not blocking. In that case skip the visual review, say plainly that it did not run and which driver was missing or why the app would not start, and let the run continue. Saying the review was skipped is honest; a checklist filled in from reading the code is not.

   ### Capture protocol

   **Screenshots are for looking at, not for keeping.** Take them in-session, review from them, and save nothing into the repo. There is no `screenshots/` folder; a screenshot committed next to the code is a stale picture of a UI that changed the following week.

   **a. Navigate to the application.** Ask the user for the URL if not obvious from the project (e.g., `http://localhost:3000`), and visit the routes named in `## Structure`.

   **b. Check every responsive breakpoint.** At minimum, view these three viewports for every key page/view:

   | Breakpoint | Width × Height |
   | ---------- | -------------- |
   | Mobile     | 375 × 812      |
   | Tablet     | 768 × 1024     |
   | Desktop    | 1280 × 800     |

   Resize the viewport before each capture, and capture the full scrollable page.

   **Example sequence with Playwright MCP** (the same shape applies to any driver above):

   ```
   1. browser_navigate → { url: "http://localhost:3000" }
   2. browser_resize   → { width: 1280, height: 800 }
   3. browser_take_screenshot → { type: "png", fullPage: true }      # look at it, keep nothing
   4. browser_resize   → { width: 768, height: 1024 }
   5. browser_take_screenshot → { type: "png", fullPage: true }
   6. browser_resize   → { width: 375, height: 812 }
   7. browser_take_screenshot → { type: "png", fullPage: true }
   ```

   **c. Check interactive states (when relevant).**
   - Hover states on buttons, cards, links
   - Focus states on form fields
   - Open states on dropdowns, modals, menus
   - Error/success states on forms — read the copy, not just the styling. A user-facing message that says "An error occurred" is a finding, and so is one rendering a raw exception or a bare HTTP status. It should say what happened, what to do next, and carry a quotable `ref` + `trace_id` (see `errors`).
   - Loading and empty states

   **d. Check dark mode (if the project supports it).** Toggle it and repeat the breakpoint pass.

   **e. Check specific components.** Where the review focuses on one component, capture just that element.

   ### Analyze every capture

   Look at each one against `## Experience`. For each:
   - Compare against the aesthetic direction named there
   - Check visual hierarchy: is the most important element the most prominent?
   - Check spacing consistency: do margins and padding look even and intentional?
   - Check color: does the palette match the direction named there?
   - Check typography: are font sizes, weights, and spacing visually correct?
   - Check responsive adaptation: does the layout properly reorganize (not just shrink)?
   - Note rendering issues that code review alone would miss (font loading failures, broken images, layout overflow, z-index problems, incorrect border-radius, color mismatches)

   Findings name the route, the breakpoint and the component — "`/settings`, 375px, the save button" — not a filename. There is no file.

4. **Run the review checklist below.** For each category, note what passes and what needs refinement. Be specific. Reference exact components, files and line numbers, plus the route and breakpoint where you saw it.

5. **Produce a prioritized refinement list.** Group issues by severity:
   - **Must fix**: Broken functionality, accessibility failures, major deviations from the brief.
   - **Should fix**: Inconsistencies, missing states, responsive issues.
   - **Could improve**: Polish, animation refinement, typography fine-tuning.

6. **Print the review.** No file, in the design folder or anywhere else. Say which routes and breakpoints you actually looked at, so a reader can tell a real pass from a code read.

## Review Checklist

### Visual Hierarchy

- Is the most important content the most visually prominent on each page/view?
- Does the type scale create clear levels of importance (heading, subheading, body, caption)?
- Do interactive elements (buttons, links, inputs) have enough visual weight to be found without hunting?
- Is there a clear reading order? Can you trace where the eye goes first, second, third?

### Consistency

- Are spacing values consistent? Check padding and margins against the established scale (4px/8px base or whatever the project uses).
- Are colors used consistently? Check that the same semantic meaning always maps to the same color (primary actions, errors, success states, disabled states).
- Are border radii, shadow values, and font sizes reused from a shared set, or are there one-off values?
- Do similar components look and behave similarly? (e.g., all cards, all form fields, all buttons within a category.)

### Aesthetic Fidelity

- Does the implementation match the named philosophy from the brief?
- Would someone looking at this immediately recognize the intended aesthetic direction?
- Are there elements that break the aesthetic (a generic component in an otherwise distinctive interface, a conflicting font, an out-of-place color)?
- Does the level of detail match the philosophy? (Minimalist designs should not have unnecessary decoration. Maximalist designs should not have empty, unfinished areas.)

### Component Quality

- Do existing components from the codebase appear correctly, or were they reimplemented?
- Are new components following the same API patterns (props, naming, file organization) as existing ones?
- Are there duplicate components that should be consolidated?

### States and Interactions

- Do interactive elements have all necessary states: default, hover, focus, active, disabled?
- Do form fields have states for: empty, filled, error, success, disabled?
- Are loading states handled? Empty states?
- Do transitions and animations match the philosophy's motion guidelines?
- Is there visual feedback for every user action?

### Responsive Behavior

- Does the layout work at mobile (375px), tablet (768px), and desktop (1280px+)?
- Do components adapt appropriately? (Not just shrink, but reorganize when needed.)
- Is touch target size adequate on mobile (minimum 44x44px)?
- Does text remain readable at all breakpoints? No text too small, no lines too wide (max 65-75 characters).

### Accessibility

- Color contrast: Do text/background combinations meet WCAG AA (4.5:1 for body text, 3:1 for large text)?
- Keyboard navigation: Can every interactive element be reached and activated with keyboard alone?
- Focus indicators: Are focus rings visible and styled consistently?
- Semantic HTML: Are headings in order? Are landmarks used (main, nav, header, footer)? Are form labels associated?
- Screen reader: Do images have alt text? Do icons have labels? Are decorative elements hidden from assistive technology?
- Motion: Is there a reduced-motion media query for users who need it?

### Typography

- Is the font actually loading? (Check for FOIT/FOUT flash.)
- Are line lengths comfortable for reading (45-75 characters on body text)?
- Is line height appropriate (1.4-1.6 for body, tighter for headings)?
- Is the type scale intentional, or are there arbitrary sizes?

### Dark Mode

- If the project has dark mode tokens, are they applied correctly?
- Are all color values using CSS variables (not hardcoded hex values that won't switch)?
- Does the dark palette feel intentional for the chosen philosophy, or is it a simple inversion?
- Are shadows adjusted for dark mode (darker, more transparent)?
- Do accent colors maintain sufficient contrast against dark backgrounds?
- Is there a working toggle mechanism or `prefers-color-scheme` support?

### Mobile-First

- Was the layout built mobile-first (using `min-width` media queries, not `max-width`)?
- Does the mobile layout work at 375px without horizontal scrolling?
- Is navigation adapted for mobile (not just a desktop nav that overflows)?
- Are touch targets at least 44x44px?
- Is body text at least 16px on mobile?

## Output Format

Printed, not saved:

```markdown
## Design review: [Feature/Page Name]

Reviewed against `## Experience` in `.design/YYYY-MM-DD-<slug>.md`. Philosophy: [named philosophy].
Viewed: `/settings` and `/settings/profile` at 375 / 768 / 1280, light and dark.

### Must fix
- **DR-1** `src/features/settings/SaveButton.tsx` — `/settings` at 375px, the save button falls below the fold with no sticky footer. _Fix: pin the action bar on mobile._

### Should fix
- **DR-2** `src/features/settings/ProfileCard.tsx:40` — hardcoded `#555` instead of `color-text-secondary`; it does not switch in dark mode.

### Could improve
- **DR-3** — the section headings could take `letter-spacing-wide` to match the philosophy's label treatment.

### What works well
[The strongest aspects of the implementation. Not padding — designers need to know what to keep doing.]
```

**Number every finding `DR-1`, `DR-2`**, in the order you found them, never reused within a review. `/ship` and any fix pass report against them one by one, and a follow-up review can say "DR-3 is still there" instead of re-describing it. A finding without an id cannot be tracked through a fix, which is how findings quietly get lost.

## Done when

- The running app was viewed at mobile, tablet, and desktop — and you said which routes
- Every finding carries a `DR-n` id and is measured against `## Experience` and `## Tokens`, not against taste
- **Nothing was written to the repo** — no report, no screenshots. The fix pass records what it fixed in `## Implementation`

**Then hand off.** Say: "Design review done: N findings." Then: "Next: fix the must-fix items with **`/atelier:build`**, then re-run this to confirm." 
