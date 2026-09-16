# Design brief: User settings

A single `/settings` page with two sections. No new navigation — it hangs off
the existing avatar menu.

## Sections

- **Profile** — display name, with a save button. An empty display name is
  rejected with an inline error under the field.
- **Notifications** — an email digest toggle.

## Decisions

- One page, not a wizard. Both sections are visible at once.
- Errors are inline and per-field, never a page-level banner.
- The page is admin-agnostic: every user sees their own settings only.
