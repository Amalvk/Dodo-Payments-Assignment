/**
 * Local, static product catalog. Stands in for a merchant-configured
 * product database. Shared by the checkout app (source of truth for what
 * it's charging for) and the demo site (so the merchant page can render
 * pricing without going through the SDK).
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'month' | 'year' | 'one-time';
}

export const products: Record<string, Product> = {
  prod_123: {
    id: 'prod_123',
    name: 'Pro Plan',
    description: 'Everything you need to ship faster.',
    price: 29,
    currency: 'USD',
    billingPeriod: 'month',
  },
  prod_456: {
    id: 'prod_456',
    name: 'Team Plan',
    description: 'Collaboration tools for growing teams.',
    price: 79,
    currency: 'USD',
    billingPeriod: 'month',
  },
};

export function getProduct(productId: string): Product | undefined {
  return products[productId];
}

export function formatPrice(product: Pick<Product, 'price' | 'currency'>): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency,
    minimumFractionDigits: 2,
  }).format(product.price);
}
