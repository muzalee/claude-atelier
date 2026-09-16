# Test plan: User settings

## Worth testing

- Saving an empty display name is rejected and the inline error appears.
- Saving a valid display name persists and survives a reload.
- The digest toggle round-trips: set it, reload, it holds.
- A user cannot read or write another user's settings.

## Not worth testing

- That the heading renders. It is a string in a div.
- Toggle animation states.
