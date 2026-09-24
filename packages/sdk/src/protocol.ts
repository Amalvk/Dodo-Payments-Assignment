import type { CheckoutErrorCode } from './errors';

/**
 * postMessage protocol shared between the SDK (host page) and the checkout
 * application (iframe). This is the single source of truth for message
 * shapes on both sides of the boundary — nothing else in either app should
 * construct or match on raw string message names.
 */

export type CloseReason = 'user' | 'success' | 'error' | 'system';

/** Tags every message so we can tell our own traffic apart from unrelated
 * postMessage noise (browser extensions, analytics scripts, devtools, etc.)
 * before trusting anything about the payload shape. */
export const DODO_MESSAGE_SOURCE = 'dodo-checkout' as const;

export type CheckoutMessage =
  | { source: typeof DODO_MESSAGE_SOURCE; type: 'CHECKOUT_READY' }
  | { source: typeof DODO_MESSAGE_SOURCE; type: 'PAYMENT_SUCCESS'; sessionId: string }
  | {
      source: typeof DODO_MESSAGE_SOURCE;
      type: 'PAYMENT_ERROR';
      code: CheckoutErrorCode;
      message: string;
    }
  | { source: typeof DODO_MESSAGE_SOURCE; type: 'CHECKOUT_CLOSE'; reason: CloseReason };

/** `Omit<CheckoutMessage, 'source'>` collapses the union down to its shared
 * `type` field (TS resolves `keyof` on a union to the *common* keys), which
 * would let `{ type: 'PAYMENT_ERROR' }` through with no `code`/`message`.
 * Distributing member-by-member first keeps each variant's own fields. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type CheckoutMessageInput = DistributiveOmit<CheckoutMessage, 'source'>;

const VALID_TYPES = new Set<CheckoutMessage['type']>([
  'CHECKOUT_READY',
  'PAYMENT_SUCCESS',
  'PAYMENT_ERROR',
  'CHECKOUT_CLOSE',
]);

const VALID_REASONS = new Set<CloseReason>(['user', 'success', 'error', 'system']);

/** Runtime type guard — never trust `event.data` from postMessage without it. */
export function isCheckoutMessage(data: unknown): data is CheckoutMessage {
  if (typeof data !== 'object' || data === null) return false;
  const value = data as Record<string, unknown>;
  if (value.source !== DODO_MESSAGE_SOURCE) return false;
  if (typeof value.type !== 'string' || !VALID_TYPES.has(value.type as CheckoutMessage['type'])) {
    return false;
  }

  switch (value.type as CheckoutMessage['type']) {
    case 'CHECKOUT_READY':
      return true;
    case 'PAYMENT_SUCCESS':
      return typeof value.sessionId === 'string' && value.sessionId.length > 0;
    case 'PAYMENT_ERROR':
      return typeof value.code === 'string' && typeof value.message === 'string';
    case 'CHECKOUT_CLOSE':
      return typeof value.reason === 'string' && VALID_REASONS.has(value.reason as CloseReason);
    default:
      return false;
  }
}

export function createCheckoutMessage(message: CheckoutMessageInput): CheckoutMessage {
  return { ...message, source: DODO_MESSAGE_SOURCE } as CheckoutMessage;
}
