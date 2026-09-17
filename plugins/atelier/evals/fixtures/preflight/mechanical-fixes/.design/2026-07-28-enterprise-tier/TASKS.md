# Tasks: Enterprise tier

Plan written before the auth refactor landed. Each task is one vertical slice.

## Task 1: Audit log table

- [ ] Add an `audit_log` table in `src/lib/db.ts` — actor, action, target, timestamp
- [ ] Run `npm run migrate` to apply the schema

## Task 2: Record session creation

- [ ] `createSession(userId, tenantId)` in `src/lib/auth.ts` already takes the tenant, so pass it straight through to the audit writer
- [ ] Write one audit row per session created

## Task 3: Cache the audit feed

- [ ] Use the existing `get`/`set` helpers in `src/lib/cache.ts` to memoise the last 50 audit rows
- [ ] Invalidate on write
