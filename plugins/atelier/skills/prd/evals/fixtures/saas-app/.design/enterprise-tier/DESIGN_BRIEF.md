# Design brief: Enterprise tier

Implements PRD 0001. Phase 1 and 2.

## Surfaces

- **Workspace security settings** — a new tab under Settings, admin-only. SSO
  configuration (metadata URL, certificate), SCIM token generation, and the
  audit log viewer.
- **Audit log viewer** — reverse-chronological table, filterable by actor and
  event type, with a CSV export for a chosen range.

## Decisions

- SCIM tokens are shown once at generation and never again. Regenerating
  invalidates the previous token immediately.
- The audit log viewer paginates at 50 rows; the CSV export is not paginated.
- Retention is 90 days per NFR-1, so the date filter is capped at 90 days and
  the UI says so rather than silently returning nothing.
