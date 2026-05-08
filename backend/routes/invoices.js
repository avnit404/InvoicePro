const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const nodemailer = require('nodemailer');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

function buildEmailHTML(invoiceNumber, senderName, recipientName, message, total, viewUrl) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#1a56db;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">InvoicePro</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="text-align:center;color:#1a1a1a;margin-bottom:8px;">Invoice #${invoiceNumber}</h2>
      <p style="text-align:center;color:#555;margin:0 0 8px;">${senderName} has sent you an invoice.</p>
      <p style="text-align:center;color:#555;margin:0 0 16px;">Please find the invoice attached to this email as a PDF document.</p>
      ${total ? `<p style="text-align:center;font-size:18px;font-weight:bold;color:#1a1a1a;margin:16px 0;"><strong>Total Amount: ${total}</strong></p>` : ''}
      ${message ? `<div style="background:#f9f9f9;padding:16px;border-left:4px solid #1a56db;margin:20px 0;color:#555;border-radius:4px;"><p style="margin:0;">${message}</p></div>` : ''}
      ${viewUrl ? `<div style="text-align:center;margin:24px 0 8px;"><a href="${viewUrl}" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:bold;">View Invoice</a></div>` : ''}
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0;">This email was sent via InvoicePro on behalf of ${senderName}.</p>
    </div>
  </div>
</body>
</html>`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Generate PDF via invoice-generator.com proxy
router.post('/generate-invoice', upload.single('logo'), async (req, res) => {
  try {
    const invoiceData = JSON.parse(req.body.invoiceData || '{}');
    const form = new FormData();

    const appendIfDefined = (key, value) => {
      if (value !== undefined && value !== null && value !== '') {
        form.append(key, String(value));
      }
    };

    appendIfDefined('from', invoiceData.from);
    appendIfDefined('to', invoiceData.to);
    appendIfDefined('ship_to', invoiceData.ship_to);
    appendIfDefined('number', invoiceData.number);
    appendIfDefined('date', invoiceData.date);
    appendIfDefined('payment_terms', invoiceData.payment_terms);
    appendIfDefined('due_date', invoiceData.due_date);
    appendIfDefined('po_number', invoiceData.po_number);
    appendIfDefined('notes', invoiceData.notes);
    appendIfDefined('terms', invoiceData.terms);
    appendIfDefined('currency', invoiceData.currency || 'USD');

    if (invoiceData.tax) {
      const taxVal =
        invoiceData.tax_type === 'flat'
          ? invoiceData.tax
          : `${invoiceData.tax}%`;
      appendIfDefined('tax', taxVal);
    }

    if (invoiceData.discount) {
      const discountVal =
        invoiceData.discount_type === 'flat'
          ? invoiceData.discount
          : `${invoiceData.discount}%`;
      appendIfDefined('discount', discountVal);
    }

    appendIfDefined('shipping', invoiceData.shipping);
    appendIfDefined('amount_paid', invoiceData.amount_paid);

    if (req.file) {
      form.append('logo', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
    } else if (invoiceData.logo && invoiceData.logo.startsWith('http')) {
      appendIfDefined('logo', invoiceData.logo);
    }

    const items = invoiceData.items || [];
    items.forEach((item, i) => {
      form.append(`items[${i}][name]`, item.name || '');
      form.append(`items[${i}][quantity]`, item.quantity || 1);
      form.append(`items[${i}][unit_cost]`, item.unit_cost || 0);
    });

    const response = await axios.post('https://invoice-generator.com', form, {
      headers: { ...form.getHeaders(), Accept: 'application/pdf' },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceData.number || Date.now()}.pdf"`,
      'Content-Length': response.data.byteLength,
    });
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('PDF generation error:', error?.response?.data?.toString() || error.message);
    res.status(500).json({ error: 'Failed to generate PDF. Check invoice-generator.com connectivity.' });
  }
});

// Public invoice view (no auth — used for email "View Invoice" links)
router.get('/invoices/view/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get next sequential invoice number for this user (must be BEFORE /:id route)
router.get('/invoices/next-number', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }, 'number').lean();
    // Extract trailing number from each invoice (e.g. "INV-007" → 7)
    const numbers = invoices
      .map((inv) => {
        const matches = (inv.number || '').match(/(\d+)/g);
        return matches ? parseInt(matches[matches.length - 1], 10) : 0;
      })
      .filter((n) => n > 0);

    const nextNum = numbers.length ? Math.max(...numbers) + 1 : 1;
    const padded = String(nextNum).padStart(3, '0');
    res.json({ number: `INV-${padded}`, sequence: nextNum });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save invoice — only for logged-in user
router.post('/invoices', auth, async (req, res) => {
  try {
    const invoice = new Invoice({ ...req.body, userId: req.user._id });
    const saved = await invoice.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update invoice — only owner can update
router.put('/invoices/:id', auth, async (req, res) => {
  try {
    const updated = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, userId: req.user._id },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get only THIS user's invoices
router.get('/invoices', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single invoice — only owner
router.get('/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice — only owner
router.delete('/invoices/:id', auth, async (req, res) => {
  try {
    const deleted = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send invoice by email
router.post('/send-email', auth, async (req, res) => {
  const { recipientEmail, recipientName, message, pdfBase64, invoiceNumber, senderName, total, invoiceId } = req.body;

  if (!recipientEmail || !pdfBase64) {
    return res.status(400).json({ error: 'recipientEmail and pdfBase64 are required' });
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ error: 'Email not configured. Add EMAIL_USER and EMAIL_PASS to .env' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"${senderName || 'InvoicePro'}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Invoice #${invoiceNumber} from ${senderName || 'InvoicePro'}`,
      html: buildEmailHTML(invoiceNumber, senderName, recipientName, message, total,
        invoiceId ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoice/${invoiceId}` : null),
      attachments: [{
        filename: `Invoice-${invoiceNumber}.pdf`,
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf',
      }],
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
