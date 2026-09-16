---
type: llm
focus: {source: file, path: src/worker.ts}
weight: 1
---

Stops acking failed work — a failure either retries or goes to a dead-letter, never silently succeeds
