import { createCheckoutMessage, type CheckoutMessageInput } from '@dodo/checkout-sdk';

/**
 * Sends events up to the SDK running in the host page. The target origin
 * comes from the `parentOrigin` query param the SDK stamped onto our iframe
 * `src` — we never post with `"*"`, so a message can only ever be delivered
 * to the origin that actually opened this checkout.
 */
export function postToParent(message: CheckoutMessageInput): void {
  const parentOrigin = getParentOrigin();
  if (!parentOrigin || window.parent === window) return;
  window.parent.postMessage(createCheckoutMessage(message), parentOrigin);
}

export function getParentOrigin(): string | null {
  const raw = new URLSearchParams(window.location.search).get('parentOrigin');
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function getProductId(): string | null {
  return new URLSearchParams(window.location.search).get('productId');
}
