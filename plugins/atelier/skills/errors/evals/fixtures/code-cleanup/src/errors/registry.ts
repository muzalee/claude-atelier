// ref -> { code, status, retryable, userMessage }
// grew organically; numbering is not contiguous and the domains are mixed up
export const REGISTRY = {
  A0001: { code: "INVALID_CREDENTIALS", status: 401, retryable: false,
           userMessage: "That email and password don't match. Try again or reset your password." },
  A0004: { code: "TOKEN_EXPIRED", status: 401, retryable: false,
           userMessage: "Your session expired. Sign in again." },
  V0002: { code: "FIELD_REQUIRED", status: 400, retryable: false,
           userMessage: "Check the highlighted fields and try again." },
  R0404: { code: "NOT_FOUND", status: 404, retryable: false,
           userMessage: "We couldn't find that. It may have been deleted." },
  P0001: { code: "CARD_DECLINED", status: 402, retryable: false,
           userMessage: "Your card was declined. Try another payment method." },
  A0009: { code: "RATE_LIMITED", status: 429, retryable: true,
           userMessage: "Too many attempts. Wait a minute and try again." },
  X0000: { code: "UNEXPECTED", status: 500, retryable: false,
           userMessage: "Something went wrong on our end. Try again in a moment." },
} as const;

export type Ref = keyof typeof REGISTRY;
