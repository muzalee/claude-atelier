import { REGISTRY, type Ref } from "./registry.js";

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly userMessage: string;

  constructor(message: string, readonly ref: Ref,
              readonly context: Record<string, unknown> = {},
              options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
    Object.assign(this, REGISTRY[ref]);
  }
}
