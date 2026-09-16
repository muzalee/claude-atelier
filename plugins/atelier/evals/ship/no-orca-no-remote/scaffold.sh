#!/bin/bash
set -euo pipefail
cp -R "$(dirname "$0")/../../fixtures/ship/user-settings/." .
# The case is about hitting the MISSING REMOTE at the PR step — which needs a
# repo with a main branch to have got that far. Without this the run has zero
# commits and no main, and /ship correctly stops at a different obstacle.
git init -q -b main
git add -A
git -c user.email=eval@example.invalid -c user.name=eval commit -qm "chore: project scaffold"
