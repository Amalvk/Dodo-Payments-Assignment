# Dodo Checkout

A tiny embeddable checkout: a framework-independent SDK, a checkout application that
runs inside an iframe, and a demo merchant site that embeds it. No backend — payments
are simulated with realistic delays, declines, and a retryable network failure.

**Live demo:** _add link here once deployed_
**Walkthrough recording:** _add link here if recorded_

## Overview

Four pieces, one repo:

- **`packages/sdk`** — the plain-TypeScript SDK a merchant site imports. Exposes
  `DodoCheckout.open(options)` / `DodoCheckout.close()`, and owns the iframe + overlay
  lifecycle, postMessage protocol, and focus/scroll management.
- **`apps/checkout`** — the checkout application itself (React). Runs inside the
  iframe the SDK creates. Resolves the product, collects email + card, simulates a
  payment, and reports back to the SDK.
- **`apps/demo`** — a small merchant site ("Acme AI") that embeds the SDK and shows a
  live log of every callback it receives, so you can watch the contract in action.
- **`apps/demo/public/vanilla-embed.html`** — proof that "add one script, call a
  function" is literally true: a bare HTML page with no framework and no bundler,
  embedding the SDK via a single `<script src="/dodo-checkout-sdk.js">` tag. See
  [Plain HTML embed](#plain-html-embed-no-bundler) below.

A shared, dependency-free `packages/products` package holds a static product catalog
that both the demo (for pricing display) and the checkout app (as the source of truth
for what's being charged) read from — no backend needed to keep them in sync.

## Architecture

```
Merchant demo page  ──DodoCheckout.open()──>  SDK
                                                │
                                    creates iframe + overlay
                                                │
                                                v
                                     Checkout application
                                                │
                                     fake payment service
                                                │
                                                v
                                     Checkout application
                                                │
                                    postMessage (typed, origin-checked)
                                                │
                                                v
                                               SDK ──callbacks──> Merchant demo page
```

### The security boundary

Card number, expiry, and CVC never leave `apps/checkout`. They live in that iframe's
React state and are read once by `fakePaymentService`, in-memory — never logged, never
included in a postMessage payload, never reachable from the host page (a cross-origin
iframe's DOM isn't accessible to its parent to begin with). The host only ever receives
the four message types below.

## Running locally

```bash
npm install
npm run dev
```

This first builds the single-file SDK bundle (see below), then starts both Vite dev
servers with `concurrently`:

- demo site → `http://localhost:5173`
- checkout app → `http://localhost:5174`

Open the demo, click **Start Pro**. The SDK defaults to loading the checkout from
`http://localhost:5174` — see [Communication](#communication--origin-configuration) for
how that's configured.

### Plain HTML embed (no bundler)

`npm run dev` (or `npm run build:sdk-bundle` on its own) compiles `packages/sdk` into a
single dependency-free file at `apps/demo/public/dodo-checkout-sdk.js` — the literal
"one script" a site with no build tooling of its own would drop in. With the dev server
running, open `http://localhost:5173/vanilla-embed.html`: it's a plain `.html` file with
a `<script src="/dodo-checkout-sdk.js">` tag and ~15 lines of inline vanilla JS calling
`window.DodoCheckout.open(...)` — no React, no imports, nothing workspace-specific.

Other scripts:

```bash
npm run build       # production build of both apps (+ the SDK bundle)
npm run typecheck   # tsc --noEmit across every package
npm run lint         # eslint across the repo
```

## Deploying

`apps/checkout` and `apps/demo` are two independent static builds (`vite build` →
`dist/`) — deploy them to any static host, on any two origins.

1. Deploy `apps/checkout/dist` first and note its URL.
2. Before building the demo, set `VITE_CHECKOUT_URL` to that URL (copy
   `apps/demo/.env.example` to `apps/demo/.env.production`, or set it in your host's
   build settings) — this is the one thing that's hardcoded to `localhost:5174` for
   local dev and needs to follow the checkout app wherever it actually ends up.
3. `npm run build` (builds the SDK bundle, then both apps). Deploy `apps/demo/dist`.

No other config is origin-specific: the SDK derives the checkout's expected postMessage
origin from `VITE_CHECKOUT_URL` itself (see [Communication](#communication--origin-configuration)),
so there's nothing to keep in sync by hand.

## SDK API

```ts
import { DodoCheckout } from '@dodo/checkout-sdk';

DodoCheckout.open({
  productId: 'prod_123',
  onSuccess: ({ sessionId }) => console.log('paid', sessionId),
  onClose: ({ reason }) => console.log('closed', reason), // 'user' | 'success' | 'error' | 'system'
  onError: ({ code, message }) => console.error(code, message),
});

DodoCheckout.close(); // optional: programmatic dismiss (fires onClose with reason "system")
```

That's the whole public surface. `productId` is the only required input — the SDK
resolves everything else (product details, pricing, layout) inside the checkout app, so
the host never has to duplicate that data or keep it in sync.

`onError` can fire more than once per `open()` call: a declined card or a network
failure reports an error but keeps the checkout open for retry, and only a close (`X`,
Escape, success, or a fatal init failure) fires `onClose`. Both `onSuccess` and
`onClose` are guaranteed to fire **at most once** per session — a `closed` flag in the
controller (see `packages/sdk/src/checkout-controller.ts`) prevents a race between,
say, Escape and an in-flight `CHECKOUT_CLOSE` message from double-firing callbacks.

## Communication & origin configuration

SDK and checkout talk over `window.postMessage`, using one typed union
(`packages/sdk/src/protocol.ts`) that both sides import — nothing constructs a raw
`{ type: "..." }` object anywhere else:

```ts
type CheckoutMessage =
  | { source: 'dodo-checkout'; type: 'CHECKOUT_READY' }
  | { source: 'dodo-checkout'; type: 'PAYMENT_SUCCESS'; sessionId: string }
  | { source: 'dodo-checkout'; type: 'PAYMENT_ERROR'; code: CheckoutErrorCode; message: string }
  | { source: 'dodo-checkout'; type: 'CHECKOUT_CLOSE'; reason: 'user' | 'success' | 'error' | 'system' };
```

Every message carries a `source` tag, and `isCheckoutMessage()` validates both that tag
and the shape of each variant before anything trusts `event.data` — postMessage is a
public mailbox on the page; arbitrary scripts, extensions, or devtools can post to it.

**Origin checking, both directions:**

- **SDK → checkout**: the SDK builds the iframe `src` itself
  (`http://localhost:5174?productId=...&parentOrigin=...`), so there's no need to
  validate messages *into* the iframe over postMessage — the checkout app just reads
  `productId` off its own URL.
- **Checkout → SDK**: the checkout app posts back to `window.parent` using
  `parentOrigin` — the value the SDK itself stamped into the URL, i.e. the host's own
  origin, never `"*"`.
- **SDK receiving messages**: `checkout-controller.ts` rejects any message whose
  `event.origin` doesn't match the configured checkout origin, and further checks
  `event.source === iframe.contentWindow` so a same-origin iframe elsewhere on the page
  can't spoof the checkout.

The checkout origin defaults to `http://localhost:5174` for local dev. A real
integration would point it at Dodo's hosted checkout once, via:

```ts
DodoCheckout.configure({ checkoutUrl: 'https://checkout.dodopayments.com' });
```

This is deliberately **not** part of `CheckoutOptions` — every `open()` call shouldn't
have to think about where checkout is hosted.

## Payment test cards

| Card number         | Behavior                                    |
| -------------------- | -------------------------------------------- |
| `4242 4242 4242 4242` | Succeeds                                    |
| `4000 0000 0000 0002` | Always declined                              |
| `4000 0000 0000 0341` | Fails (network) on the first attempt, then succeeds on retry |

Any other well-formed card number defaults to success, so exploring the form isn't a
dead end. All three cards run through `apps/checkout/src/lib/fakePaymentService.ts`,
which adds a randomized 500–1500ms delay before resolving.

## Edge cases handled

- **Duplicate `open()` calls** — see [Decisions](#decisions-i-went-back-and-forth-on) below.
- **Duplicate payment submits** — the Pay button is disabled while `payment.status ===
  'processing'`, and `submit()` in `useCheckoutSession` short-circuits if a payment is
  already in flight.
- **Declined payment** — inline "Payment declined" screen with "Try again"; card fields
  are cleared since a decline implies the card itself is the problem.
- **Network failure** — inline "Something went wrong" screen with "Retry payment";
  fields are *kept* (unlike a decline) because the retry is expected to succeed with
  the same card.
- **Invalid product id** — checkout shows "Product unavailable" and fires
  `onError({ code: 'PRODUCT_NOT_FOUND', ... })`; the shopper's only action is Close.
- **Invalid form input** — inline, field-level errors on submit; this is a local UI
  concern and intentionally does *not* round-trip through `onError` (that channel is
  for checkout-level failures the host needs to know about, not per-keystroke typos).
- **Checkout close** — `X`, Escape, and a fatal init failure all close; **clicking the
  backdrop does not** (see Decisions).
- **Iframe init failure** — if `CHECKOUT_READY` never arrives within 8s, the SDK fires
  `onError({ code: 'CHECKOUT_INIT_FAILED', ... })` and tears down the overlay. A React
  `ErrorBoundary` inside the checkout app covers the same case if the app crashes after
  loading instead of failing to load at all.
- **Cleanup** — closing removes the iframe/overlay, both `message` and `keydown`
  listeners, restores `body` scroll, and restores focus to whatever had it before
  `open()` was called. Opening again after a close is a clean slate.
- **Callback duplication** — a `closed` guard in `CheckoutController` ensures `onClose`
  fires exactly once regardless of which of several close paths triggered it.

## Accessibility

- Every input has a real `<label>`; errors are wired up via `aria-describedby` and
  `aria-invalid`, and are never color-only (an icon + text message, not just a red
  border).
- A visually-hidden `aria-live="polite"` region announces state changes ("Processing
  your payment.", "Payment declined.", etc.) for screen reader users who can't see the
  panel re-render.
- Escape closes the checkout from anywhere in the form.
- Focus moves into the checkout on open: the SDK calls `iframe.focus()` once it loads
  (that's as far as it can reach across the cross-origin boundary), and the checkout
  app autofocuses the email field itself, completing the handoff. Focus returns to
  whatever triggered `open()` — normally the Buy button — on close.
- The close button and all form controls are real `<button>`/`<input>` elements with
  visible `:focus-visible` outlines, so the whole flow is keyboard-operable.

## Decisions I went back and forth on

### Decision 1 — iframe vs. popup window

**Option A — `window.open()` popup**
Pros: fully separate browsing context, trivially cross-origin-safe, no CSS conflicts
with the host page at all.
Cons: popup blockers can silently eat it if `open()` isn't called synchronously from
the triggering click (async product lookups make that fragile); it reads as a
disruptive, separate window rather than "part of" the page the shopper is already on;
positioning/sizing it to feel like a polished in-page modal is awkward and
inconsistent across browsers.

**Option B — iframe overlay**
Pros: stays visually anchored to the host page (feels like a modal, not a new window);
same-origin-isolation guarantees hold just as well as a popup (a cross-origin iframe's
DOM is just as unreachable from the parent); full control over entrance/exit
animation, sizing, and mobile layout via CSS the SDK injects into the host page.
Cons: the SDK has to actively manage focus, scroll-locking, and z-index itself instead
of getting it for free from a real separate window.

**Decision: iframe.** The security boundary is equivalent, and it's the only option
that reads as a polished, native-feeling checkout rather than a window the browser
might flag or the user might lose track of. This is also what every mainstream
"embeddable checkout" product actually ships.

### Decision 2 — clicking outside to close

**Option A — backdrop click closes**
Pros: matches the conventional "modal" affordance a lot of users reach for reflexively.
Cons: a payment flow is exactly the wrong place for an *accidental* dismissal — a
misclick after typing in a full card number loses that input for no benefit. It also
means a decline/retry screen can vanish from an errant click when the shopper meant to
re-read the error message.

**Option B — backdrop click does nothing**
Pros: the checkout can only close via a clearly intentional action (`X` or Escape),
which matches how real payment products (Stripe Checkout included) actually behave —
they deliberately don't close on outside click either.
Cons: slightly less "standard modal" muscle memory; a shopper who habitually
clicks outside to dismiss things gets no feedback that it didn't work.

**Decision: backdrop click does nothing.** For a payment form specifically, protecting
against losing entered data (or losing an error message mid-read) outweighs matching
generic modal conventions. This was also given as an explicit product requirement.

Two smaller calls worth naming, since they weren't asked for but shaped the code:

- **Duplicate `open()` while a checkout is already active is ignored, not queued or
  restarted.** The alternative — tearing down the in-progress session to start a fresh
  one — would silently discard whatever the shopper already typed. Ignoring the call
  keeps the existing session (and whatever they've entered) intact; the same
  `CheckoutController.isOpen()` guard also makes a rapid double-click on "Buy" a no-op
  instead of a second overlay stacking on the first.
- **Success auto-closes after ~1.6s instead of waiting for a "Done" click.** `onSuccess`
  fires immediately (the host has the `sessionId` right away regardless), and the
  confirmation screen is visible long enough to register before the checkout dismisses
  itself — one less click in the one place a payment flow should feel *finished*, not
  like it's asking for more input.

## What I'd explore next

- A real payment provider integration behind `fakePaymentService`'s interface.
- Backend-issued checkout sessions (today `productId` round-trips through a public
  URL param with no server-side validation beyond the static catalog lookup).
- A CSP for the checkout app, and locking the SDK's default checkout origin down
  per-environment instead of a single hardcoded dev default.
- 3DS/SCA-style step-up flows, which need a whole extra state (and iframe-within-iframe
  or redirect handling) this scope doesn't need.
- Multiple payment methods, localization, and saved payment methods.
- Webhook-based payment confirmation instead of trusting the client-reported result —
  today the "fake payment service" *is* the source of truth, which is fine for a demo
  but is exactly the kind of trust boundary a real integration can't have client-side.
- Idempotency keys on retry so a flaky network doesn't risk a double charge once a real
  backend is involved.
- Basic analytics/observability on the funnel (open → submit → success/error) — useful
  today only as console noise, not shipped, to keep this scope small.

This list is longer than what's implemented on purpose — knowing what *not* to build
for a scoped prototype is as much the point of this exercise as the parts that are
built.
