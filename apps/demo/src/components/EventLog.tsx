export interface LogEntry {
  id: string;
  time: string;
  label: string;
  detail?: string;
  tone: 'info' | 'success' | 'error' | 'neutral';
}

const TONE_CLASSES: Record<LogEntry['tone'], string> = {
  info: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  error: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
};

export function EventLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Checkout events</h2>
        <p className="text-xs text-slate-500">Live callbacks fired by the SDK on this page.</p>
      </div>

      <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto" aria-live="polite">
        {entries.length === 0 && (
          <li className="px-5 py-6 text-center text-xs text-slate-400">
            No events yet — click &ldquo;Start Pro&rdquo; to begin.
          </li>
        )}
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 shrink-0 font-mono text-[11px] text-slate-400">
              {entry.time}
            </span>
            <div className="min-w-0">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[entry.tone]}`}
              >
                {entry.label}
              </span>
              {entry.detail && (
                <p className="mt-1 truncate font-mono text-xs text-slate-500">{entry.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
