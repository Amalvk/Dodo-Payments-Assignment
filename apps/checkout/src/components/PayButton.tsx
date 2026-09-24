import { SpinnerIcon } from './icons';

interface PayButtonProps {
  label: string;
  processing: boolean;
  onClick: () => void;
}

export function PayButton({ label, processing, onClick }: PayButtonProps) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={processing}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {processing && <SpinnerIcon className="h-4 w-4" />}
      {processing ? 'Processing…' : label}
    </button>
  );
}
