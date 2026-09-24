import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckoutErrorCode, createSessionId, type CloseReason } from '@dodo/checkout-sdk';
import { getProduct, type Product } from '@dodo/products';
import { processPayment } from '../lib/fakePaymentService';
import { getProductId, postToParent } from '../lib/messaging';
import { validate, type CheckoutFormErrors, type CheckoutFormValues } from '../lib/validation';

export type InitState =
  | { status: 'loading' }
  | { status: 'ready'; product: Product }
  | { status: 'product-not-found' };

export type PaymentState =
  | { status: 'idle' }
  | { status: 'processing' }
  | { status: 'success'; sessionId: string }
  | { status: 'declined'; message: string }
  | { status: 'failed'; message: string };

const EMPTY_VALUES: CheckoutFormValues = { email: '', cardNumber: '', expiry: '', cvc: '' };
const SUCCESS_CLOSE_DELAY_MS = 1600;

export function useCheckoutSession() {
  const [initState, setInitState] = useState<InitState>({ status: 'loading' });
  const [values, setValues] = useState<CheckoutFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [payment, setPayment] = useState<PaymentState>({ status: 'idle' });
  const submittedValuesRef = useRef<CheckoutFormValues>(EMPTY_VALUES);

  // Resolve the product. A short delay stands in for a real network fetch
  // and lets the loading skeleton actually be visible instead of a flash.
  useEffect(() => {
    let cancelled = false;
    const productId = getProductId();

    const timer = setTimeout(() => {
      if (cancelled) return;
      const product = productId ? getProduct(productId) : undefined;
      if (!product) {
        setInitState({ status: 'product-not-found' });
        postToParent({
          type: 'PAYMENT_ERROR',
          code: CheckoutErrorCode.PRODUCT_NOT_FOUND,
          message: 'The requested product could not be found.',
        });
        return;
      }
      setInitState({ status: 'ready', product });
      postToParent({ type: 'CHECKOUT_READY' });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const setField = useCallback((field: keyof CheckoutFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const runPayment = useCallback(async (submission: CheckoutFormValues) => {
    setPayment({ status: 'processing' });
    submittedValuesRef.current = submission;

    const outcome = await processPayment({
      cardNumber: submission.cardNumber,
      email: submission.email,
    });

    switch (outcome) {
      case 'success': {
        const sessionId = createSessionId();
        setPayment({ status: 'success', sessionId });
        postToParent({ type: 'PAYMENT_SUCCESS', sessionId });
        break;
      }
      case 'declined': {
        const message = 'Your card was declined. Check your details or try another card.';
        setPayment({ status: 'declined', message });
        postToParent({ type: 'PAYMENT_ERROR', code: CheckoutErrorCode.PAYMENT_DECLINED, message });
        // A declined card is assumed bad — clear it so the shopper enters a
        // different one rather than retrying the same failing card.
        setValues((prev) => ({ ...prev, cardNumber: '', expiry: '', cvc: '' }));
        break;
      }
      case 'network-failure': {
        const message = "We couldn't confirm your payment. Your card has not been charged.";
        setPayment({ status: 'failed', message });
        postToParent({ type: 'PAYMENT_ERROR', code: CheckoutErrorCode.PAYMENT_FAILED, message });
        // Unlike a decline, this is our side failing to confirm — the same
        // card is expected to work, so we keep the entered values intact.
        break;
      }
    }
  }, []);

  const submit = useCallback(() => {
    if (payment.status === 'processing') return; // guards against double submission
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    void runPayment(values);
  }, [payment.status, values, runPayment]);

  const retry = useCallback(() => {
    if (payment.status === 'failed') {
      void runPayment(submittedValuesRef.current);
    } else if (payment.status === 'declined') {
      setPayment({ status: 'idle' });
    }
  }, [payment.status, runPayment]);

  const requestClose = useCallback((reason: CloseReason) => {
    postToParent({ type: 'CHECKOUT_CLOSE', reason });
  }, []);

  // Auto-close a short beat after success, once the confirmation has had
  // time to register — see README "Decisions" for why we don't wait for an
  // explicit click here.
  useEffect(() => {
    if (payment.status !== 'success') return;
    const timer = setTimeout(() => requestClose('success'), SUCCESS_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [payment.status, requestClose]);

  return { initState, values, errors, payment, setField, submit, retry, requestClose };
}
