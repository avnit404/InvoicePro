import React, { forwardRef } from 'react';
import { formatCurrency } from '../utils/calculations';

// A4 at 96dpi = 794px wide. Uses HTML <table> for reliable html2canvas capture.
const PrintableInvoice = forwardRef(function PrintableInvoice({ invoice, calculations }, ref) {
  const { subtotal, taxAmount, discountAmount, total, balanceDue } = calculations;

  const fmtDate = (d) => {
    if (!d) return '';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const page = {
    width: '794px',
    minHeight: '1123px',
    background: '#ffffff',
    padding: '56px 60px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '12px',
    color: '#000000',
    boxSizing: 'border-box',
    lineHeight: '1.5',
  };

  return (
    <div ref={ref} style={page}>

      {/* ── HEADER (logo + From | INVOICE + #) ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <tbody>
          <tr>
            <td style={{ width: '60%', verticalAlign: 'top' }}>
              {invoice.logo && (
                <img src={invoice.logo} alt="logo"
                  style={{ maxHeight: '90px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '14px' }}
                  crossOrigin="anonymous" />
              )}
              {invoice.from && (
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px', color: '#000' }}>
                    {invoice.from.split('\n')[0]}
                  </div>
                  {invoice.from.split('\n').slice(1).map((l, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#000', marginBottom: '2px', lineHeight: '1.5' }}>{l}</div>
                  ))}
                </div>
              )}
            </td>
            <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'right' }}>
              <div style={{ fontSize: '40px', fontWeight: '300', color: '#555', letterSpacing: '1px', lineHeight: '1' }}>INVOICE</div>
              {invoice.number && (
                <div style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}># {invoice.number}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── BILL TO | SHIP TO | META — three side-by-side columns ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '36px' }}>
        <tbody>
          <tr>
            {/* Bill To column */}
            <td style={{ width: '28%', verticalAlign: 'top', paddingRight: '16px' }}>
              {invoice.to && (
                <>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>Bill To:</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px', color: '#000', lineHeight: '1.4' }}>
                    {invoice.to.split('\n')[0]}
                  </div>
                  {invoice.to.split('\n').slice(1).map((l, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#000', marginBottom: '2px', lineHeight: '1.4' }}>{l}</div>
                  ))}
                </>
              )}
            </td>

            {/* Ship To column (only if filled) */}
            <td style={{ width: '28%', verticalAlign: 'top', paddingRight: '16px' }}>
              {invoice.ship_to && (
                <>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>Ship To:</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px', color: '#000', lineHeight: '1.4' }}>
                    {invoice.ship_to.split('\n')[0]}
                  </div>
                  {invoice.ship_to.split('\n').slice(1).map((l, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#000', marginBottom: '2px', lineHeight: '1.4' }}>{l}</div>
                  ))}
                </>
              )}
            </td>

            {/* Meta column (Date / Terms / Due / PO / Balance Due) */}
            <td style={{ width: '44%', verticalAlign: 'top' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {invoice.date && (
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>Date:</td>
                      <td style={{ padding: '4px 8px', color: '#000', fontSize: '12px', fontWeight: '700', textAlign: 'right', minWidth: '120px' }}>{fmtDate(invoice.date)}</td>
                    </tr>
                  )}
                  {invoice.payment_terms && (
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>Payment Terms:</td>
                      <td style={{ padding: '4px 8px', color: '#000', fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>{invoice.payment_terms}</td>
                    </tr>
                  )}
                  {invoice.due_date && (
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>Due Date:</td>
                      <td style={{ padding: '4px 8px', color: '#000', fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>{fmtDate(invoice.due_date)}</td>
                    </tr>
                  )}
                  {invoice.po_number && (
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>PO Number:</td>
                      <td style={{ padding: '4px 8px', color: '#000', fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>{invoice.po_number}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="2" style={{ padding: '0', paddingTop: '6px' }}>
                      <table style={{ width: '100%', backgroundColor: '#eaeaea', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '10px 12px', color: '#000', fontSize: '13px', fontWeight: '700' }}>Balance Due:</td>
                            <td style={{ padding: '10px 12px', color: '#000', fontSize: '14px', fontWeight: '700', textAlign: 'right' }}>
                              {formatCurrency(Math.max(0, balanceDue), invoice.currency)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── LINE ITEMS TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ backgroundColor: '#222222' }}>
            <th style={{ padding: '12px 14px', color: '#fff', fontSize: '12px', fontWeight: '400', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '12px 14px', color: '#fff', fontSize: '12px', fontWeight: '400', textAlign: 'right', width: '100px' }}>Quantity</th>
            <th style={{ padding: '12px 14px', color: '#fff', fontSize: '12px', fontWeight: '400', textAlign: 'right', width: '120px' }}>Rate</th>
            <th style={{ padding: '12px 14px', color: '#fff', fontSize: '12px', fontWeight: '400', textAlign: 'right', width: '120px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, i) => {
            const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
            return (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '14px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: '700', color: '#000', fontSize: '12px' }}>{item.name || `Item ${i + 1}`}</div>
                  {item.description && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', whiteSpace: 'pre-line' }}>{item.description}</div>
                  )}
                </td>
                <td style={{ padding: '14px', textAlign: 'right', color: '#000', fontSize: '12px', verticalAlign: 'top' }}>{item.quantity || 1}</td>
                <td style={{ padding: '14px', textAlign: 'right', color: '#000', fontSize: '12px', verticalAlign: 'top' }}>
                  {formatCurrency(parseFloat(item.unit_cost) || 0, invoice.currency)}
                </td>
                <td style={{ padding: '14px', textAlign: 'right', color: '#000', fontSize: '12px', verticalAlign: 'top' }}>
                  {formatCurrency(amount, invoice.currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── SUMMARY ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%' }}></td>
            <td style={{ width: '45%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>Subtotal:</td>
                    <td style={{ padding: '5px 8px', color: '#000', fontSize: '12px', textAlign: 'right', minWidth: '120px' }}>
                      {formatCurrency(subtotal, invoice.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>
                      Tax{invoice.tax_type === 'percent' ? ` (${parseFloat(invoice.tax) || 0}%)` : ''}:
                    </td>
                    <td style={{ padding: '5px 8px', color: '#000', fontSize: '12px', textAlign: 'right' }}>
                      {formatCurrency(taxAmount, invoice.currency)}
                    </td>
                  </tr>
                  {discountAmount > 0 && (
                    <tr>
                      <td style={{ padding: '5px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>
                        Discount{invoice.discount_type === 'percent' ? ` (${parseFloat(invoice.discount) || 0}%)` : ''}:
                      </td>
                      <td style={{ padding: '5px 8px', color: '#000', fontSize: '12px', textAlign: 'right' }}>
                        - {formatCurrency(discountAmount, invoice.currency)}
                      </td>
                    </tr>
                  )}
                  {invoice.shipping && parseFloat(invoice.shipping) > 0 && (
                    <tr>
                      <td style={{ padding: '5px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>Shipping:</td>
                      <td style={{ padding: '5px 8px', color: '#000', fontSize: '12px', textAlign: 'right' }}>
                        {formatCurrency(parseFloat(invoice.shipping), invoice.currency)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '5px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>Total:</td>
                    <td style={{ padding: '5px 8px', color: '#000', fontSize: '12px', textAlign: 'right', fontWeight: '400' }}>
                      {formatCurrency(total, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.amount_paid && parseFloat(invoice.amount_paid) > 0 && (
                    <tr>
                      <td style={{ padding: '5px 8px', color: '#888', fontSize: '12px', textAlign: 'right' }}>Amount Paid:</td>
                      <td style={{ padding: '5px 8px', color: '#000', fontSize: '12px', textAlign: 'right' }}>
                        - {formatCurrency(parseFloat(invoice.amount_paid), invoice.currency)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── NOTES & TERMS ── */}
      {(invoice.notes || invoice.terms) && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '40px' }}>
          <tbody>
            <tr>
              {invoice.notes && (
                <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '20px' }}>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>Notes:</div>
                  <div style={{ fontSize: '12px', color: '#000', whiteSpace: 'pre-line' }}>{invoice.notes}</div>
                </td>
              )}
              {invoice.terms && (
                <td style={{ width: '50%', verticalAlign: 'top' }}>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>Terms:</div>
                  <div style={{ fontSize: '12px', color: '#000', whiteSpace: 'pre-line' }}>{invoice.terms}</div>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
});

export default PrintableInvoice;
