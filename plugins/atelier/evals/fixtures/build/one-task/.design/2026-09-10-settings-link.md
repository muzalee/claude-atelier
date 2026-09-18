# Design: Settings link in the avatar menu

## Problem

The settings page exists at `/settings`, but nothing links to it. Users find it only
when support sends them the URL.

## Solution

Add a "Settings" item to the existing avatar menu, between Profile and Sign out.
No new component, no new route.

**Considered and rejected**

| Alternative | Why it lost |
| ----------- | ----------- |
| A gear icon in the header | Adds a header slot for one link; the avatar menu already holds account items |

## Tasks

- [ ] 1. Avatar menu: add a "Settings" link to `/settings` between Profile and Sign out

## Implementation
