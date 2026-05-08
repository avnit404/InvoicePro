import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

export async function generatePDF(invoiceData, logoFile) {
  const form = new FormData();
  form.append('invoiceData', JSON.stringify(invoiceData));
  if (logoFile) {
    form.append('logo', logoFile);
  }
  const res = await axios.post(`${BASE}/generate-invoice`, form, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 45000,
  });
  return res.data;
}

export async function saveInvoice(invoiceData) {
  const res = await axios.post(`${BASE}/invoices`, invoiceData);
  return res.data;
}

export async function fetchNextInvoiceNumber() {
  const res = await axios.get(`${BASE}/invoices/next-number`);
  return res.data.number;
}

export async function fetchInvoices() {
  const res = await axios.get(`${BASE}/invoices`);
  return res.data;
}

export async function fetchInvoiceById(id) {
  const res = await axios.get(`${BASE}/invoices/${id}`);
  return res.data;
}

export async function updateInvoice(id, invoiceData) {
  const res = await axios.put(`${BASE}/invoices/${id}`, invoiceData);
  return res.data;
}

export async function deleteInvoice(id) {
  const res = await axios.delete(`${BASE}/invoices/${id}`);
  return res.data;
}

export async function sendInvoiceEmail({ recipientEmail, recipientName, message, pdfBase64, invoiceNumber, senderName, total, invoiceId }) {
  const res = await axios.post(`${BASE}/send-email`, {
    recipientEmail, recipientName, message, pdfBase64, invoiceNumber, senderName, total, invoiceId,
  });
  return res.data;
}
