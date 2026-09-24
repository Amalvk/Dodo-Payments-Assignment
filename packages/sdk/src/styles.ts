const STYLE_ELEMENT_ID = 'dodo-checkout-styles';

/** All overlay/iframe presentation lives in the host page (the checkout app
 * only styles its own panel content inside the iframe), so it's injected
 * once as a scoped stylesheet rather than pulled in as a build dependency. */
const CSS = `
.dodo-checkout-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0);
  transition: background-color 200ms ease;
}

.dodo-checkout-overlay--visible {
  background: rgba(15, 23, 42, 0.5);
}

.dodo-checkout-iframe {
  width: min(440px, 100%);
  height: min(680px, 100%);
  border: 0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.28);
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.dodo-checkout-overlay--visible .dodo-checkout-iframe {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (max-width: 640px) {
  .dodo-checkout-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .dodo-checkout-iframe {
    width: 100%;
    height: 100%;
    max-height: 100dvh;
    border-radius: 20px 20px 0 0;
    transform: translateY(24px);
  }

  .dodo-checkout-overlay--visible .dodo-checkout-iframe {
    transform: translateY(0);
  }
}
`;

export function injectStyles(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
