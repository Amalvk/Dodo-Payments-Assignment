import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CheckoutErrorCode } from '@dodo/checkout-sdk';
import { postToParent } from './lib/messaging';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Last-resort net: if the checkout app crashes for any reason, tell the
 * host instead of leaving them staring at a blank iframe. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[dodo-checkout] unexpected error', error, info.componentStack);
    postToParent({
      type: 'PAYMENT_ERROR',
      code: CheckoutErrorCode.CHECKOUT_INIT_FAILED,
      message: 'Something went wrong loading checkout.',
    });
    postToParent({ type: 'CHECKOUT_CLOSE', reason: 'error' });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-white p-6 text-center text-sm text-slate-500">
          Something went wrong.
        </div>
      );
    }
    return this.props.children;
  }
}
