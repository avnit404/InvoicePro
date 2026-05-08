import jsPDF from 'jspdf';
import { formatCurrency } from './calculations';

const C = {
  black:   [0, 0, 0],
  text:    [30, 30, 30],
  gray:    [110, 110, 110],
  light:   [234, 234, 234],
  border:  [220, 220, 220],
  white:   [255, 255, 255],
  tableHd: [34, 34, 34],
  invHd:   [85, 85, 85],
  invSub:  [136, 136, 136],
};

function rgb(pdf, color, type = 'text') {
  if (type === 'text') pdf.setTextColor(...color);
  if (type === 'fill') pdf.setFillColor(...color);
  if (type === 'draw') pdf.setDrawColor(...color);
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return d; }
}

function getImgFormat(dataUrl) {
  const mime = dataUrl.split(';')[0].split('/')[1]?.toUpperCase();
  return mime === 'JPG' ? 'JPEG' : (mime || 'PNG');
}

export async function downloadInvoicePDF(invoice, calculations) {
  const { subtotal, taxAmount, discountAmount, total, balanceDue } = calculations;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 18;            // page margin
  const CW = W - M * 2;    // content width
  let y = M + 4;

  // ── HEADER ────────────────────────────────────────────────────────
  // Left: logo or company name (bold) then address lines
  let leftBottom = y;
  let logoH = 0;

  if (invoice.logo?.startsWith('data:')) {
    try {
      const fmt = getImgFormat(invoice.logo);
      pdf.addImage(invoice.logo, fmt, M, y, 0, 16, undefined, 'FAST');
      logoH = 18;
    } catch (_) { /* skip bad logo */ }
  }

  if (invoice.from) {
    const allLines = invoice.from.split('\n').filter(Boolean);
    const fromY = y + logoH + (logoH ? 2 : 0);

    // First line: bold company name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    rgb(pdf, C.black);
    pdf.text(allLines[0] || '', M, fromY);

    // Remaining: gray address lines
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.text);
    const rest = allLines.slice(1);
    rest.forEach((l, i) => pdf.text(l, M, fromY + 4.5 + i * 4));

    leftBottom = fromY + (rest.length ? rest.length * 4 + 2 : 0);
  } else {
    leftBottom = y + logoH;
  }

  // Right: "INVOICE" thin gray + # number
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(28);
  rgb(pdf, C.invHd);
  pdf.text('INVOICE', W - M, y + 8, { align: 'right' });

  if (invoice.number) {
    pdf.setFontSize(9.5);
    rgb(pdf, C.invSub);
    pdf.text(`# ${invoice.number}`, W - M, y + 14, { align: 'right' });
  }

  // Move y below header
  y = Math.max(leftBottom, y + 22) + 8;

  // ── BILL TO + META ROW ────────────────────────────────────────────
  // Two columns: left = Bill To, right = Date / Terms / Due / PO / Balance Due
  const metaX = M + CW * 0.55;
  const metaW = CW * 0.45;
  const metaLabelX = metaX + 2;
  const metaValueX = M + CW - 2;

  let metaY = y;

  // Bill To (left)
  let billY = y;
  if (invoice.to) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.invSub);
    pdf.text('Bill To:', M, billY);
    billY += 5;

    const toLines = invoice.to.split('\n').filter(Boolean);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    rgb(pdf, C.black);
    pdf.text(toLines[0] || '', M, billY);
    billY += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.text);
    toLines.slice(1).forEach((l) => { pdf.text(l, M, billY); billY += 4; });
  }

  if (invoice.ship_to) {
    billY += 3;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.invSub);
    pdf.text('Ship To:', M, billY);
    billY += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.text);
    invoice.ship_to.split('\n').filter(Boolean).forEach((l) => {
      pdf.text(l, M, billY); billY += 4;
    });
  }

  // Meta rows (right)
  const metaRow = (label, value) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.invHd);
    pdf.text(label, metaLabelX, metaY + 4);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    rgb(pdf, C.black);
    pdf.text(value, metaValueX, metaY + 4, { align: 'right' });

    metaY += 6;
  };

  if (invoice.date) metaRow('Date:', formatDate(invoice.date));
  if (invoice.payment_terms) metaRow('Payment Terms:', invoice.payment_terms);
  if (invoice.due_date) metaRow('Due Date:', formatDate(invoice.due_date));
  if (invoice.po_number) metaRow('PO Number:', invoice.po_number);

  // Balance Due — gray highlighted bar
  metaY += 1;
  rgb(pdf, C.light, 'fill');
  pdf.rect(metaX, metaY, metaW, 9, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  rgb(pdf, C.black);
  pdf.text('Balance Due:', metaLabelX, metaY + 6);
  pdf.text(formatCurrency(Math.max(0, balanceDue), invoice.currency), metaValueX, metaY + 6, { align: 'right' });
  metaY += 14;

  y = Math.max(billY, metaY) + 6;

  // ── LINE ITEMS TABLE ──────────────────────────────────────────────
  const COL = {
    item: M + 4,
    qty:  M + CW * 0.62,
    rate: M + CW * 0.80,
    amt:  M + CW - 4,
  };
  const HEAD_H = 8;

  // Header bar
  rgb(pdf, C.tableHd, 'fill');
  pdf.rect(M, y, CW, HEAD_H, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  rgb(pdf, C.white);
  pdf.text('Item', COL.item, y + 5.5);
  pdf.text('Quantity', COL.qty, y + 5.5, { align: 'right' });
  pdf.text('Rate', COL.rate, y + 5.5, { align: 'right' });
  pdf.text('Amount', COL.amt, y + 5.5, { align: 'right' });
  y += HEAD_H + 2;

  // Rows
  (invoice.items || []).forEach((item) => {
    const hasDesc = !!item.description;
    const rh = hasDesc ? 11 : 9;

    if (y + rh > 270) { pdf.addPage(); y = M; }

    const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    rgb(pdf, C.black);
    pdf.text(item.name || '', COL.item, y + 4);

    if (hasDesc) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      rgb(pdf, C.gray);
      pdf.text(item.description, COL.item, y + 8);
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    rgb(pdf, C.text);
    pdf.text(String(item.quantity || 1), COL.qty, y + 4, { align: 'right' });
    pdf.text(formatCurrency(parseFloat(item.unit_cost) || 0, invoice.currency), COL.rate, y + 4, { align: 'right' });
    pdf.text(formatCurrency(amount, invoice.currency), COL.amt, y + 4, { align: 'right' });

    // Bottom border
    rgb(pdf, C.border, 'draw');
    pdf.setLineWidth(0.2);
    pdf.line(M, y + rh, M + CW, y + rh);

    y += rh;
  });

  y += 8;

  // ── SUMMARY (right column, plain rows) ────────────────────────────
  const sumLabelX = M + CW * 0.57;
  const sumValueX = M + CW - 2;

  const sumRow = (label, value) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    rgb(pdf, C.invHd);
    pdf.text(label, sumLabelX, y);

    rgb(pdf, C.black);
    pdf.text(value, sumValueX, y, { align: 'right' });
    y += 6;
  };

  sumRow('Subtotal:', formatCurrency(subtotal, invoice.currency));

  const taxPct = invoice.tax_type === 'percent' ? ` (${parseFloat(invoice.tax) || 0}%)` : '';
  sumRow(`Tax${taxPct}:`, formatCurrency(taxAmount, invoice.currency));

  if (discountAmount > 0) {
    const dPct = invoice.discount_type === 'percent' ? ` (${parseFloat(invoice.discount) || 0}%)` : '';
    sumRow(`Discount${dPct}:`, `- ${formatCurrency(discountAmount, invoice.currency)}`);
  }
  if (invoice.shipping && parseFloat(invoice.shipping) > 0) {
    sumRow('Shipping:', formatCurrency(parseFloat(invoice.shipping), invoice.currency));
  }
  sumRow('Total:', formatCurrency(total, invoice.currency));

  if (invoice.amount_paid && parseFloat(invoice.amount_paid) > 0) {
    sumRow('Amount Paid:', `- ${formatCurrency(parseFloat(invoice.amount_paid), invoice.currency)}`);
  }

  y += 6;

  // ── NOTES & TERMS ─────────────────────────────────────────────────
  const printBlock = (label, text, x, maxW) => {
    if (!text) return;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.invSub);
    pdf.text(`${label}:`, x, y);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rgb(pdf, C.text);
    const lines = pdf.splitTextToSize(text, maxW);
    lines.forEach((l, i) => pdf.text(l, x, y + 5 + i * 4.2));
  };

  if (invoice.notes || invoice.terms) {
    if (y > 260) { pdf.addPage(); y = M; }
    const halfW = CW / 2 - 4;
    if (invoice.notes) printBlock('Notes', invoice.notes, M, halfW);
    if (invoice.terms) printBlock('Terms', invoice.terms, invoice.notes ? M + CW / 2 + 4 : M, halfW);
  }

  pdf.save(`invoice-${invoice.number || 'download'}.pdf`);
}
