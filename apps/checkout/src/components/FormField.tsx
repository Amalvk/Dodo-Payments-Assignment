import { forwardRef, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, className = '', ...inputProps }, ref) => {
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-700">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${
            error ? 'border-red-400' : 'border-slate-200'
          } ${className}`}
          {...inputProps}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
