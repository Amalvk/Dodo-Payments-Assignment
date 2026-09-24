import { CheckoutController } from './checkout-controller';
import { setCheckoutUrl } from './config';

export type { CheckoutOptions } from './types';
export type { CloseReason, CheckoutMessage, CheckoutMessageInput } from './protocol';
export { createCheckoutMessage, isCheckoutMessage } from './protocol';
export { CheckoutErrorCode } from './errors';
export type { CheckoutErrorCode as CheckoutErrorCodeType } from './errors';
export { createSessionId } from './session';

const controller = new CheckoutController();

/**
 * The single developer-facing entry point for embedding Dodo checkout.
 *
 *   DodoCheckout.open({
 *     productId: 'prod_123',
 *     onSuccess: ({ sessionId }) => {},
 *     onClose: ({ reason }) => {},
 *     onError: ({ code, message }) => {},
 *   });
 */
export const DodoCheckout = {
  open(options: import('./types').CheckoutOptions): void {
    controller.open(options);
  },

  /** Programmatically dismiss an open checkout (fires onClose with reason "system"). */
  close(): void {
    controller.close();
  },

  /** Points the SDK at a non-default checkout deployment. Advanced/local-dev use only —
   * most integrations never need this. */
  configure(options: { checkoutUrl: string }): void {
    setCheckoutUrl(options.checkoutUrl);
  },
};
