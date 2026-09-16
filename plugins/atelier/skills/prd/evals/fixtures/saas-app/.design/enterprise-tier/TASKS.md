# Tasks: Enterprise tier

## Task 1: SAML sign-in (FR-1)

- [ ] Workspace SSO config form — metadata URL, certificate upload
- [ ] Assertion consumer endpoint, session issued on valid assertion

## Task 2: Audit log write path (FR-3)

- [ ] Record sign-in, permission change, schedule deletion, export
- [ ] Writes are fire-and-forget so they cannot block the user action (NFR-2)

## Task 3: SCIM provisioning (FR-2)

- [ ] Token generation in workspace settings, shown once
- [ ] User create / update / deactivate from the IdP

## Task 4: Audit log viewer + export (FR-4)

- [ ] Table with actor and event-type filters, 50 per page
- [ ] CSV export for a date range, capped at the 90-day retention window
