import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/calculations';
import { fmtDate, splitAddressLines, labelWithPercent, TOKENS } from '../utils/invoiceFormat';

const { color: C, font: F, space: S, layout: L } = TOKENS;

// ── Inline styles — locked to PDF metrics for pixel-perfect WYSIWYG ─
const ds = {
  page: {
    fontFamily: F.family,
    color: C.text,
    background: '#fff',
    padding: `${S.page}px`,
    fontSize: `${F.size.base}px`,
    lineHeight: 1.5,
    minHeight: '900px',
  },

  // 1️⃣ HEADER
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: `${S.headerGap}px` },
  logo:          { width: `${L.logoW}px`, height: `${L.logoH}px`, objectFit: 'contain', display: 'block' },
  invHeadBlock:  { textAlign: 'right' },
  invTitle:      { fontSize: `${F.size.hero}px`, color: C.invHead, fontWeight: F.weight.regular, letterSpacing: '0.5px', lineHeight: 1 },
  invNumber:     { fontSize: `${F.size.small}px`, color: C.muted, marginTop: '6px' },

  // SENDER BLOCK — own row (when logo present)
  senderBlock:        { marginBottom: `${S.senderGap}px` },
  // SENDER IN HEADER (when no logo) — replaces logo space
  headerSenderLeft:   { width: '60%' },
  senderName:         { fontSize: `${F.size.small}px`, fontWeight: F.weight.bold, color: C.black },
  fromAddress:        { fontSize: `${F.size.micro}px`, color: C.text, marginTop: '2px' },

  // 2️⃣ + 3️⃣ PARTIES + META
  partiesRow:    { display: 'flex', flexWrap: 'nowrap', marginBottom: `${S.partiesGap}px` },
  partyCol:      { width: L.widthBillTo, paddingRight: '14px' },
  metaCol:       { width: L.widthMeta },
  partyLabel:    { color: C.muted, fontSize: `${F.size.micro}px`, marginBottom: '6px' },
  partyName:     { fontSize: `${F.size.small}px`, fontWeight: F.weight.bold, color: C.black, marginBottom: '3px' },
  partyLine:     { fontSize: `${F.size.micro}px`, color: C.text, marginBottom: '1px' },

  metaRow:       { display: 'flex', justifyContent: 'space-between', padding: `${S.rowPadV}px ${S.rowPadH}px` },
  metaLabel:     { color: C.muted, fontSize: `${F.size.small}px` },
  metaValue:     { color: C.black, fontSize: `${F.size.small}px`, fontWeight: F.weight.bold },

  balanceBar:    {
    backgroundColor: C.bgGrey,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${S.barPadV}px ${S.barPadH}px`,
    marginTop: `${S.barMarginT}px`,
  },
  balanceLabel:  { color: C.black, fontSize: `${F.size.large}px`, fontWeight: F.weight.bold },
  balanceValue:  { color: C.black, fontSize: `${F.size.xl}px`, fontWeight: F.weight.bold },

  // 4️⃣ ITEMS TABLE — dark header (#2D2D2D, rounded), borderless body
  itemsHead:     {
    display: 'flex',
    backgroundColor: C.bgDark,
    color: '#fff',
    padding: `${S.headPadV}px ${S.headPadH}px`,
    borderRadius: '6px',
    overflow: 'hidden',
  },
  itemsHeadCell:    { color: '#fff', fontSize: `${F.size.small}px`, fontWeight: F.weight.bold },
  // Keep divider but don't shift text (centering should match body cols)
  itemsHeadDivider: { borderRight: `1px solid ${C.divider}` },
  itemsRow:      { display: 'flex', padding: `${S.itemRowPadV}px ${S.itemRowPadH}px` },
  col1:          { flex: 4 },
  col2:          { width: '70px',  textAlign: 'center' },
  col3:          { width: '80px',  textAlign: 'center' },
  col4:          { width: '80px',  textAlign: 'center' },
  itemName:      { fontSize: `${F.size.small}px`, fontWeight: F.weight.bold, color: C.black },
  itemDesc:      { fontSize: `${F.size.micro}px`, color: C.label, marginTop: '3px', whiteSpace: 'pre-line' },
  itemValue:     { fontSize: `${F.size.small}px`, color: C.black },

  // 5️⃣ SUMMARY
  summaryRow:    { display: 'flex', justifyContent: 'flex-end', marginTop: `${S.itemsGap}px` },
  summaryBox:    { width: L.widthSummary },
  sumLine:       { display: 'flex', justifyContent: 'space-between', padding: `${S.rowPadV}px ${S.rowPadH}px` },
  sumLabel:      { color: C.muted, fontSize: `${F.size.small}px` },
  sumValue:      { color: C.black, fontSize: `${F.size.small}px` },

  // 6️⃣ NOTES + TERMS
  notesBlock:    { marginTop: `${S.summaryGap}px` },
  termsBlock:    { marginTop: `${S.blockGap}px` },
  footerLabel:   { color: C.muted, fontSize: `${F.size.small}px`, marginBottom: '5px' },
  footerText:    { fontSize: `${F.size.small}px`, color: C.black, lineHeight: 1.5, whiteSpace: 'pre-line' },
};

// ── Sub-components ──────────────────────────────────────────────────
function PartyColumn({ label, text, style: styleOverride }) {
  if (!text) return <div style={{ ...ds.partyCol, ...(styleOverride || {}) }} />;
  const lines = splitAddressLines(text);
  return (
    <div style={{ ...ds.partyCol, ...(styleOverride || {}) }}>
      {!!label && <div style={ds.partyLabel}>{label}</div>}
      <div style={ds.partyName}>{lines[0]}</div>
      {lines.slice(1).map((l, i) => <div key={i} style={ds.partyLine}>{l}</div>)}
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={ds.metaRow}>
      <span style={ds.metaLabel}>{label}</span>
      <span style={ds.metaValue}>{value}</span>
    </div>
  );
}

function SumRow({ label, value }) {
  return (
    <div style={ds.sumLine}>
      <span style={ds.sumLabel}>{label}</span>
      <span style={ds.sumValue}>{value}</span>
    </div>
  );
}

// ── Main Preview ────────────────────────────────────────────────────
const InvoicePreview = forwardRef(function InvoicePreview({ invoice, calculations }, ref) {
  const { subtotal, taxAmount, discountAmount, total, balanceDue } = calculations;

  const hasLogo =
    typeof invoice.logo === 'string' &&
    invoice.logo.trim() !== '' &&
    (invoice.logo.startsWith('data:image') || invoice.logo.startsWith('http'));

  const fromLines  = splitAddressLines(invoice.from);
  const senderName = fromLines[0] || '';
  const senderAddr = fromLines.slice(1);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-invoice-lg border border-slate-200 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Live Preview Badge */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold uppercase tracking-wider">Live Preview</span>
        <span className="text-blue-200 text-xs">Mirrors Downloaded PDF</span>
      </div>

      {/* Document body */}
      <div ref={ref} style={ds.page}>

        {/* 1️⃣ HEADER — conditional layout based on logo presence */}
        {hasLogo ? (
          <>
            {/* WITH LOGO: Logo (TL) | INVOICE (TR) — sender shown below */}
            <div style={ds.header}>
              <div>
                <img src={invoice.logo} alt="logo" style={ds.logo} />
              </div>
              <div style={ds.invHeadBlock}>
                <div style={ds.invTitle}>INVOICE</div>
                {invoice.number && <div style={ds.invNumber}># {invoice.number}</div>}
              </div>
            </div>
            {(senderName || senderAddr.length > 0) && (
              <div style={ds.senderBlock}>
                {senderName && <div style={ds.senderName}>{senderName}</div>}
                {senderAddr.map((l, i) => <div key={i} style={ds.fromAddress}>{l}</div>)}
              </div>
            )}
          </>
        ) : (
          /* WITHOUT LOGO: Sender info IN header-left (replaces logo space) */
          <div style={ds.header}>
            <div style={ds.headerSenderLeft}>
              {senderName && <div style={ds.senderName}>{senderName}</div>}
              {senderAddr.map((l, i) => <div key={i} style={ds.fromAddress}>{l}</div>)}
            </div>
            <div style={ds.invHeadBlock}>
              <div style={ds.invTitle}>INVOICE</div>
              {invoice.number && <div style={ds.invNumber}># {invoice.number}</div>}
            </div>
          </div>
        )}

        {/* 2️⃣ + 3️⃣ PARTIES + META */}
        <div style={ds.partiesRow}>
          {hasLogo ? (
            <>
              <PartyColumn label="Bill To:" text={invoice.to} />
              <PartyColumn label="Ship To:" text={invoice.ship_to} />
            </>
          ) : (
            // NO LOGO: Ship To above Bill To, and hide "Ship To" label
            <div style={{ width: '64%' }}>
              <PartyColumn
                label=""
                text={invoice.ship_to}
                // Align Ship To start closer to INVOICE line
                style={{ width: '100%', paddingRight: 0, marginTop: -44, marginBottom: 0 }}
              />
              <PartyColumn
                label="Bill To:"
                text={invoice.to}
                // Align Bill To start closer to Due Date line
                style={{ width: '100%', paddingRight: 0, marginTop: 30 }}
              />
            </div>
          )}

          <div style={ds.metaCol}>
            {invoice.date          && <MetaRow label="Date:"          value={fmtDate(invoice.date)} />}
            {invoice.payment_terms && <MetaRow label="Payment Terms:" value={invoice.payment_terms} />}
            {invoice.due_date      && <MetaRow label="Due Date:"      value={fmtDate(invoice.due_date)} />}
            {invoice.po_number     && <MetaRow label="PO Number:"     value={invoice.po_number} />}

            <div style={ds.balanceBar}>
              <span style={ds.balanceLabel}>Balance Due:</span>
              <span style={ds.balanceValue}>{formatCurrency(Math.max(0, balanceDue), invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* 4️⃣ ITEMS TABLE */}
        <div>
          <div style={ds.itemsHead}>
            <div style={{ ...ds.itemsHeadCell, ...ds.col1, ...ds.itemsHeadDivider }}>Item</div>
            <div style={{ ...ds.itemsHeadCell, ...ds.col2, ...ds.itemsHeadDivider }}>Quantity</div>
            <div style={{ ...ds.itemsHeadCell, ...ds.col3, ...ds.itemsHeadDivider }}>Rate</div>
            <div style={{ ...ds.itemsHeadCell, ...ds.col4 }}>Amount</div>
          </div>

          {(invoice.items || []).map((item, i) => {
            const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
            return (
              <div key={i} style={ds.itemsRow}>
                <div style={ds.col1}>
                  <div style={ds.itemName}>{item.name || `Item ${i + 1}`}</div>
                  {item.description && <div style={ds.itemDesc}>{item.description}</div>}
                </div>
                <div style={{ ...ds.itemValue, ...ds.col2 }}>{item.quantity || 1}</div>
                <div style={{ ...ds.itemValue, ...ds.col3 }}>{formatCurrency(parseFloat(item.unit_cost) || 0, invoice.currency)}</div>
                <div style={{ ...ds.itemValue, ...ds.col4 }}>{formatCurrency(amount, invoice.currency)}</div>
              </div>
            );
          })}
        </div>

        {/* 5️⃣ SUMMARY */}
        <div style={ds.summaryRow}>
          <div style={ds.summaryBox}>
            <SumRow label="Subtotal:" value={formatCurrency(subtotal, invoice.currency)} />
            {discountAmount > 0 && (
              <SumRow
                label={labelWithPercent('Discount', invoice.discount_type, invoice.discount)}
                value={formatCurrency(discountAmount, invoice.currency)}
              />
            )}
            {(invoice.tax !== undefined && invoice.tax !== null && String(invoice.tax).trim() !== '') && (
              <SumRow
                label={`Tax${invoice.tax_type === 'percent' ? ` (${parseFloat(invoice.tax) || 0}%)` : ''}:`}
                value={formatCurrency(taxAmount, invoice.currency)}
              />
            )}
            {invoice.shipping && parseFloat(invoice.shipping) > 0 && (
              <SumRow label="Shipping:" value={formatCurrency(parseFloat(invoice.shipping), invoice.currency)} />
            )}
            <SumRow label="Total:" value={formatCurrency(total, invoice.currency)} />
            {invoice.amount_paid && parseFloat(invoice.amount_paid) > 0 && (
              <SumRow label="Amount Paid:" value={formatCurrency(parseFloat(invoice.amount_paid), invoice.currency)} />
            )}
          </div>
        </div>

        {/* 6️⃣ NOTES + TERMS */}
        {invoice.notes && (
          <div style={ds.notesBlock}>
            <div style={ds.footerLabel}>Notes:</div>
            <div style={ds.footerText}>{invoice.notes}</div>
          </div>
        )}
        {invoice.terms && (
          <div style={ds.termsBlock}>
            <div style={ds.footerLabel}>Terms:</div>
            <div style={ds.footerText}>{invoice.terms}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default InvoicePreview;
