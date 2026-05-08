import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import LineItems from './LineItems';
import SummarySection from './SummarySection';
import { CURRENCIES } from '../utils/calculations';

export default function InvoiceForm({ invoice, calculations, updateField, updateItem, addItem, removeItem, handleLogoUpload, removeLogo }) {
  const logoInputRef = useRef();

  return (
    <div className="space-y-4 pb-8">
      {/* ── Header Row: Logo + Invoice # ── */}
      <div className="section-card p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {invoice.logo ? (
              <div className="relative group">
                <img
                  src={invoice.logo}
                  alt="Invoice logo"
                  className="w-24 h-24 object-contain rounded-lg border border-slate-200 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-500 text-center leading-tight px-1">
                  + Add Logo
                </span>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            />
          </div>

          {/* Invoice # and Currency */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-700">INVOICE</h2>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm font-medium">#</span>
                <input
                  type="text"
                  className="form-input w-40 text-right font-semibold"
                  placeholder="Invoice Number"
                  value={invoice.number}
                  onChange={(e) => updateField('number', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select
                className="form-input w-56"
                value={invoice.currency}
                onChange={(e) => updateField('currency', e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Parties: From / Bill To / Ship To ── */}
      <div className="section-card p-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">From</label>
            <textarea
              className="form-textarea h-28"
              placeholder="Who is this from?&#10;Your company name&#10;Address&#10;City, State, ZIP"
              value={invoice.from}
              onChange={(e) => updateField('from', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Bill To</label>
            <textarea
              className="form-textarea h-28"
              placeholder="Who is this to?&#10;Client name&#10;Address&#10;City, State, ZIP"
              value={invoice.to}
              onChange={(e) => updateField('to', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Ship To <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
            <textarea
              className="form-textarea h-28"
              placeholder="Ship to (if different)&#10;Address&#10;City, State, ZIP"
              value={invoice.ship_to}
              onChange={(e) => updateField('ship_to', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Reference Fields ── */}
      <div className="section-card p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={invoice.date}
              onChange={(e) => updateField('date', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Payment Terms</label>
            <select
              className="form-input"
              value={invoice.payment_terms}
              onChange={(e) => updateField('payment_terms', e.target.value)}
            >
              {['', 'Net 7', 'Net 10', 'Net 15', 'Net 30', 'Net 60', 'Net 90', 'Due on Receipt', 'Due on Delivery'].map((t) => (
                <option key={t} value={t}>{t || 'Select terms...'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-input"
              value={invoice.due_date}
              onChange={(e) => updateField('due_date', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">PO Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="PO-XXXX"
              value={invoice.po_number}
              onChange={(e) => updateField('po_number', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Line Items ── */}
      <LineItems
        items={invoice.items}
        currency={invoice.currency}
        updateItem={updateItem}
        addItem={addItem}
        removeItem={removeItem}
      />

      {/* ── Summary ── */}
      <div className="flex justify-end">
        <div className="w-full max-w-md">
          <SummarySection
            invoice={invoice}
            calculations={calculations}
            updateField={updateField}
            currency={invoice.currency}
          />
        </div>
      </div>

      {/* ── Notes & Terms ── */}
      <div className="section-card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea h-24"
              placeholder="Notes - any relevant information not already covered"
              value={invoice.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Terms</label>
            <textarea
              className="form-textarea h-24"
              placeholder="Terms and conditions - late fees, payment methods, delivery schedule"
              value={invoice.terms}
              onChange={(e) => updateField('terms', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
