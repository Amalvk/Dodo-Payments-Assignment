export type PaymentOutcome = 'success' | 'declined' | 'network-failure';

export interface PaymentInput {
  cardNumber: string;
  email: string;
}

const SUCCESS_CARD = '4242424242424242';
const DECLINED_CARD = '4000000000000002';
const FAIL_ONCE_CARD = '4000000000000341';

// Tracks how many times the "fail once, then succeed" test card has been
// attempted during this checkout session (module state, so it survives a
// retry without needing a page reload — reset only when the checkout iframe
// itself remounts).
const attemptsByCard = new Map<string, number>();

function randomDelay(): Promise<void> {
  const ms = 500 + Math.random() * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Stands in for a real payment processor. Never receives anything beyond
 * this iframe boundary, and never logs the inputs it's given. */
export async function processPayment(input: PaymentInput): Promise<PaymentOutcome> {
  await randomDelay();

  const digits = input.cardNumber.replace(/\s+/g, '');

  if (digits === DECLINED_CARD) return 'declined';

  if (digits === FAIL_ONCE_CARD) {
    const attempts = (attemptsByCard.get(digits) ?? 0) + 1;
    attemptsByCard.set(digits, attempts);
    return attempts === 1 ? 'network-failure' : 'success';
  }

  if (digits === SUCCESS_CARD) return 'success';

  // Any other well-formed card: default to success so reviewers exploring
  // the form aren't blocked by an undocumented card number.
  return 'success';
}
