import { FormField } from './FormField';
import { formatCardNumber, formatCvc, formatExpiry } from '../lib/formatters';
import type { CheckoutFormErrors, CheckoutFormValues } from '../lib/validation';

interface CardFieldsProps {
  values: CheckoutFormValues;
  errors: CheckoutFormErrors;
  disabled: boolean;
  onChange: (field: keyof CheckoutFormValues, value: string) => void;
}

export function CardFields({ values, errors, disabled, onChange }: CardFieldsProps) {
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="mb-1.5 block text-xs font-medium text-slate-700">Card information</legend>

      <FormField
        id="card-number"
        label="Card number"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="4242 4242 4242 4242"
        value={values.cardNumber}
        error={errors.cardNumber}
        onChange={(e) => onChange('cardNumber', formatCardNumber(e.target.value))}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="card-expiry"
          label="Expiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/YY"
          value={values.expiry}
          error={errors.expiry}
          onChange={(e) => onChange('expiry', formatExpiry(e.target.value))}
        />
        <FormField
          id="card-cvc"
          label="CVC"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="123"
          value={values.cvc}
          error={errors.cvc}
          onChange={(e) => onChange('cvc', formatCvc(e.target.value))}
        />
      </div>
    </fieldset>
  );
}
