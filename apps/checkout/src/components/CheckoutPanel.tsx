import type { ReactNode } from 'react';
import { CloseIcon, LockIcon } from './icons';

interface CheckoutPanelProps {
  onClose: () => void;
  /** Heading shown above the content — omitted for status screens, which
   * carry their own heading (e.g. "Payment declined"). */
  title?: string;
  /** Legal footer only makes sense while the shopper is still filling out
   * the form; status screens don't need it competing for attention. */
  showFooter: boolean;
  /** Status screens (processing/success/declined/failed) are short and look
   * abandoned pinned to the top of a tall panel, so they're centered instead
   * of flowing top-down like the form. */
  center: boolean;
  statusMessage: string;
  children: ReactNode;
}

export function CheckoutPanel({
  onClose,
  title,
  showFooter,
  center,
  statusMessage,
  children,
}: CheckoutPanelProps) {
  return (
    <div className="flex h-full w-full flex-col bg-white font-sans">
      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <header className="flex items-center justify-between px-5 pt-5">
        <span className="text-sm font-semibold tracking-tight text-slate-900">Dodo</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </header>

      <div
        className={`flex-1 overflow-y-auto px-5 pb-5 pt-3 ${center ? 'flex flex-col justify-center' : ''}`}
      >
        {title && <h1 className="mb-4 text-lg font-semibold text-slate-900">{title}</h1>}
        {children}
      </div>

      {showFooter && (
        <footer className="border-t border-slate-100 px-5 py-3">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <LockIcon className="h-3 w-3" />
            By continuing, you agree to Dodo&apos;s Terms and Privacy Policy.
          </p>
        </footer>
      )}
    </div>
  );
}
