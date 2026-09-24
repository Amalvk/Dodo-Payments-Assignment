import { useEffect, useRef } from 'react';
import { CardFields } from './components/CardFields';
import { CheckoutPanel } from './components/CheckoutPanel';
import { FormField } from './components/FormField';
import { PayButton } from './components/PayButton';
import {
  DeclinedView,
  FailedView,
  LoadingSkeleton,
  ProcessingView,
  ProductUnavailableView,
  SuccessView,
} from './components/StatusScreens';
import { ProductSummary } from './components/ProductSummary';
import { LockIcon } from './components/icons';
import { useCheckoutSession } from './hooks/useCheckoutSession';
import { formatPrice } from '@dodo/products';

const STATUS_MESSAGES: Record<string, string> = {
  processing: 'Processing your payment.',
  success: 'Payment successful.',
  declined: 'Your payment was declined.',
  failed: "We couldn't confirm your payment.",
};

export default function App() {
  const { initState, values, errors, payment, setField, submit, retry, requestClose } =
    useCheckoutSession();
  const emailRef = useRef<HTMLInputElement>(null);

  // Escape closes checkout. Focus is inside this iframe once it loads (the
  // SDK moves it here on `load`, and we autofocus the first field below),
  // so the host page's own Escape listener won't fire for these key
  // presses — this is the one that actually matters.
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose('user');
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [requestClose]);

  const showForm = initState.status === 'ready' && payment.status === 'idle';

  useEffect(() => {
    if (showForm) emailRef.current?.focus();
  }, [showForm]);

  const statusMessage =
    initState.status === 'product-not-found'
      ? 'This product is unavailable.'
      : STATUS_MESSAGES[payment.status] ?? '';

  const isFormStep = initState.status === 'loading' || showForm;

  return (
    <CheckoutPanel
      onClose={() => requestClose('user')}
      title={isFormStep ? 'Complete your purchase' : undefined}
      showFooter={isFormStep}
      center={!isFormStep}
      statusMessage={statusMessage}
    >
      {initState.status === 'loading' && <LoadingSkeleton />}

      {initState.status === 'product-not-found' && (
        <ProductUnavailableView onClose={() => requestClose('error')} />
      )}

      {initState.status === 'ready' && (
        <>
          {payment.status === 'processing' && <ProcessingView />}

          {payment.status === 'success' && <SuccessView sessionId={payment.sessionId} />}

          {payment.status === 'declined' && (
            <DeclinedView
              title="Payment declined"
              message={payment.message}
              actionLabel="Try again"
              onRetry={retry}
            />
          )}

          {payment.status === 'failed' && (
            <FailedView
              title="Something went wrong"
              message={payment.message}
              actionLabel="Retry payment"
              onRetry={retry}
            />
          )}

          {payment.status === 'idle' && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              noValidate
            >
              <ProductSummary product={initState.product} />

              <FormField
                ref={emailRef}
                id="email"
                type="email"
                label="Email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                error={errors.email}
                onChange={(e) => setField('email', e.target.value)}
              />

              <CardFields values={values} errors={errors} disabled={false} onChange={setField} />

              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500">
                <LockIcon className="h-3.5 w-3.5 text-slate-400" />
                Secure payment
              </div>

              <PayButton
                label={`Pay ${formatPrice(initState.product)}`}
                processing={false}
                onClick={submit}
              />
            </form>
          )}
        </>
      )}
    </CheckoutPanel>
  );
}
