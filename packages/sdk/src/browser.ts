import { DodoCheckout } from './index';

/**
 * Bundle entry point for the plain-`<script>` distribution
 * (`npm run build:bundle` → a single IIFE assigned directly to `window.DodoCheckout`).
 * `apps/demo` and `apps/checkout` don't use this file — they import `./index` directly
 * as an ordinary workspace package. This exists purely so a static HTML page with no
 * bundler of its own can embed the SDK with one `<script src>` tag, exactly as the
 * brief describes ("the site adds one script, calls a function").
 *
 * Assigning to `globalThis` explicitly (rather than relying on esbuild's `--global-name`
 * IIFE-return convention) keeps this correct regardless of how esbuild decides to wrap
 * `./index`'s named + re-exports internally.
 */
(globalThis as typeof globalThis & { DodoCheckout: typeof DodoCheckout }).DodoCheckout =
  DodoCheckout;
