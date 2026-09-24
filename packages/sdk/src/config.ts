/**
 * Where the checkout application is hosted. The SDK needs this both to
 * build the iframe `src` and, critically, to validate the `origin` of
 * incoming postMessage events — messages from anywhere else are ignored.
 *
 * Defaults to the local dev server for this repo. A real integration would
 * set this once via `DodoCheckout.configure()` to Dodo's hosted checkout
 * origin; it is deliberately kept out of `CheckoutOptions` so callers don't
 * have to think about it on every `open()` call.
 */
const DEFAULT_CHECKOUT_URL = 'http://localhost:5174';

export interface ResolvedConfig {
  checkoutUrl: string;
  checkoutOrigin: string;
}

let currentConfig: ResolvedConfig = resolve(DEFAULT_CHECKOUT_URL);

function resolve(checkoutUrl: string): ResolvedConfig {
  return { checkoutUrl, checkoutOrigin: new URL(checkoutUrl).origin };
}

export function getConfig(): ResolvedConfig {
  return currentConfig;
}

export function setCheckoutUrl(checkoutUrl: string): void {
  currentConfig = resolve(checkoutUrl);
}
