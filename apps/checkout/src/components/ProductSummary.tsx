import { formatPrice, type Product } from '@dodo/products';

const PERIOD_LABEL: Record<Product['billingPeriod'], string> = {
  month: 'Monthly subscription',
  year: 'Annual subscription',
  'one-time': 'One-time purchase',
};

export function ProductSummary({ product }: { product: Product }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{product.name}</p>
        <p className="text-xs text-slate-500">{PERIOD_LABEL[product.billingPeriod]}</p>
      </div>
      <p className="text-sm font-semibold text-slate-900">{formatPrice(product)}</p>
    </div>
  );
}
