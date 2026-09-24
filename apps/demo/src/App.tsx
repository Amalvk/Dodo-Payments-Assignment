import { useCallback, useRef, useState } from 'react';
import { DodoCheckout } from '@dodo/checkout-sdk';
import { formatPrice, products } from '@dodo/products';
import { EventLog, type LogEntry } from './components/EventLog';

const PRODUCT = products.prod_123;

// Local dev needs no configuration — the SDK's built-in default already
// points at the checkout app's own dev server (localhost:5174). A deployed
// build sets VITE_CHECKOUT_URL at build time to point at wherever
// apps/checkout is actually hosted; see README "Deploying".
if (import.meta.env.VITE_CHECKOUT_URL) {
  DodoCheckout.configure({ checkoutUrl: import.meta.env.VITE_CHECKOUT_URL });
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export default function App() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const isOpenRef = useRef(false);
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  const log = useCallback((entry: Omit<LogEntry, 'id' | 'time'>) => {
    setEntries((prev) => [
      { ...entry, id: crypto.randomUUID(), time: timestamp() },
      ...prev,
    ]);
  }, []);

  const handleBuyClick = useCallback(() => {
    if (!isOpenRef.current) {
      isOpenRef.current = true;
      log({ label: 'CHECKOUT_OPENED', tone: 'info' });
    }

    DodoCheckout.open({
      productId: PRODUCT.id,
      onSuccess: ({ sessionId }) => {
        log({ label: 'PAYMENT_SUCCESS', detail: sessionId, tone: 'success' });
      },
      onClose: ({ reason }) => {
        isOpenRef.current = false;
        log({ label: 'CHECKOUT_CLOSE', detail: `reason: ${reason}`, tone: 'neutral' });
      },
      onError: ({ code, message }) => {
        log({ label: 'PAYMENT_ERROR', detail: `${code} — ${message}`, tone: 'error' });
      },
    });
  }, [log]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold tracking-tight text-slate-900">Acme AI</span>
          <nav className="hidden gap-8 text-sm font-medium text-slate-500 sm:flex">
            <span>Product</span>
            <span>Pricing</span>
            <span>Docs</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            AI tools for modern teams
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Build faster with AI-powered workflows.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            Acme AI helps your team plan, write, and ship — without leaving the tools you already
            use.
          </p>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{PRODUCT.name}</p>
            <p className="mt-1 text-sm text-slate-500">{PRODUCT.description}</p>
            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-slate-900">
                {formatPrice(PRODUCT)}
              </span>
              <span className="text-sm text-slate-500">/ {PRODUCT.billingPeriod}</span>
            </p>

            <button
              ref={buyButtonRef}
              type="button"
              onClick={handleBuyClick}
              className="mt-6 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-brand-600"
            >
              Start Pro
            </button>

            <p className="mt-6 text-center text-xs font-medium text-slate-400">
              Trusted by modern teams
            </p>
          </div>

          <EventLog entries={entries} />
        </section>

        <section className="mt-16 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">Test cards</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            <li>4242 4242 4242 4242 — succeeds</li>
            <li>4000 0000 0000 0002 — always declined</li>
            <li>4000 0000 0000 0341 — fails once, then succeeds on retry</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
