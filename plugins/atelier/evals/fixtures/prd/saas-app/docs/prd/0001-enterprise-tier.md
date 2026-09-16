---
prd: 0001
title: Enterprise tier
status: approved
owner: muza
created: 2026-07-20
updated: 2026-08-14
---

# Enterprise tier

## Problem

Cadence is sold per-seat to teams of 5–30. Six deals in the last two quarters
stalled at procurement, not at evaluation: the buyer liked the product, then
security review asked for SSO and an audit trail and we had neither. Two of the
six bought a competitor. The rest are still waiting.

We are not losing on scheduling features. We are losing on the paperwork that
lets a company above ~50 people say yes.

## Users

- **IT / security reviewer** at a 50–500 person company. Does not use Cadence.
  Decides whether it can be bought. Wants SSO, an audit trail, and a way to
  remove access when someone leaves.
- **Workspace admin** — already a Cadence user, now responsible for a bigger
  team. Currently invites everyone by hand.

## Requirements

| ID   | Requirement                                                                 | Priority |
| ---- | --------------------------------------------------------------------------- | -------- |
| FR-1 | SAML 2.0 SSO against Okta and Entra ID, configured per workspace by an admin | MUST     |
| FR-2 | SCIM 2.0 user provisioning and deprovisioning from the customer's IdP        | MUST     |
| FR-3 | An audit log of security-relevant events: sign-in, permission change, schedule deletion, export | MUST |
| FR-4 | Admins can export the audit log as CSV for a chosen date range              | SHOULD   |
| FR-5 | Enforce SSO-only sign-in for a workspace, disabling password login          | SHOULD   |
| FR-6 | A workspace-level session timeout an admin can set                          | MAY      |

## Non-functional

| ID    | Requirement                                                          |
| ----- | -------------------------------------------------------------------- |
| NFR-1 | Audit log entries are retained for 90 days                           |
| NFR-2 | Audit log writes never block the user action that produced them      |
| NFR-3 | SSO sign-in completes in under 3s at p95                             |

## Non-Goals

- **On-prem or self-hosted deployment — not ever.** Cadence is a hosted product
  and a second deployment target would change every release decision we make.
- **Per-field permissions.** Workspace-level roles are enough at this size;
  nobody in the six stalled deals asked for finer grain.
- **SOC 2 certification.** Real, expensive, and a separate initiative — this PRD
  covers the product capabilities a reviewer asks for, not the audit itself.
- **Migrating existing workspaces to SSO automatically.** Opt-in per workspace.

## Success metrics

| Metric                                            | Baseline | Target        |
| ------------------------------------------------- | -------- | ------------- |
| Deals stalled at security review                  | 6 of 11  | under 1 in 10 |
| Time from security questionnaire to signed        | 47 days  | under 21 days |
| Workspaces above 50 seats                         | 2        | 12            |

## Scope by Phase

| Phase | Contains          | Shippable on its own?                                  |
| ----- | ----------------- | ------------------------------------------------------- |
| 1     | FR-1, FR-3        | Yes — SSO plus an audit trail answers most of the questionnaire |
| 2     | FR-2, FR-4        | Yes — provisioning and export, once SSO is real         |
| 3     | FR-5, FR-6        | Yes — hardening, only useful after phase 1              |

## Dependencies

- An IdP test tenant for both Okta and Entra ID before FR-1 can be verified.
- Legal sign-off on what the audit log retains, before FR-3 ships.

## Changelog

| Date       | Change                                                        | Why                                              |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------ |
| 2026-07-20 | Created                                                       | Six deals stalled at security review             |
| 2026-08-02 | FR-5 dropped from MUST to SHOULD                              | Design partners wanted a password fallback during rollout |
| 2026-08-14 | Added NFR-2                                                   | Audit writes were blocking schedule saves in the spike |
