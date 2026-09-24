import { AlertIcon, CheckCircleIcon, SpinnerIcon, WifiOffIcon } from './icons';

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-14 rounded-xl bg-slate-100" />
      <div className="h-9 rounded-lg bg-slate-100" />
      <div className="h-9 rounded-lg bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-9 rounded-lg bg-slate-100" />
        <div className="h-9 rounded-lg bg-slate-100" />
      </div>
      <div className="h-11 rounded-lg bg-slate-100" />
    </div>
  );
}

export function ProcessingView() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <SpinnerIcon className="h-8 w-8 text-brand-500" />
      <div>
        <p className="text-sm font-semibold text-slate-900">Processing payment…</p>
        <p className="mt-1 text-xs text-slate-500">Please don&apos;t close this window.</p>
      </div>
    </div>
  );
}

export function SuccessView({ sessionId }: { sessionId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <CheckCircleIcon className="h-12 w-12 text-emerald-500" />
      <div>
        <p className="text-base font-semibold text-slate-900">Payment successful</p>
        <p className="mt-1 text-xs text-slate-500">You&apos;re all set.</p>
        <p className="mt-3 font-mono text-xs text-slate-400">Order #{sessionId}</p>
      </div>
    </div>
  );
}

interface RetryViewProps {
  title: string;
  message: string;
  actionLabel: string;
  onRetry: () => void;
}

export function DeclinedView({ title, message, actionLabel, onRetry }: RetryViewProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <AlertIcon className="h-10 w-10 text-red-500" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-[30ch] text-xs text-slate-500">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function FailedView({ title, message, actionLabel, onRetry }: RetryViewProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <WifiOffIcon className="h-10 w-10 text-amber-500" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-[30ch] text-xs text-slate-500">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function ProductUnavailableView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertIcon className="h-10 w-10 text-slate-400" />
      <div>
        <p className="text-sm font-semibold text-slate-900">Product unavailable</p>
        <p className="mt-1 text-xs text-slate-500">We couldn&apos;t load this product.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Close
      </button>
    </div>
  );
}
