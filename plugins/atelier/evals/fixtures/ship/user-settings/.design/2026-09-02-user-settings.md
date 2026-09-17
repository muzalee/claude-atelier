# Design: User settings

## Problem

Users have no way to change their display name or turn off the email digest.
Both are currently support requests.

## Solution

A single `/settings` page with two sections, both visible at once — not a wizard.
It hangs off the existing avatar menu; no new navigation.

## Scope

**In scope**: display name, email digest toggle, for the signed-in user only.
**Out of scope**: avatars, password change, team settings, admin views of other users.

## Experience

**Philosophy**: matches the existing app shell — quiet, dense, no decoration.

**Key interactions**:
- *Save display name* — the field has an explicit save button. Empty is rejected with an
  inline error under the field.
- *Toggle digest* — persists on change.

Errors are inline and per-field, never a page-level banner.

## Architecture

Read and write endpoints for the signed-in user's settings, on the existing Fastify app.

**API surface**: `GET /api/me/settings`, `PATCH /api/me/settings`. Both scoped to the
session user — no id in the path.

**Invariants**: display name is non-empty after trim. A user can only read or write their
own row.

**Failure modes**: a write to another user's settings returns 403 and writes nothing.

## Structure

- Settings `/settings` — reached from the avatar menu. Reuses the existing app layout.

## Tokens

No new tokens. The page uses the app's existing scale and palette.

## Tests

- [integration] saving an empty display name is rejected and the inline error appears
- [integration] saving a valid display name persists and survives a reload
- [integration] the digest toggle round-trips: set it, reload, it holds
- [integration] a user cannot read or write another user's settings

### Not testing

- That the heading renders. It is a string in a div.
- Toggle animation states.

## Tasks

- [ ] 1. Settings page shell: route, heading, two empty sections
- [ ] 2. Profile section: display name input + save, inline validation on empty
- [ ] 3. Notifications section: digest toggle, persists on change
- [ ] 4. Settings read + write endpoints, scoped to the signed-in user

## Implementation
