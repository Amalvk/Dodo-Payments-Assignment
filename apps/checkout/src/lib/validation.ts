export interface CheckoutFormValues {
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(values: CheckoutFormValues): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  const cardDigits = values.cardNumber.replace(/\s/g, '');
  if (!cardDigits) {
    errors.cardNumber = 'Card number is required.';
  } else if (cardDigits.length < 13 || cardDigits.length > 19 || !/^\d+$/.test(cardDigits)) {
    errors.cardNumber = 'Enter a valid card number.';
  }

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(values.expiry.trim());
  if (!values.expiry.trim()) {
    errors.expiry = 'Required.';
  } else if (!expiryMatch) {
    errors.expiry = 'Use MM/YY.';
  } else {
    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (month < 1 || month > 12) {
      errors.expiry = 'Invalid month.';
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiry = 'Card has expired.';
    }
  }

  if (!values.cvc.trim()) {
    errors.cvc = 'Required.';
  } else if (!/^\d{3,4}$/.test(values.cvc.trim())) {
    errors.cvc = 'Invalid CVC.';
  }

  return errors;
}
