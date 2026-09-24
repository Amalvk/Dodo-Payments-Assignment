/** Typed, stable error codes surfaced to the host via `onError`. */
export const CheckoutErrorCode = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  CHECKOUT_INIT_FAILED: 'CHECKOUT_INIT_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type CheckoutErrorCode = (typeof CheckoutErrorCode)[keyof typeof CheckoutErrorCode];
