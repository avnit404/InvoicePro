const mongoose = require('mongoose');


const LineItemSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unit_cost: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
});

const InvoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
    ship_to: { type: String, default: '' },
    logo: { type: String, default: '' },
    number: { type: String, default: '' },
    date: { type: String, default: '' },
    payment_terms: { type: String, default: '' },
    due_date: { type: String, default: '' },
    po_number: { type: String, default: '' },
    items: [LineItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    tax_type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    discount: { type: Number, default: 0 },
    discount_type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    shipping: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amount_paid: { type: Number, default: 0 },
    balance_due: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    terms: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
