// Centralized formatters + design tokens — single source of truth for
// guaranteed visual parity between Live Preview and PDF.

// Normalize: "14-15,Monks" → "14-15, Monks"
export const normalizeAddress = (text) => {
  if (!text) return '';
  return text.replace(/,(?!\s)/g, ', ');
};

// Format date as "May 7, 2026"
export const fmtDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d;
  }
};

// Multi-line address → array of lines (with comma normalization)
export const splitAddressLines = (text) =>
  normalizeAddress(text || '').split('\n').filter(Boolean);

// Build percent-aware label: "Discount" + (1%) → "Discount (1%):"
export const labelWithPercent = (label, type, value) => {
  if (type === 'percent' && parseFloat(value) > 0) {
    return `${label} (${parseFloat(value)}%):`;
  }
  return `${label}:`;
};

// ── Design Tokens — optimized for single-page A4 ──────────────────
export const TOKENS = {
  color: {
    black:    '#000000',
    text:     '#1a1a1a',
    muted:    '#888888',
    label:    '#666666',
    bgGrey:   '#F3F4F6',   // Balance Due bar
    bgDark:   '#2D2D2D',   // Items header
    white:    '#ffffff',
    divider:  '#4a4a4a',   // solid color (rgba renders as green in react-pdf)
    invHead:  '#555555',
  },
  font: {
    family: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
    size: {
      micro:   9.5,
      small:   10.5,
      base:    10.5,
      large:   11.5,
      xl:      12.5,
      hero:    34,
    },
    weight: { regular: 400, medium: 500, bold: 700 },
  },
  // Spacing — TIGHTENED to fit on single A4 page
  space: {
    page:        36,
    headerGap:   26,
    senderGap:   16,
    partiesGap:  38,
    itemsGap:    14,
    summaryGap:  24,
    blockGap:    14,
    rowPadV:     4,
    rowPadH:     10,
    itemRowPadV: 11,
    itemRowPadH: 14,
    headPadV:    5,
    headPadH:    26,
    barPadV:     9,
    barPadH:     12,
    barMarginT:  6,
  },
  layout: {
    widthBillTo:  '32%',
    widthShipTo:  '32%',
    widthMeta:    '36%',
    widthSummary: '44%',
    logoW: 120,
    logoH: 70,
  },
};
