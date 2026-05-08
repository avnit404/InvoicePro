import React from 'react';
import { formatCurrency } from '../utils/calculations';

export default function SummarySection({ invoice, calculations, updateField, currency }) {
  const { subtotal, taxAmount, discountAmount, total, balanceDue } = calculations;

  return (
    <div className="section-card">
      <div className="p-4 space-y-3">
        {/* Subtotal */}
        <SummaryRow label="Subtotal" value={formatCurrency(subtotal, currency)} bold={false} />

        {/* Tax */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 w-28">Tax</span>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              className="form-input w-24 text-right"
              placeholder="0"
              min="0"
              step="0.01"
              value={invoice.tax}
              onChange={(e) => updateField('tax', e.target.value)}
            />
            <TypeToggle
              value={invoice.tax_type}
              onChange={(v) => updateField('tax_type', v)}
            />
          </div>
          <span className="text-sm font-medium text-slate-700 w-24 text-right">
            {taxAmount > 0 ? formatCurrency(taxAmount, currency) : '—'}
          </span>
        </div>

        {/* Discount */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 w-28">Discount</span>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              className="form-input w-24 text-right"
              placeholder="0"
              min="0"
              step="0.01"
              value={invoice.discount}
              onChange={(e) => updateField('discount', e.target.value)}
            />
            <TypeToggle
              value={invoice.discount_type}
              onChange={(v) => updateField('discount_type', v)}
            />
          </div>
          <span className="text-sm font-medium text-slate-700 w-24 text-right">
            {discountAmount > 0 ? `- ${formatCurrency(discountAmount, currency)}` : '—'}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 w-28">Shipping</span>
          <div className="flex-1">
            <input
              type="number"
              className="form-input w-24 text-right"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={invoice.shipping}
              onChange={(e) => updateField('shipping', e.target.value)}
            />
          </div>
          <span className="text-sm font-medium text-slate-700 w-24 text-right">
            {invoice.shipping && parseFloat(invoice.shipping) > 0
              ? formatCurrency(parseFloat(invoice.shipping), currency)
              : '—'}
          </span>
        </div>

        {/* Total */}
        <div className="pt-2 border-t border-slate-200">
          <SummaryRow
            label="Total"
            value={formatCurrency(total, currency)}
            bold
            large
          />
        </div>

        {/* Amount Paid */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 w-28">Amount Paid</span>
          <div className="flex-1">
            <input
              type="number"
              className="form-input w-32 text-right"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={invoice.amount_paid}
              onChange={(e) => updateField('amount_paid', e.target.value)}
            />
          </div>
          <span className="text-sm font-medium text-emerald-600 w-24 text-right">
            {invoice.amount_paid && parseFloat(invoice.amount_paid) > 0
              ? `- ${formatCurrency(parseFloat(invoice.amount_paid), currency)}`
              : '—'}
          </span>
        </div>

        {/* Balance Due */}
        <div className="pt-2 border-t-2 border-slate-800">
          <div className="flex items-center justify-between bg-slate-800 -mx-4 -mb-4 px-4 py-4 rounded-b-xl">
            <span className="text-sm font-bold text-white uppercase tracking-wide">Balance Due</span>
            <span className="text-xl font-bold text-white">
              {formatCurrency(Math.max(0, balanceDue), currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold, large }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-bold text-slate-800' : 'text-slate-600'} ${large ? 'text-base' : ''}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-bold text-slate-800' : 'font-medium text-slate-700'} ${large ? 'text-base' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function TypeToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
      <button
        type="button"
        onClick={() => onChange('percent')}
        className={`px-2.5 py-1.5 transition-colors ${
          value === 'percent'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-500 hover:bg-slate-50'
        }`}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onChange('flat')}
        className={`px-2.5 py-1.5 transition-colors ${
          value === 'flat'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-500 hover:bg-slate-50'
        }`}
      >
        $
      </button>
    </div>
  );
}
