import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Save, CheckCircle, Loader2, AlertCircle, EyeOff, Eye
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import InvoicePDFDocument from './components/InvoicePDFDocument';
import HistoryView from './components/HistoryView';
import AuthPage from './pages/AuthPage';
import { useInvoice } from './hooks/useInvoice';
import { useAuth } from './context/AuthContext';
import { saveInvoice, updateInvoice, fetchNextInvoiceNumber } from './services/api';
import { formatCurrency } from './utils/calculations';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  // Show loading spinner while checking token
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-blue-300 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show auth page
  if (!user) return <AuthPage />;

  return <InvoiceApp user={user} logout={logout} />;
}

function InvoiceApp({ user, logout }) {
  const [activeTab, setActiveTab] = useState('builder');
  const [showPreview, setShowPreview] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loadingAction, setLoadingAction] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const previewRef = useRef(null);

  const {
    invoice, calculations,
    updateField, updateItem, addItem, removeItem,
    handleLogoUpload, removeLogo, resetInvoice, loadInvoice,
  } = useInvoice();

  // Reset saved flag whenever user modifies the invoice
  const trackedInvoice = JSON.stringify({ ...invoice, logoFile: undefined });
  React.useEffect(() => { setIsSaved(false); }, [trackedInvoice]);

  // Fetch the next sequential invoice number on first login
  React.useEffect(() => {
    fetchNextInvoiceNumber()
      .then((num) => updateField('number', num))
      .catch(() => { /* fall back to default */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMsg = (type, message, duration = 4000) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), duration);
  };

  // Build serialisable invoice for API (exclude File objects, add calculations)
  const buildPayload = () => ({
    ...invoice,
    logoFile: undefined,
    items: invoice.items.map(({ id, ...item }) => ({
      ...item,
      amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0),
    })),
    subtotal: calculations.subtotal,
    total: calculations.total,
    balance_due: calculations.balanceDue,
  });

  // Shared: save new OR update existing record
  const persistInvoice = async () => {
    const payload = buildPayload();
    if (savedId) {
      const updated = await updateInvoice(savedId, payload);
      return updated._id;
    } else {
      const saved = await saveInvoice(payload);
      return saved._id;
    }
  };

  const handleDownloadPDF = async () => {
    setLoadingAction('pdf');
    try {
      // Generate true vector PDF via @react-pdf/renderer (selectable text, embedded fonts)
      const doc = <InvoicePDFDocument invoice={invoice} calculations={calculations} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.number || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const id = await persistInvoice();
      setSavedId(id);
      setIsSaved(true);
      setMsg('success', savedId ? 'PDF downloaded & history updated!' : 'PDF downloaded & saved to history!');
    } catch (e) {
      console.error('PDF error:', e);
      setMsg('error', 'Failed to generate PDF. Please try again.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleSave = async () => {
    if (isSaved) {
      setMsg('success', 'Already saved! Edit the invoice to save changes.');
      return;
    }
    setLoadingAction('save');
    try {
      const id = await persistInvoice();
      setSavedId(id);
      setIsSaved(true);
      setMsg('success', savedId ? 'Invoice updated in history!' : 'Invoice saved to history!');
    } catch (e) {
      setMsg('error', 'Failed to save invoice. Check MongoDB connection.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleNew = async () => {
    resetInvoice();
    setSavedId(null);
    setIsSaved(false);
    try {
      const num = await fetchNextInvoiceNumber();
      updateField('number', num);
    } catch (e) { /* keep default */ }
  };

  const handleLoadFromHistory = (inv) => {
    loadInvoice(inv);
    setSavedId(inv._id || null);  // track existing record so edits UPDATE it
    setIsSaved(true);
    setActiveTab('builder');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onNew={handleNew} user={user} onLogout={logout} />

      <AnimatePresence mode="wait">
        {activeTab === 'history' ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <HistoryView onLoadInvoice={handleLoadFromHistory} />
          </motion.div>
        ) : (
          <motion.div
            key="builder"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Action Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3 gap-3 flex-wrap">
                  {/* Left: status */}
                  <div className="flex items-center gap-2 min-w-0">
                    <AnimatePresence>
                      {status.message && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                            status.type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {status.type === 'success' ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          )}
                          {status.message}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <span className="text-sm text-slate-400 font-medium hidden sm:block">
                      Balance Due:{' '}
                      <span className="font-bold text-slate-700">
                        {formatCurrency(Math.max(0, calculations.balanceDue), invoice.currency)}
                      </span>
                    </span>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Preview toggle (mobile) */}
                    <button
                      onClick={() => setShowPreview((v) => !v)}
                      className="btn-secondary lg:hidden"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPreview ? 'Hide' : 'Preview'}
                    </button>

                    {/* Save */}
                    <button
                      onClick={handleSave}
                      disabled={!!loadingAction}
                      className={`disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95 shadow-sm ${
                        isSaved
                          ? 'bg-slate-200 text-slate-500 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {loadingAction === 'save' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSaved ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaved ? 'Saved' : 'Save'}
                    </button>

                    {/* Download PDF */}
                    <button
                      onClick={handleDownloadPDF}
                      disabled={!!loadingAction}
                      className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingAction === 'pdf' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Split-Screen Layout */}
            <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
              <div className={`grid gap-8 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-3xl'}`}>
                {/* Left: Form */}
                <div className="min-w-0">
                  <InvoiceForm
                    invoice={invoice}
                    calculations={calculations}
                    updateField={updateField}
                    updateItem={updateItem}
                    addItem={addItem}
                    removeItem={removeItem}
                    handleLogoUpload={handleLogoUpload}
                    removeLogo={removeLogo}
                  />
                </div>

                {/* Right: Preview */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }}
                      className="min-w-0 hidden lg:block"
                    >
                      <div className="sticky top-36">
                        <InvoicePreview ref={previewRef} invoice={invoice} calculations={calculations} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mobile preview */}
                {showPreview && (
                  <div className="lg:hidden">
                    <InvoicePreview ref={previewRef} invoice={invoice} calculations={calculations} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


