---
prd: 0001
title: Enterprise tier
status: approved
owner: muzalee
created: 2026-08-04
updated: 2026-08-04
---

## Problem

Companies above roughly 100 seats ask for controls Cadence does not have: SSO,
an audit trail, and a per-department split of the schedule. They currently work
around it with shared logins, which is also why support cannot tell who changed
what.

## Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | SSO via SAML for accounts on the enterprise plan | MUST |
| FR-2 | Audit log of every schedule mutation, retained 90 days | MUST |
| FR-3 | Per-department schedules within one account | SHOULD |

## Non-Goals

- **On-prem or self-hosted deployment — not ever.** Cadence is single-tenant-per-row
  on our infrastructure. Shipping a deployable artefact means supporting customer
  Postgres versions, customer upgrade windows, and a security boundary we cannot
  audit. Enterprise customers who need data residency get a region, not a binary.
- Custom SLAs beyond the standard 99.9%.
- Billing changes — enterprise is quoted and invoiced manually for now.

## Success Metrics

- 3 enterprise accounts closed by end of Q1 (baseline: 0)
- Zero shared-login support tickets from accounts over 100 seats (baseline: 11/month)
