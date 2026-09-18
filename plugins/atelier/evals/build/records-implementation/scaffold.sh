#!/bin/bash
set -euo pipefail
cp -R "$(dirname "$0")/../../fixtures/build/one-task/." .
git init -q -b main
git add -A
git -c user.email=eval@example.invalid -c user.name=eval commit -qm "chore: project scaffold"
