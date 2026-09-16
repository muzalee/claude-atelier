#!/bin/bash
# Run one atelier eval suite under a hard cost ceiling.
#
#   evals/run.sh errors              # one suite, --runs 1, ceiling $4
#   evals/run.sh all                 # every suite, each with its own ceiling
#   EVAL_RUNS=3 EVAL_BUDGET_USD=12 evals/run.sh logging
#   EVAL_ABLATION=with-without evals/run.sh prd
#
# One ceiling per suite is the point: a budget hit costs one suite's results,
# not the whole 17-case pass. Results and the JSON land in evals/results/.
#
# The judge defaults to sonnet, not the CLI's haiku. Haiku mis-votes a whole
# class of assertion -- bare negatives ("does not suggest X") and anything
# phrased as a tool action ("reads file Y") -- failing them against messages
# that plainly comply. Measured on preflight: prd-gate 0.33 -> 1.00,
# ambiguous-step 0.33 -> 0.71, with grader wording untouched. The judge was
# $0.0117 of a $0.31 run, so the fidelity is nearly free.
set -euo pipefail

TAGS=(errors logging prd preflight ship)
tag=${1:?usage: run.sh <errors|logging|prd|preflight|ship|all> [extra flags...]}
shift

evals=$(cd "$(dirname "$0")" && pwd)
plugin=$(dirname "$evals")

if [[ $tag == all ]]; then
  for t in "${TAGS[@]}"; do "$evals/run.sh" "$t" "$@" || echo "suite $t exited $? — continuing"; done
  exit 0
fi

mkdir -p "$evals/results"
exec claude plugin eval "$plugin" \
  --tag "$tag" \
  --runs "${EVAL_RUNS:-1}" \
  --ablation "${EVAL_ABLATION:-none}" \
  --max-cost-usd "${EVAL_BUDGET_USD:-4}" \
  --judge-model "${EVAL_JUDGE:-claude-sonnet-5}" \
  --scaffold --trust-plugin --allow-tools Bash Write Edit \
  --json "$evals/results/$tag.json" \
  "$@"
