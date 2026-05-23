/**
 * AdminNewQuotePage — /admin/quotes/new
 * M3: Stripped line-item form for phone orders (no canvas/image upload).
 * Same dtf_orders insert path as DTFQuoter, with created_by_admin=true.
 * Brand tokens: var(--paper), var(--paper-2), var(--ink), var(--accent), var(--serif), var(--mono)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase/client';

const MATERIAALIT = [
  { value: 'cotton', label: 'Puuvilla' },
  { value: 'polyester', label: 'Polyesteri' },
  { value: 'blend', label: 'Sekoitekangas' },
];

const KICKER: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  marginBottom: '6px',
};

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--ink)',
  paddingBottom: '8px',
  borderBottom: '2px solid var(--accent)',
  marginBottom: '16px',
};

const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'var(--paper)',
  color: 'var(--ink)',
  border: '2px solid var(--ink)',
  borderRadius: '2px',
  fontFamily: 'var(--serif)',
  fontSize: '1rem',
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '11px',
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
  display: 'block',
  marginBottom: '4px',
};

export const AdminNewQuotePage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const adminId = session?.user?.id ?? null;

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [quoteEur, setQuoteEur] = useState('');
  const [sheetCount, setSheetCount] = useState('1');
  const [material, setMaterial] = useState('cotton');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [internalNotes, setInternalNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [discountEur, setDiscountEur] = useState('0');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerEmail.trim()) return setError('Sähköpostiosoite vaaditaan');
    const priceNum = parseFloat(quoteEur);
    if (!priceNum || priceNum <= 0) return setError('Hinta vaaditaan (> 0)');
    const sheetsNum = parseInt(sheetCount);
    if (!sheetsNum || sheetsNum < 1) return setError('Arkkeja pitää olla vähintään 1');
    if (!adminId) return setError('Admin-istunto ei löydy — kirjaudu uudelleen');

    setSaving(true);

    const discountCents = Math.round(parseFloat(discountEur || '0') * 100);

    const sizeCm = widthCm && heightCm && quantity ? {
      width: parseFloat(widthCm),
      height: parseFloat(heightCm),
      quantity: parseInt(quantity),
    } : null;

    const { data: orderRow, error: insertErr } = await supabase
      .from('dtf_orders')
      .insert({
        customer_email: customerEmail.trim(),
        customer_name: customerName.trim() || null,
        quote_eur: priceNum,
        sheet_count: sheetsNum,
        material: material || null,
        size_cm: sizeCm,
        notes: notes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        discount_amount_cents: discountCents,
        admin_id: adminId,
        created_by_admin: true,
        status: 'quote',
        payment_status: 'none',
        requires_payment: true,
      })
      .select('id')
      .single();

    if (insertErr) {
      setError(`Tallentaminen epäonnistui: ${insertErr.message}`);
      setSaving(false);
      return;
    }

    setSuccess({ orderId: orderRow.id });
    setSaving(false);
  };

  if (success) {
    return (
      <AdminLayout>
        <div style={KICKER}>05C · Uusi tarjous</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
          Tarjous luotu
        </h1>
        <div style={{ width: '48px', height: '2px', background: 'var(--accent)', marginBottom: '32px' }} />

        <div style={{ border: '2px solid var(--ink)', padding: '24px', background: 'var(--paper-2)', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink)' }}>
            Tarjous tallennettu onnistuneesti.
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', marginTop: '8px' }}>
            ID: {success.orderId}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/admin/orders/${success.orderId}`)}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '10px 20px',
              minHeight: '44px',
              border: '2px solid var(--ink)',
              background: 'var(--ink)',
              color: 'var(--paper)',
              cursor: 'pointer',
            }}
          >
            Avaa tilaus
          </button>
          <button
            onClick={() => { setSuccess(null); setCustomerEmail(''); setCustomerName(''); setQuoteEur(''); setSheetCount('1'); setNotes(''); setInternalNotes(''); setDiscountEur('0'); }}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '10px 20px',
              minHeight: '44px',
              border: '2px solid var(--ink)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            Uusi tarjous
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={KICKER}>05C · Uusi tarjous</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
        Uusi tarjous — puhelintilaus
      </h1>
      <div style={{ width: '48px', height: '2px', background: 'var(--accent)', marginBottom: '32px' }} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '560px' }}>

        {/* Customer */}
        <section>
          <div style={KICKER}>01 · Asiakas</div>
          <div style={SECTION_HEADER}>Yhteystiedot</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={LABEL}>Sähköposti *</label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required style={INPUT} placeholder="asiakas@esimerkki.fi" />
            </div>
            <div>
              <label style={LABEL}>Nimi</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={INPUT} placeholder="Asiakkaan nimi" />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <div style={KICKER}>02 · Hinta</div>
          <div style={SECTION_HEADER}>Hinta ja arkit</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LABEL}>Hinta (€) *</label>
              <input type="number" min="0.01" step="0.01" value={quoteEur} onChange={e => setQuoteEur(e.target.value)} required style={INPUT} placeholder="0.00" />
            </div>
            <div>
              <label style={LABEL}>A3-arkkeja *</label>
              <input type="number" min="1" step="1" value={sheetCount} onChange={e => setSheetCount(e.target.value)} required style={INPUT} placeholder="1" />
            </div>
            <div>
              <label style={LABEL}>Alennus (€)</label>
              <input type="number" min="0" step="0.50" value={discountEur} onChange={e => setDiscountEur(e.target.value)} style={INPUT} placeholder="0.00" />
            </div>
          </div>
        </section>

        {/* Specs */}
        <section>
          <div style={KICKER}>03 · Tuote</div>
          <div style={SECTION_HEADER}>Tuotemäärittely</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={LABEL}>Materiaali</label>
              <select value={material} onChange={e => setMaterial(e.target.value)} style={{ ...INPUT, fontFamily: 'var(--mono)' }}>
                {MATERIAALIT.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={LABEL}>Leveys (cm)</label>
                <input type="number" min="1" step="0.5" value={widthCm} onChange={e => setWidthCm(e.target.value)} style={INPUT} placeholder="20" />
              </div>
              <div>
                <label style={LABEL}>Korkeus (cm)</label>
                <input type="number" min="1" step="0.5" value={heightCm} onChange={e => setHeightCm(e.target.value)} style={INPUT} placeholder="20" />
              </div>
              <div>
                <label style={LABEL}>Kpl</label>
                <input type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={INPUT} placeholder="10" />
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section>
          <div style={KICKER}>04 · Muistiinpanot</div>
          <div style={SECTION_HEADER}>Muistiinpanot</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={LABEL}>Asiakkaalle näkyvät muistiinpanot</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }} placeholder="Lisätiedot asiakkaalle" />
            </div>
            <div style={{ borderTop: '1px dashed var(--accent)', paddingTop: '12px' }}>
              <label style={{ ...LABEL, color: 'var(--accent)' }}>Sisäiset muistiinpanot (vain admin)</label>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} style={{ ...INPUT, resize: 'vertical', borderColor: 'var(--accent)' }} placeholder="Puhelun muistiinpanot, erikoisehdot, jne." />
            </div>
          </div>
        </section>

        {error && (
          <div style={{
            border: '2px solid var(--accent)',
            padding: '12px 16px',
            background: 'var(--field)',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--accent)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '16px 24px',
            minHeight: '52px',
            border: '2px solid var(--ink)',
            background: 'var(--ink)',
            color: 'var(--paper)',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            width: '100%',
          }}
        >
          {saving ? 'Tallennetaan…' : 'Tallenna tarjous'}
        </button>
      </form>
    </AdminLayout>
  );
};
