import { getConfig } from './config';
import { CheckoutErrorCode } from './errors';
import { isCheckoutMessage, type CloseReason } from './protocol';
import { injectStyles } from './styles';
import type { CheckoutOptions } from './types';

const READY_TIMEOUT_MS = 8000;

/**
 * Owns the lifecycle of a single checkout overlay: building the iframe,
 * wiring up postMessage, and tearing everything down cleanly. There is
 * exactly one instance of this per page (see index.ts) — see `open()` for
 * how it handles being asked to open a second checkout while one is active.
 */
export class CheckoutController {
  private overlayEl: HTMLDivElement | null = null;
  private iframeEl: HTMLIFrameElement | null = null;
  private options: CheckoutOptions | null = null;
  private previousActiveElement: HTMLElement | null = null;
  private previousBodyOverflow = '';
  private readyTimeoutId: number | null = null;
  private closed = true;

  isOpen(): boolean {
    return this.overlayEl !== null;
  }

  open(options: CheckoutOptions): void {
    if (this.isOpen()) {
      // A checkout is already in flight. We deliberately keep it open and
      // ignore the new request rather than stacking overlays or restarting
      // the in-progress session — see README "Decisions" for the reasoning.
      return;
    }

    if (!options || typeof options.productId !== 'string' || options.productId.length === 0) {
      options?.onError?.({
        code: CheckoutErrorCode.VALIDATION_ERROR,
        message: 'A productId is required to open checkout.',
      });
      return;
    }

    this.options = options;
    this.closed = false;
    injectStyles();

    this.previousActiveElement = document.activeElement as HTMLElement | null;
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.className = 'dodo-checkout-overlay';

    const iframe = document.createElement('iframe');
    iframe.className = 'dodo-checkout-iframe';
    iframe.title = 'Dodo Checkout';
    iframe.setAttribute('allow', 'payment');
    iframe.src = this.buildCheckoutUrl(options.productId);

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    this.overlayEl = overlay;
    this.iframeEl = iframe;

    // Runs after the element is in the DOM so the transition actually plays.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('dodo-checkout-overlay--visible'));
    });

    iframe.addEventListener('load', this.handleIframeLoad);
    window.addEventListener('message', this.handleMessage);
    document.addEventListener('keydown', this.handleKeydown);

    this.readyTimeoutId = window.setTimeout(() => {
      this.options?.onError?.({
        code: CheckoutErrorCode.CHECKOUT_INIT_FAILED,
        message: 'The checkout failed to load. Please try again.',
      });
      this.teardown('error');
    }, READY_TIMEOUT_MS);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.teardown('system');
  }

  private buildCheckoutUrl(productId: string): string {
    const { checkoutUrl } = getConfig();
    const url = new URL(checkoutUrl);
    url.searchParams.set('productId', productId);
    url.searchParams.set('parentOrigin', window.location.origin);
    return url.toString();
  }

  private handleIframeLoad = (): void => {
    // Cross-origin, so we can't reach into the iframe's DOM — but we can
    // move focus to the iframe element itself. The checkout app then
    // autofocuses its first field on mount, completing the handoff.
    this.iframeEl?.focus();
  };

  private handleMessage = (event: MessageEvent): void => {
    const { checkoutOrigin } = getConfig();
    if (event.origin !== checkoutOrigin) return;
    if (!this.iframeEl || event.source !== this.iframeEl.contentWindow) return;
    if (!isCheckoutMessage(event.data)) return;

    const message = event.data;
    switch (message.type) {
      case 'CHECKOUT_READY':
        if (this.readyTimeoutId !== null) {
          window.clearTimeout(this.readyTimeoutId);
          this.readyTimeoutId = null;
        }
        break;
      case 'PAYMENT_SUCCESS':
        this.options?.onSuccess?.({ sessionId: message.sessionId });
        break;
      case 'PAYMENT_ERROR':
        this.options?.onError?.({ code: message.code, message: message.message });
        break;
      case 'CHECKOUT_CLOSE':
        this.teardown(message.reason);
        break;
    }
  };

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.teardown('user');
  };

  private teardown(reason: CloseReason): void {
    // Guards against the same session closing twice (e.g. a CHECKOUT_CLOSE
    // message arriving right as the ready-timeout also fires) so onClose is
    // always fired exactly once.
    if (this.closed) return;
    this.closed = true;

    if (this.readyTimeoutId !== null) {
      window.clearTimeout(this.readyTimeoutId);
      this.readyTimeoutId = null;
    }

    window.removeEventListener('message', this.handleMessage);
    document.removeEventListener('keydown', this.handleKeydown);
    this.iframeEl?.removeEventListener('load', this.handleIframeLoad);

    this.overlayEl?.remove();
    document.body.style.overflow = this.previousBodyOverflow;
    this.previousActiveElement?.focus();

    this.overlayEl = null;
    this.iframeEl = null;

    const options = this.options;
    this.options = null;
    options?.onClose?.({ reason });
  }
}
