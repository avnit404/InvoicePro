import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import InvoicePDFDocument from './InvoicePDFDocument';
import { calcAll, formatCurrency } from '../utils/calculations';
import { sendInvoiceEmail } from '../services/api';

export default function SendEmailModal({ invoice, invoiceId, senderName, onClose }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState(invoice.to?.split('\n')[0] || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const calculations = calcAll(invoice);

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      setStatus({ type: 'error', message: 'Recipient email is required.' });
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const doc = <InvoicePDFDocument invoice={invoice} calculations={calculations} />;
      const blob = await pdf(doc).toBlob();

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await sendInvoiceEmail({
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        message: message.trim(),
        pdfBase64: base64,
        invoiceNumber: invoice.number || 'N/A',
        senderName,
        total: formatCurrency(invoice.total || 0, invoice.currency || 'USD'),
        invoiceId: invoiceId || invoice._id || null,
      });

      setStatus({ type: 'success', message: 'Email sent successfully!' });
      setTimeout(onClose, 2000);
    } catch (e) {
      setStatus({ type: 'error', message: e?.response?.data?.error || 'Failed to send email. Check email settings in .env' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — fixed */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Send className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">Send by Email</h2>
            <p className="text-xs text-slate-400">Invoice #{invoice.number || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

        {/* Invoice summary card */}
        <div className="mx-6 mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Customer</p>
            <p className="font-semibold text-slate-700">{invoice.to?.split('\n')[0] || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="font-semibold text-slate-700">
              {invoice.date ? new Date(invoice.date + 'T00:00:00').toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total</p>
            <p className="font-semibold text-slate-700">{formatCurrency(invoice.total || 0, invoice.currency || 'USD')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Balance Due</p>
            <p className={`font-semibold ${(invoice.balance_due || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {(invoice.balance_due || 0) > 0 ? formatCurrency(invoice.balance_due, invoice.currency || 'USD') : 'Paid'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recipient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1">The email address where the document will be sent.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Name</label>
            <input
              type="text"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Client Name"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a personal message (optional)"
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">Add a personal message to include in the email (optional).</p>
          </div>

          {/* What's included */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm font-semibold text-slate-700 mb-2">📎 The email will include:</p>
            <ul className="space-y-1.5">
              {['Invoice as a PDF attachment', 'Complete invoice details', 'Your name as the sender'].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          {status.message && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.type === 'success'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {status.message}
            </div>
          )}
        </div>

        </div>{/* end scrollable body */}

        {/* Footer buttons — fixed */}
        <div className="px-6 pb-6 pt-4 flex gap-3 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Sending...' : 'Send Email'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
