# Tasks: Enterprise tier

## Task 1: Rate limiting

- [ ] Add rate limiting to the API so one customer cannot exhaust capacity for everyone else
- [ ] Return 429 with a `Retry-After` header once the limit is hit
- [ ] Cover the limit in a route test

## Task 2: Per-tenant schedule listing

- [ ] Filter `GET /api/schedules` by the `x-tenant-id` header already read in `src/routes/schedules.ts`
- [ ] 400 when the header is missing
