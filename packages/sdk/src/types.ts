import type { CloseReason } from './protocol';

export interface CheckoutOptions {
  /** Catalog id of the product being purchased. */
  productId: string;

  /** Fired exactly once, after the fake payment provider confirms the charge. */
  onSuccess?: (payload: { sessionId: string }) => void;

  /** Fired when the checkout overlay closes, whatever the reason. */
  onClose?: (payload: { reason: CloseReason }) => void;

  /** Fired for checkout-level errors (invalid product, declined/failed payment,
   * failure to initialize). Declines and network failures do not close the
   * checkout — the shopper can retry inline — so this can fire more than once
   * per `open()` call. */
  onError?: (payload: { code: string; message: string }) => void;
}
