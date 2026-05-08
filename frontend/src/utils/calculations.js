export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcSubtotal(items) {
  return round2(
    items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0), 0)
  );
}

export function calcTax(subtotal, tax, taxType) {
  if (!tax || parseFloat(tax) === 0) return 0;
  const t = parseFloat(tax) || 0;
  return round2(taxType === 'percent' ? subtotal * (t / 100) : t);
}

export function calcDiscount(subtotal, discount, discountType) {
  if (!discount || parseFloat(discount) === 0) return 0;
  const d = parseFloat(discount) || 0;
  return round2(discountType === 'percent' ? subtotal * (d / 100) : d);
}

export function calcTotal(subtotal, taxAmount, discountAmount, shipping) {
  return round2(subtotal + taxAmount - discountAmount + (parseFloat(shipping) || 0));
}

export function calcBalanceDue(total, amountPaid) {
  return round2(total - (parseFloat(amountPaid) || 0));
}

export function calcAll(invoice) {
  const subtotal = calcSubtotal(invoice.items || []);
  const taxAmount = calcTax(subtotal, invoice.tax, invoice.tax_type);
  const discountAmount = calcDiscount(subtotal, invoice.discount, invoice.discount_type);
  const total = calcTotal(subtotal, taxAmount, discountAmount, invoice.shipping);
  const balanceDue = calcBalanceDue(total, invoice.amount_paid);
  return { subtotal, taxAmount, discountAmount, total, balanceDue };
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
  { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD — Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY — Japanese Yen' },
  { code: 'CNY', symbol: '¥', label: 'CNY — Chinese Yuan' },
];

export function getCurrencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || '$';
}

// Locale-aware formatter — INR uses Indian numbering (1,00,000), others Western (100,000)
export function formatCurrency(amount, currencyCode = 'USD') {
  const num = parseFloat(amount);
  const safe = Number.isFinite(num) ? num : 0;
  const symbol = getCurrencySymbol(currencyCode);

  const locale   = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  const decimals = currencyCode === 'JPY' ? 0 : 2;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);

  return `${symbol}${formatted}`;
}

// Plain number formatter (no currency symbol) — for input field display, etc.
export function formatNumber(amount, currencyCode = 'USD') {
  const num = parseFloat(amount);
  const safe = Number.isFinite(num) ? num : 0;
  const locale   = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  const decimals = currencyCode === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
}
