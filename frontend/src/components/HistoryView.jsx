import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Trash2, Eye, RefreshCw, FileText,
  Calendar, User, AlertCircle, DollarSign, Send, Mail, Loader2
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { fetchInvoices, deleteInvoice } from '../services/api';
import { formatCurrency, calcAll } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';
import SendEmailModal from './SendEmailModal';
import InvoicePDFDocument from './InvoicePDFDocument';

function buildWhatsAppText(invoice) {
  const sep = '━━━━━━━━━━━━━━━━━━━━';
  const fmtDate = (d) => {
    if (!d) return '';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };
  const calc = calcAll(invoice);
  const cur = invoice.currency || 'USD';
  const lines = [
    `🧾 *INVOICE #${invoice.number || 'N/A'}*`,
    sep,
    invoice.from ? `*From:* ${invoice.from.split('\n')[0]}` : '',
    invoice.to   ? `*To:*   ${invoice.to.split('\n')[0]}`   : '',
    invoice.date     ? `*Date:* ${fmtDate(invoice.date)}`     : '',
    invoice.due_date ? `*Due:*  ${fmtDate(invoice.due_date)}` : '',
    invoice.payment_terms ? `*Terms:* ${invoice.payment_terms}` : '',
    sep,
    `📦 *ITEMS*`,
    ...(invoice.items || []).filter(it => it.name).map(it => {
      const amt = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0);
      return `• ${it.name} (${it.quantity} × ${formatCurrency(parseFloat(it.unit_cost) || 0, cur)}) = *${formatCurrency(amt, cur)}*`;
    }),
    sep,
    `Subtotal: ${formatCurrency(calc.subtotal, cur)}`,
    calc.taxAmount > 0 ? `Tax: ${formatCurrency(calc.taxAmount, cur)}` : '',
    calc.discountAmount > 0 ? `Discount: -${formatCurrency(calc.discountAmount, cur)}` : '',
    invoice.shipping && parseFloat(invoice.shipping) > 0 ? `Shipping: ${formatCurrency(parseFloat(invoice.shipping), cur)}` : '',
    `*Total: ${formatCurrency(calc.total, cur)}*`,
    parseFloat(invoice.amount_paid) > 0 ? `Amount Paid: -${formatCurrency(parseFloat(invoice.amount_paid), cur)}` : '',
    sep,
    `💰 *Balance Due: ${formatCurrency(Math.max(0, calc.balanceDue), cur)}*`,
    invoice.notes ? `\n📝 ${invoice.notes}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

export default function HistoryView({ onLoadInvoice }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [sendMenuId, setSendMenuId] = useState(null);
  const [emailModalInvoice, setEmailModalInvoice] = useState(null);
  const [whatsAppLoadingId, setWhatsAppLoadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (e) {
      setError('Failed to load invoices. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this invoice?')) return;
    setDeletingId(id);
    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((inv) => inv._id !== id));
    } catch {
      alert('Failed to delete invoice.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleWhatsApp = async (inv) => {
    setWhatsAppLoadingId(inv._id);
    try {
      const calculations = calcAll(inv);
      const doc = <InvoicePDFDocument invoice={inv} calculations={calculations} />;
      const blob = await pdf(doc).toBlob();
      const file = new File([blob], `Invoice-${inv.number || 'download'}.pdf`, { type: 'application/pdf' });

      // Mobile: use native share sheet (opens WhatsApp directly with PDF)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${inv.number}`,
          text: `Invoice #${inv.number}`,
        });
      } else {
        // Desktop fallback: download PDF + open WhatsApp with text + view link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${inv.number || 'download'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const viewLink = `${window.location.origin}/invoice/${inv._id}`;
        const text = buildWhatsAppText(inv) + `\n\n🔗 View Invoice: ${viewLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        alert('Could not share. PDF has been downloaded instead.');
      }
    } finally {
      setWhatsAppLoadingId(null);
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          label="Total Invoices"
          value={invoices.length}
          color="bg-blue-50"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          label="Total Revenue"
          value={formatCurrency(totalRevenue, 'USD')}
          color="bg-emerald-50"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          label="Outstanding Balance"
          value={formatCurrency(totalBalance, 'USD')}
          color="bg-amber-50"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-800">Invoice History</h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {invoices.length}
          </span>
        </div>
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading invoices...</p>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {invoices.map((inv) => (
              <InvoiceCard
                key={inv._id}
                invoice={inv}
                onLoad={() => onLoadInvoice(inv)}
                onDelete={(e) => handleDelete(inv._id, e)}
                isDeleting={deletingId === inv._id}
                sendMenuOpen={sendMenuId === inv._id}
                onSendToggle={(e) => {
                  e.stopPropagation();
                  setSendMenuId(sendMenuId === inv._id ? null : inv._id);
                }}
                onEmail={(e) => {
                  e.stopPropagation();
                  setSendMenuId(null);
                  setEmailModalInvoice(inv);
                }}
                onWhatsApp={(e) => {
                  e.stopPropagation();
                  setSendMenuId(null);
                  handleWhatsApp(inv);
                }}
                isWhatsAppLoading={whatsAppLoadingId === inv._id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Close send dropdown on outside click */}
      {sendMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setSendMenuId(null)} />
      )}

      {/* Send Email Modal */}
      <AnimatePresence>
        {emailModalInvoice && (
          <SendEmailModal
            invoice={emailModalInvoice}
            invoiceId={emailModalInvoice._id}
            senderName={user?.name || 'InvoicePro'}
            onClose={() => setEmailModalInvoice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`${color} rounded-xl p-4 border border-slate-200`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({ invoice, onLoad, onDelete, isDeleting, sendMenuOpen, onSendToggle, onEmail, onWhatsApp, isWhatsAppLoading }) {
  const dueDate = invoice.due_date ? new Date(invoice.due_date + 'T00:00:00') : null;
  const isOverdue = dueDate && dueDate < new Date() && (invoice.balance_due || 0) > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl border border-slate-200 shadow-invoice hover:shadow-invoice-lg transition-shadow cursor-pointer"
      onClick={onLoad}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
          <FileText className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
        </div>

        {/* Invoice Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-slate-800 text-sm">#{invoice.number || 'N/A'}</span>
            {isOverdue && (
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {invoice.to && (
              <span className="flex items-center gap-1 truncate max-w-40">
                <User className="w-3 h-3 flex-shrink-0" />
                {invoice.to.split('\n')[0]}
              </span>
            )}
            {invoice.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                {new Date(invoice.date + 'T00:00:00').toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Amounts */}
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-slate-800">
            {formatCurrency(invoice.total || 0, invoice.currency || 'USD')}
          </div>
          <div className={`text-xs font-medium ${invoice.balance_due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {invoice.balance_due > 0
              ? `Due: ${formatCurrency(invoice.balance_due, invoice.currency || 'USD')}`
              : 'Paid'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {/* View */}
          <button
            onClick={onLoad}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Load invoice"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Send dropdown */}
          <div className="relative">
            <button
              onClick={onSendToggle}
              className={`p-2 rounded-lg transition-colors ${sendMenuOpen ? 'bg-emerald-100 text-emerald-700' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
              title="Send invoice"
            >
              <Send className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {sendMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20"
                >
                  <button
                    onClick={onEmail}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    Email
                  </button>
                  <button
                    onClick={onWhatsApp}
                    disabled={isWhatsAppLoading}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium border-t border-slate-100 disabled:opacity-60"
                  >
                    {isWhatsAppLoading ? (
                      <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                    ) : (
                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.553 4.124 1.522 5.854L.057 23.25a.75.75 0 00.92.92l5.396-1.465A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.698 9.698 0 01-4.933-1.35l-.353-.21-3.657.993.992-3.657-.21-.353A9.698 9.698 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                    </svg>
                    )}
                    {isWhatsAppLoading ? 'Generating...' : 'WhatsApp'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete invoice"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-1">No invoices yet</h3>
      <p className="text-sm text-slate-400">Create your first invoice and save it to see it here.</p>
    </div>
  );
}
