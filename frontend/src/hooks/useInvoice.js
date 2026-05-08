import { useState, useMemo } from 'react';
import { calcAll } from '../utils/calculations';

const today = new Date().toISOString().split('T')[0];
const defaultDue = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

const defaultItem = () => ({ id: Date.now(), name: '', quantity: 1, unit_cost: 0 });

const initialState = {
  from: '',
  to: '',
  ship_to: '',
  logo: '',
  logoFile: null,
  number: `INV-${String(Date.now()).slice(-6)}`,
  date: today,
  payment_terms: 'Net 30',
  due_date: defaultDue,
  po_number: '',
  items: [defaultItem()],
  tax: '',
  tax_type: 'percent',
  discount: '',
  discount_type: 'percent',
  shipping: '',
  amount_paid: '',
  notes: '',
  terms: '',
  currency: 'USD',
};

export function useInvoice() {
  const [invoice, setInvoice] = useState(initialState);

  const updateField = (field, value) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (id, field, value) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, defaultItem()],
    }));
  };

  const removeItem = (id) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setInvoice((prev) => ({
        ...prev,
        logo: e.target.result,
        logoFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setInvoice((prev) => ({ ...prev, logo: '', logoFile: null }));
  };

  const calculations = useMemo(() => calcAll(invoice), [invoice]);

  const resetInvoice = () => setInvoice({ ...initialState, items: [defaultItem()] });

  const loadInvoice = (data) => {
    setInvoice({
      ...initialState,
      ...data,
      logoFile: null,
      items: (data.items || []).map((it) => ({ ...it, id: Date.now() + Math.random() })),
    });
  };

  return {
    invoice,
    calculations,
    updateField,
    updateItem,
    addItem,
    removeItem,
    handleLogoUpload,
    removeLogo,
    resetInvoice,
    loadInvoice,
  };
}
