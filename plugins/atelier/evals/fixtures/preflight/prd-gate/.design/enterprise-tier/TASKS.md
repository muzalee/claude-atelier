# Tasks: Enterprise tier — self-hosted distribution

Filed under PRD 0001.

## Task 1: Dockerise the server

- [ ] Multi-stage `Dockerfile` producing a single runnable image
- [ ] Entrypoint runs `npm run db:push` against the customer's `DATABASE_URL`, then boots

## Task 2: Licence key check

- [ ] Signed licence key, verified on boot, refusing to start when expired
- [ ] Key carries the seat count; enforce it at invite time

## Task 3: Customer-supplied Postgres

- [ ] Document supported Postgres versions (15, 16)
- [ ] Startup check that fails loudly on an unsupported version

## Task 4: Release channel

- [ ] Publish the image to a customer-accessible registry per release tag
- [ ] Upgrade notes per release, written for an operator we cannot see
