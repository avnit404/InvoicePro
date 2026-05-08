import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCurrency } from '../utils/calculations';
import { fmtDate, splitAddressLines, labelWithPercent, TOKENS } from '../utils/invoiceFormat';

// ── Font Registration ─────────────────────────────────────────────
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-500-normal.ttf', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((w) => [w]);

const { color: C, font: F, space: S, layout: L } = TOKENS;

// ── Stylesheet ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop:        S.page,
    paddingBottom:     S.page + 6,
    paddingHorizontal: S.page,
    fontFamily: 'Roboto',
    fontSize:   F.size.base,
    color:      C.text,
    lineHeight: 1.5,
  },

  // 1️⃣ HEADER — Logo (TL) | INVOICE/# (TR)
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: S.headerGap },
  logo:          { width: L.logoW, height: L.logoH, objectFit: 'contain' },
  invHeadBlock:  { alignItems: 'flex-end' },
  invTitle:      { fontSize: F.size.hero, color: C.invHead, fontWeight: F.weight.regular, letterSpacing: 0.5, lineHeight: 1 },
  invNumber:     { fontSize: F.size.small, color: C.muted, marginTop: 6 },

  // ── SENDER BLOCK — own row below header (when LOGO is present)
  senderBlock:        { marginBottom: S.senderGap },
  // ── SENDER IN HEADER (when NO logo) — replaces logo space
  headerSenderLeft:   { width: '60%' },
  senderName:         { fontSize: F.size.small, fontWeight: F.weight.bold, color: C.black },
  fromAddress:        { fontSize: F.size.micro, color: C.text, marginTop: 2 },

  // 2️⃣ + 3️⃣ PARTIES + META — three perfectly aligned columns
  partiesRow:    { flexDirection: 'row', marginBottom: S.partiesGap },
  partyCol:      { width: L.widthBillTo, paddingRight: 14 },
  metaCol:       { width: L.widthMeta },
  partyLabel:    { color: C.muted, fontSize: F.size.micro, marginBottom: 6 },
  partyName:     { fontSize: F.size.small, fontWeight: F.weight.bold, color: C.black, marginBottom: 3 },
  partyLine:     { fontSize: F.size.micro, color: C.text, marginBottom: 1 },

  metaRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: S.rowPadH, paddingVertical: S.rowPadV },
  metaLabel:     { color: C.muted, fontSize: F.size.small },
  metaValue:     { color: C.black, fontSize: F.size.small, fontWeight: F.weight.bold },

  // Balance Due — gray box per client spec (#f3f4f6)
  balanceBar:    {
    backgroundColor:   C.bgGrey,
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingHorizontal: S.barPadH,
    paddingVertical:   S.barPadV,
    marginTop:         S.barMarginT,
  },
  balanceLabel:  { color: C.black, fontSize: F.size.large, fontWeight: F.weight.bold },
  balanceValue:  { color: C.black, fontSize: F.size.xl,    fontWeight: F.weight.bold },

  // 4️⃣ ITEMS TABLE — dark header (#2D2D2D, rounded), ZERO body borders
  itemsHead:     {
    flexDirection: 'row',
    backgroundColor: C.bgDark,
    paddingHorizontal: S.headPadH,
    paddingVertical:   S.headPadV,
    borderRadius: 6,             // rounded corners per spec
    overflow: 'hidden',
  },
  // Header cells: white BOLD text + subtle vertical divider (right border)
  itemsHeadCell:    { color: C.white, fontSize: F.size.small, fontWeight: F.weight.bold },
  // Keep divider but don't shift text (centering should match body cols)
  itemsHeadDivider: { borderRightWidth: 1, borderRightColor: C.divider },
  itemsRow:      {
    flexDirection: 'row',
    paddingHorizontal: S.itemRowPadH,
    paddingVertical:   S.itemRowPadV,
    // ZERO borders → clean borderless body
  },
  col1:          { flex: 4 },
  col2:          { width: 70, textAlign: 'center' },
  col3:          { width: 80, textAlign: 'center' },
  col4:          { width: 80, textAlign: 'center' },
  itemName:      { fontSize: F.size.small, fontWeight: F.weight.bold, color: C.black },
  itemDesc:      { fontSize: F.size.micro, color: C.label, marginTop: 3 },
  itemValue:     { fontSize: F.size.small, color: C.black },

  // 5️⃣ SUMMARY — right-aligned, dynamic % labels
  summaryRow:    { flexDirection: 'row', justifyContent: 'flex-end', marginTop: S.itemsGap },
  summaryBox:    { width: L.widthSummary },
  sumLine:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: S.rowPadH, paddingVertical: S.rowPadV },
  sumLabel:      { color: C.muted, fontSize: F.size.small },
  sumValue:      { color: C.black, fontSize: F.size.small },

  // 6️⃣ NOTES + TERMS — stacked vertically, generous spacing
  notesBlock:    { marginTop: S.summaryGap },
  termsBlock:    { marginTop: S.blockGap },
  footerLabel:   { color: C.muted, fontSize: F.size.small, marginBottom: 5 },
  footerText:    { fontSize: F.size.small, color: C.black, lineHeight: 1.5 },
});

// ── Sub-components ──────────────────────────────────────────────────
const PartyColumn = ({ label, text, style: styleOverride }) => {
  if (!text) return <View style={[styles.partyCol, styleOverride || null]} />;
  const lines = splitAddressLines(text);
  return (
    <View style={[styles.partyCol, styleOverride || null]}>
      {!!label && <Text style={styles.partyLabel}>{label}</Text>}
      <Text style={styles.partyName}>{lines[0]}</Text>
      {lines.slice(1).map((l, i) => <Text key={i} style={styles.partyLine}>{l}</Text>)}
    </View>
  );
};

const MetaRow = ({ label, value }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const SumRow = ({ label, value }) => (
  <View style={styles.sumLine}>
    <Text style={styles.sumLabel}>{label}</Text>
    <Text style={styles.sumValue}>{value}</Text>
  </View>
);

// ── Main Document ───────────────────────────────────────────────────
export default function InvoicePDFDocument({ invoice, calculations }) {
  const { subtotal, taxAmount, discountAmount, total, balanceDue } = calculations;

  const hasLogo =
    typeof invoice.logo === 'string' &&
    invoice.logo.trim() !== '' &&
    (invoice.logo.startsWith('data:image') || invoice.logo.startsWith('http'));

  const fromLines  = splitAddressLines(invoice.from);
  const senderName = fromLines[0] || '';
  const senderAddr = fromLines.slice(1);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* 1️⃣ HEADER — conditional layout based on logo presence */}
        {hasLogo ? (
          <>
            {/* WITH LOGO: Logo (TL) | INVOICE (TR) — sender shown below in own block */}
            <View style={styles.header}>
              <View>
                <Image src={invoice.logo} style={styles.logo} />
              </View>
              <View style={styles.invHeadBlock}>
                <Text style={styles.invTitle}>INVOICE</Text>
                {invoice.number && <Text style={styles.invNumber}># {invoice.number}</Text>}
              </View>
            </View>
            {(senderName || senderAddr.length > 0) && (
              <View style={styles.senderBlock}>
                {senderName && <Text style={styles.senderName}>{senderName}</Text>}
                {senderAddr.map((l, i) => <Text key={i} style={styles.fromAddress}>{l}</Text>)}
              </View>
            )}
          </>
        ) : (
          /* WITHOUT LOGO: Sender info IN header-left (replaces logo space) */
          <View style={styles.header}>
            <View style={styles.headerSenderLeft}>
              {senderName && <Text style={styles.senderName}>{senderName}</Text>}
              {senderAddr.map((l, i) => <Text key={i} style={styles.fromAddress}>{l}</Text>)}
            </View>
            <View style={styles.invHeadBlock}>
              <Text style={styles.invTitle}>INVOICE</Text>
              {invoice.number && <Text style={styles.invNumber}># {invoice.number}</Text>}
            </View>
          </View>
        )}

        {/* 2️⃣ + 3️⃣ PARTIES (50/50 left+middle) + META (right) */}
        <View style={styles.partiesRow}>
          {hasLogo ? (
            <>
              <PartyColumn label="Bill To:" text={invoice.to} />
              <PartyColumn label="Ship To:" text={invoice.ship_to} />
            </>
          ) : (
            // NO LOGO: Ship To above Bill To, and hide "Ship To" label
            <View style={{ width: '64%' }}>
              <PartyColumn
                label=""
                text={invoice.ship_to}
                // Align Ship To start closer to INVOICE line
                style={{ width: '100%', paddingRight: 0, marginTop: -32, marginBottom: 0 }}
              />
              <PartyColumn
                label="Bill To:"
                text={invoice.to}
                // Align Bill To start closer to Due Date line
                style={{ width: '100%', paddingRight: 0, marginTop: 24 }}
              />
            </View>
          )}

          <View style={styles.metaCol}>
            {invoice.date          && <MetaRow label="Date:"          value={fmtDate(invoice.date)} />}
            {invoice.payment_terms && <MetaRow label="Payment Terms:" value={invoice.payment_terms} />}
            {invoice.due_date      && <MetaRow label="Due Date:"      value={fmtDate(invoice.due_date)} />}
            {invoice.po_number     && <MetaRow label="PO Number:"     value={invoice.po_number} />}

            <View style={styles.balanceBar}>
              <Text style={styles.balanceLabel}>Balance Due:</Text>
              <Text style={styles.balanceValue}>{formatCurrency(Math.max(0, balanceDue), invoice.currency)}</Text>
            </View>
          </View>
        </View>

        {/* 4️⃣ ITEMS TABLE — dark #222 header, borderless body */}
        <View>
          <View style={styles.itemsHead}>
            <Text style={[styles.itemsHeadCell, styles.col1, styles.itemsHeadDivider]}>Item</Text>
            <Text style={[styles.itemsHeadCell, styles.col2, styles.itemsHeadDivider]}>Quantity</Text>
            <Text style={[styles.itemsHeadCell, styles.col3, styles.itemsHeadDivider]}>Rate</Text>
            <Text style={[styles.itemsHeadCell, styles.col4]}>Amount</Text>
          </View>

          {(invoice.items || []).map((item, i) => {
            const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
            return (
              <View key={i} style={styles.itemsRow}>
                <View style={styles.col1}>
                  <Text style={styles.itemName}>{item.name || `Item ${i + 1}`}</Text>
                  {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                </View>
                <Text style={[styles.itemValue, styles.col2]}>{item.quantity || 1}</Text>
                <Text style={[styles.itemValue, styles.col3]}>{formatCurrency(parseFloat(item.unit_cost) || 0, invoice.currency)}</Text>
                <Text style={[styles.itemValue, styles.col4]}>{formatCurrency(amount, invoice.currency)}</Text>
              </View>
            );
          })}
        </View>

        {/* 5️⃣ SUMMARY — right-aligned, hardcoded % labels */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
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
          </View>
        </View>

        {/* 6️⃣ NOTES & TERMS — stacked vertically */}
        {invoice.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.footerLabel}>Notes:</Text>
            <Text style={styles.footerText}>{invoice.notes}</Text>
          </View>
        )}
        {invoice.terms && (
          <View style={styles.termsBlock}>
            <Text style={styles.footerLabel}>Terms:</Text>
            <Text style={styles.footerText}>{invoice.terms}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}
