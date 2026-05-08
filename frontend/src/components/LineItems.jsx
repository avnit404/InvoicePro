import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../utils/calculations';

export default function LineItems({ items, currency, updateItem, addItem, removeItem }) {
  return (
    <div className="section-card">
      <div className="bg-slate-800 text-white px-4 py-3">
        <div className="grid grid-cols-12 gap-2 text-sm font-semibold">
          <div className="col-span-6">Item</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <LineItemRow
              key={item.id}
              item={item}
              index={index}
              currency={currency}
              updateItem={updateItem}
              removeItem={removeItem}
              canRemove={items.length > 1}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="px-4 py-3 border-t border-slate-100">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-300 hover:border-emerald-500 rounded-md px-3 py-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Line Item
        </button>
      </div>
    </div>
  );
}

function LineItemRow({ item, currency, updateItem, removeItem, canRemove }) {
  const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
  const symbol = getCurrencySymbol(currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-3 hover:bg-slate-50 group"
    >
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Single description field */}
        <div className="col-span-6">
          <input
            type="text"
            className="form-input"
            placeholder="Description of item/service..."
            value={item.name}
            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
          />
        </div>

        {/* Quantity */}
        <div className="col-span-2">
          <input
            type="number"
            className="form-input text-right"
            min="0"
            value={item.quantity}
            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
          />
        </div>

        {/* Rate with currency-symbol prefix */}
        <div className="col-span-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
            {symbol}
          </span>
          <input
            type="number"
            className="form-input text-right pl-8"
            min="0"
            step="0.01"
            value={item.unit_cost}
            onChange={(e) => updateItem(item.id, 'unit_cost', e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="col-span-2 flex items-center justify-end gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {formatCurrency(amount, currency)}
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
