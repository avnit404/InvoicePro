import React, { useEffect, useState } from 'react';
import { FileText, Calendar, User, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { formatCurrency, calcAll } from '../utils/calculations';

export default function InvoiceViewPage({ invoiceId }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || ''}/api/invoices/view/${invoiceId}`)
      .then(r => setInvoice(r.data))
      .catch(() => setError('Invoice not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Invoice Not Found</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const calc = calcAll(invoice);
  const cur = invoice.currency || 'USD';
  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 leading-none">InvoicePro</h1>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Invoice Viewer</p>
        </div>
      </div>

      {/* Invoice content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Invoice header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Invoice</p>
              <h2 className="text-white text-2xl font-bold mt-0.5">#{invoice.number || 'N/A'}</h2>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs font-medium">Balance Due</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(Math.max(0, calc.balanceDue), cur)}</p>
            </div>
          </div>

          <div className="p-8">
            {/* From / To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">From</p>
                {(invoice.from || '').split('\n').map((l, i) => (
                  <p key={i} className={`text-slate-700 ${i === 0 ? 'font-bold' : 'text-sm'}`}>{l}</p>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Bill To</p>
                {(invoice.to || '').split('\n').map((l, i) => (
                  <p key={i} className={`text-slate-700 ${i === 0 ? 'font-bold' : 'text-sm'}`}>{l}</p>
                ))}
              </div>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              {invoice.date && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Date</p>
                  <p className="text-sm font-semibold text-slate-700">{fmtDate(invoice.date)}</p>
                </div>
              )}
              {invoice.due_date && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-slate-700">{fmtDate(invoice.due_date)}</p>
                </div>
              )}
              {invoice.payment_terms && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Payment Terms</p>
                  <p className="text-sm font-semibold text-slate-700">{invoice.payment_terms}</p>
                </div>
              )}
              {invoice.po_number && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">PO Number</p>
                  <p className="text-sm font-semibold text-slate-700">{invoice.po_number}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="mb-8">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-bold text-white uppercase tracking-wide">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {(invoice.items || []).map((item, i) => {
                  const amt = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                      <div className="col-span-5 font-medium text-slate-800">{item.name || `Item ${i + 1}`}</div>
                      <div className="col-span-2 text-center text-slate-600">{item.quantity}</div>
                      <div className="col-span-2 text-center text-slate-600">{formatCurrency(parseFloat(item.unit_cost) || 0, cur)}</div>
                      <div className="col-span-3 text-right font-semibold text-slate-800">{formatCurrency(amt, cur)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(calc.subtotal, cur)}</span>
                </div>
                {calc.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(calc.discountAmount, cur)}</span>
                  </div>
                )}
                {calc.taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax</span>
                    <span className="font-medium">{formatCurrency(calc.taxAmount, cur)}</span>
                  </div>
                )}
                {invoice.shipping && parseFloat(invoice.shipping) > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Shipping</span>
                    <span className="font-medium">{formatCurrency(parseFloat(invoice.shipping), cur)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-700 font-semibold border-t border-slate-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(calc.total, cur)}</span>
                </div>
                {invoice.amount_paid && parseFloat(invoice.amount_paid) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Amount Paid</span>
                    <span>-{formatCurrency(parseFloat(invoice.amount_paid), cur)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-slate-100 rounded-xl px-4 py-3 font-bold text-slate-800">
                  <span>Balance Due</span>
                  <span className="text-lg">{formatCurrency(Math.max(0, calc.balanceDue), cur)}</span>
                </div>
              </div>
            </div>

            {/* Notes / Terms */}
            {invoice.notes && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Notes</p>
                <p className="text-sm text-slate-700">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Terms</p>
                <p className="text-sm text-slate-700">{invoice.terms}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Powered by InvoicePro</p>
      </div>
    </div>
  );
}
