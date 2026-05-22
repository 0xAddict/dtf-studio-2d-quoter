import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SignInModal } from './SignInModal';
import { SignUpModal } from './SignUpModal';
import { Send, Download, RefreshCw, Calculator, Layers, Euro, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { confirmOrderOneClick, startStripeCheckout } from '../services/supabase/orders';
import { ImageUploader } from './ImageUploader';
import { UserMenu } from './UserMenu';
import { packGangSheet, getImageDimensionsCm } from '../src/lib/gangSheet';
import { generateQuotePdf } from '../src/lib/generateQuotePdf';
import type { GangSheetResult } from '../src/lib/gangSheet';
import { supabase } from '../services/supabase/client';

const MATERIAALIT = [
  { value: 'cotton', label: 'Puuvilla', surcharge: 0 },
  { value: 'polyester', label: 'Polyesteri', surcharge: 0 },
  { value: 'blend', label: 'Sekoitekangas', surcharge: 1.5 },
];

const ADMIN_EMAIL = 'hello@dtfstudio.fi';

interface QuoteState {
  quoteId: string;
  gangSheet: GangSheetResult;
  pdfBytes: Uint8Array;
}

export default function DTFQuoter() {
  const [searchParams] = useSearchParams();
  // Admin mode: /quoter?admin=1 or presence of JWT admin role
  const isAdminMode = searchParams.get('admin') === '1';
  const assignToEmail = searchParams.get('assign') ?? '';

  // Sign-in modal state — opened via custom event from UserMenu's "Kirjaudu" button
  // OR automatically when a /login?next=... redirect lands here with signInRequired flag
  const [signInModal, setSignInModal] = useState<null | 'signin' | 'signup'>(null);
  useEffect(() => {
    const open = () => setSignInModal('signin');
    window.addEventListener('open-sign-in-modal', open);
    // Auto-open if arrived via /login redirect
    const state = (window.history.state && window.history.state.usr) as { signInRequired?: boolean } | undefined;
    if (state?.signInRequired) setSignInModal('signin');
    return () => window.removeEventListener('open-sign-in-modal', open);
  }, []);

  const [files, setFiles] = useState<File[]>([]);
  const [leveysStr, setLeveysStr] = useState('20');
  const [korkeusStr, setKorkeusStr] = useState('20');
  const [quantity, setQuantity] = useState(10);
  const [materiaali, setMateriaali] = useState('cotton');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState(assignToEmail);
  const [notes, setNotes] = useState('');
  // Admin-only extra fields
  const [adminAssignEmail, setAdminAssignEmail] = useState(assignToEmail);
  const [adminInternalNotes, setAdminInternalNotes] = useState('');
  const [adminDiscountCents, setAdminDiscountCents] = useState(0);

  const [calculating, setCalculating] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [dbOrderId, setDbOrderId] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const leveys = parseFloat(leveysStr) || 10;
  const korkeus = parseFloat(korkeusStr) || 10;

  const handleCalculate = useCallback(async () => {
    if (files.length === 0) {
      setError('Lisää vähintään yksi kuvatiedosto.');
      return;
    }
    if (!customerEmail) {
      setError('Sähköpostiosoite vaaditaan.');
      return;
    }
    setError(null);
    setCalculating(true);

    try {
      const dims = await Promise.all(files.map(f => getImageDimensionsCm(f)));
      const finalDims = dims.map(() => ({ widthCm: leveys, heightCm: korkeus }));

      const gangSheet = packGangSheet(finalDims, quantity);
      const quoteId = `DTF-${Date.now().toString(36).toUpperCase()}`;

      const pdfBytes = await generateQuotePdf({
        quoteId,
        customerName: customerName || customerEmail,
        customerEmail,
        koko: { widthCm: leveys, heightCm: korkeus },
        materiaali,
        quantity,
        notes,
        gangSheet,
        files,
      });

      setQuote({ quoteId, gangSheet, pdfBytes });
    } catch (err) {
      setError('Virhe laskelmassa. Yritä uudelleen.');
      console.error(err);
    } finally {
      setCalculating(false);
    }
  }, [files, leveys, korkeus, quantity, materiaali, customerName, customerEmail, notes]);

  const handleDownloadPdf = useCallback(() => {
    if (!quote) return;
    const blob = new Blob([quote.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dtfstudio-quote-${quote.quoteId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [quote]);

  const handleSendQuote = useCallback(async () => {
    if (!quote) return;
    setSending(true);
    setError(null);

    try {
      const subject = `DTF Studio Helsinki — Tarjous #${quote.quoteId}`;
      const pdfBase64 = btoa(String.fromCharCode(...quote.pdfBytes));
      const htmlBody = buildEmailHtml(quote, { customerName, customerEmail, leveys, korkeus, quantity, materiaali, notes });

      let customerId: string | null = null;
      try {
        const { data } = await supabase.auth.getUser();
        customerId = data?.user?.id ?? null;
      } catch {
        customerId = null;
      }
      const filesPayload = files.map((f) => ({ name: f.name, size: f.size, type: f.type }));

      const resp = await fetch('/.netlify/functions/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: isAdminMode && adminAssignEmail ? adminAssignEmail : customerEmail,
          subject,
          html: htmlBody,
          pdfBase64,
          quoteId: quote.quoteId,
          adminEmail: ADMIN_EMAIL,
          customerName: customerName || null,
          customerId,
          quoteEur: quote.gangSheet.totalEur,
          sheetCount: quote.gangSheet.sheets,
          material: materiaali,
          sizeCm: { width: leveys, height: korkeus, quantity },
          files: filesPayload,
          gangSheetUrl: null,
          notes: notes || null,
          // Admin-only fields
          ...(isAdminMode ? {
            createdByAdmin: true,
            adminId: customerId,
            internalNotes: adminInternalNotes || null,
            discountAmountCents: adminDiscountCents || 0,
            assignToEmail: adminAssignEmail || null,
          } : {}),
        }),
      });

      if (resp.ok) {
        const responseData = await resp.json().catch(() => ({}));
        setEmailSent(true);
        if (responseData.orderId) {
          setDbOrderId(responseData.orderId);
        }
      } else {
        const txt = await resp.text();
        setError(`Sähköpostivirhe: ${txt}`);
      }
    } catch (err) {
      setError('Sähköpostin lähetys epäonnistui. Lataa PDF manuaalisesti.');
    } finally {
      setSending(false);
    }
  }, [quote, customerName, customerEmail, leveys, korkeus, quantity, materiaali, notes]);

  const handleConfirmOrder = useCallback(async () => {
    if (!dbOrderId) return;
    setConfirming(true);
    setError(null);

    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id ?? null;
    } catch { userId = null; }

    const result = await confirmOrderOneClick(dbOrderId, userId);

    if (result.ok) {
      setOrderConfirmed(true);
      setConfirmMessage('Tilaus vahvistettu. Otamme yhteyttä laskutuksesta.');
    } else if (result.requires_payment) {
      // Need to pay via Stripe — try Stripe checkout
      const stripeResult = await startStripeCheckout(dbOrderId);
      if (stripeResult.blocked) {
        setError('Maksu ei ole vielä käytössä — käytä yhden klikkauksen vahvistusta tai ota yhteyttä meihin.');
      } else if (stripeResult.ok && stripeResult.checkoutUrl) {
        window.location.href = stripeResult.checkoutUrl;
      } else {
        setError(stripeResult.error ?? 'Maksun aloitus epäonnistui.');
      }
    } else {
      setError(result.error ?? 'Vahvistus epäonnistui. Ota yhteyttä meihin.');
    }

    setConfirming(false);
  }, [dbOrderId]);

  const handleReset = () => {
    setFiles([]);
    setQuote(null);
    setEmailSent(false);
    setError(null);
    setDbOrderId(null);
    setOrderConfirmed(false);
    setConfirmMessage(null);
    setCustomerName('');
    setCustomerEmail('');
    setNotes('');
    setAdminAssignEmail('');
    setAdminInternalNotes('');
    setAdminDiscountCents(0);
    setQuantity(10);
    setLeveysStr('20');
    setKorkeusStr('20');
    setMateriaali('cotton');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)', fontFamily: 'var(--serif)' }}>

      {/* Nav — ink border bottom, paper bg */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--paper)', borderBottom: '2px solid var(--ink)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{ background: 'var(--ink)' }}
          >
            <Layers className="w-5 h-5" style={{ color: 'var(--paper)' }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold leading-none"
              style={{ fontFamily: 'var(--serif)', color: 'var(--ink)' }}
            >
              DTF Studio
            </h1>
            <p className="kicker leading-none mt-0.5">Helsinki · Tarjouslaskuri</p>
          </div>
        </div>
        <UserMenu />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p className="kicker kicker--crimson">TARJOUSPYYNTÖ</p>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--serif)', color: 'var(--ink)' }}
          >
            DTF-painatuksen hinta-arvio
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontFamily: 'var(--serif)' }}>
            Lähetä kuva ja saa välitön hinta-arvio gang sheet -painatukselle.
          </p>
        </div>

        {!quote ? (
          <div className="brand-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Step 1 — Kuvat */}
            <section>
              <p className="kicker" style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--crimson)' }}>01 ·</span> KUVA
              </p>
              <div className="section-header">Valitse kuvat</div>
              <ImageUploader files={files} onChange={setFiles} />
            </section>

            <hr className="rule" />

            {/* Step 2 — Koko */}
            <section>
              <p className="kicker" style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--crimson)' }}>02 ·</span> KOKO
              </p>
              <div className="section-header">Valitse koko (cm)</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label className="kicker" style={{ display: 'block', marginBottom: '4px' }}>Leveys</label>
                  <input
                    type="number"
                    min="1"
                    max="29"
                    step="0.5"
                    value={leveysStr}
                    onChange={e => setLeveysStr(e.target.value)}
                    className="brand-input"
                    placeholder="cm"
                  />
                </div>
                <span style={{ color: 'var(--ink-soft)', marginTop: '22px', fontFamily: 'var(--mono)' }}>×</span>
                <div style={{ flex: 1 }}>
                  <label className="kicker" style={{ display: 'block', marginBottom: '4px' }}>Korkeus</label>
                  <input
                    type="number"
                    min="1"
                    max="41"
                    step="0.5"
                    value={korkeusStr}
                    onChange={e => setKorkeusStr(e.target.value)}
                    className="brand-input"
                    placeholder="cm"
                  />
                </div>
                <div style={{ marginTop: '22px' }}>
                  <span className="kicker">cm</span>
                </div>
              </div>
            </section>

            <hr className="rule" />

            {/* Step 3 — Kappalemäärä */}
            <section>
              <p className="kicker" style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--crimson)' }}>03 ·</span> MÄÄRÄ
              </p>
              <div className="section-header">Kappalemäärä (kpl)</div>
              <input
                type="number"
                min="1"
                max="5000"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="brand-input"
              />
              <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '6px', letterSpacing: '0.02em' }}>
                1–9 kpl: 18 € / A3 · 10–49 kpl: 15,50 € / A3 · 50+ kpl: 10,50 € / A3
              </p>
            </section>

            <hr className="rule" />

            {/* Step 4 — Materiaali */}
            <section>
              <p className="kicker" style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--crimson)' }}>04 ·</span> MATERIAALI
              </p>
              <div className="section-header">Valitse materiaali</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {MATERIAALIT.map(m => (
                  <label
                    key={m.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 8px',
                      border: materiaali === m.value ? '2px solid var(--crimson)' : '2px solid var(--ink)',
                      background: materiaali === m.value ? 'var(--ink)' : 'var(--paper)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.1s',
                      borderRadius: '2px',
                      minHeight: '44px',
                    }}
                  >
                    <input
                      type="radio"
                      name="materiaali"
                      value={m.value}
                      checked={materiaali === m.value}
                      onChange={() => setMateriaali(m.value)}
                      style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
                    />
                    <span style={{
                      fontFamily: 'var(--serif)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: materiaali === m.value ? 'var(--paper)' : 'var(--ink)',
                    }}>
                      {m.label}
                    </span>
                    {m.surcharge > 0 && (
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        color: materiaali === m.value ? 'var(--paper-2)' : 'var(--ink-soft)',
                        marginTop: '2px',
                      }}>
                        +{m.surcharge} €/arkki
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            <hr className="rule" />

            {/* Step 5 — Yhteystiedot */}
            <section>
              <p className="kicker" style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--crimson)' }}>05 ·</span> ASIAKAS
              </p>
              <div className="section-header">Yhteystiedot</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nimi (valinnainen)"
                  className="brand-input"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="Sähköpostiosoite *"
                  required
                  className="brand-input"
                />
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Lisätiedot tai erityistoiveet (valinnainen)"
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'var(--field)',
                    color: 'var(--ink)',
                    border: '2px solid var(--ink)',
                    borderRadius: '2px',
                    fontFamily: 'var(--serif)',
                    fontSize: '1rem',
                    padding: '10px 14px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />

                {/* Admin-only extra fields */}
                {isAdminMode && (
                  <div style={{
                    border: '1px dashed #b22222',
                    padding: '16px',
                    background: 'var(--paper-2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}>
                    <p style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#b22222',
                      margin: 0,
                    }}>
                      Admin — lisäkentät
                    </p>
                    <input
                      type="email"
                      value={adminAssignEmail}
                      onChange={e => setAdminAssignEmail(e.target.value)}
                      placeholder="Asiakkaan sähköposti (kohdistus)"
                      className="brand-input"
                    />
                    <textarea
                      value={adminInternalNotes}
                      onChange={e => setAdminInternalNotes(e.target.value)}
                      placeholder="Sisäiset muistiinpanot (ei asiakkaalle)"
                      rows={2}
                      style={{
                        width: '100%',
                        background: 'var(--field)',
                        color: 'var(--ink)',
                        border: '2px solid var(--ink)',
                        borderRadius: '2px',
                        fontFamily: 'var(--serif)',
                        fontSize: '1rem',
                        padding: '10px 14px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: 'var(--ink)',
                        minWidth: '120px',
                      }}>
                        Alennus (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={adminDiscountCents / 100}
                        onChange={e => setAdminDiscountCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                        placeholder="0.00"
                        className="brand-input"
                        style={{ width: '100px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {error && (
              <div className="error-panel">{error}</div>
            )}

            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {calculating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> LASKETAAN…</>
              ) : (
                <><Calculator className="w-5 h-5" /> LASKE HINTA</>
              )}
            </button>
          </div>
        ) : (
          /* Quote result */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="brand-card" style={{ overflow: 'hidden' }}>

              {/* Success header */}
              <div style={{
                background: 'var(--ink)',
                color: 'var(--paper)',
                padding: '20px 24px',
                borderBottom: '2px solid var(--ink)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--cure)' }} />
                  <div>
                    <p className="kicker" style={{ color: 'var(--paper-2)', marginBottom: '2px' }}>TARJOUS VALMIS</p>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--paper)' }}>
                      Hinta-arvio #{quote.quoteId}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Quote breakdown */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="stat-box">
                    <p className="stat-box__label">A3-arkkeja</p>
                    <p className="stat-box__value">{quote.gangSheet.sheets}</p>
                    <p className="stat-box__sub">kpl</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-box__label">Käyttöaste</p>
                    <p className="stat-box__value">{(quote.gangSheet.utilisation * 100).toFixed(0)}%</p>
                    <p className="stat-box__sub">tehokkuus</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-box__label">Hinta / A3</p>
                    <p className="stat-box__value">{quote.gangSheet.pricePerSheet.toFixed(2)} €</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-box__label">Kappalemäärä</p>
                    <p className="stat-box__value">{quantity}</p>
                    <p className="stat-box__sub">kpl</p>
                  </div>
                </div>

                {/* Total */}
                <div className="total-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="total-panel__label">Yhteensä (ALV 0%)</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--paper-2)', marginTop: '2px' }}>
                      {quote.gangSheet.sheets} × {quote.gangSheet.pricePerSheet.toFixed(2)} € + {quote.gangSheet.setupFee.toFixed(2)} € asennusmaksu
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Euro className="w-6 h-6" style={{ color: 'var(--cure)' }} />
                    <span className="total-panel__amount">
                      {quote.gangSheet.totalEur.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleDownloadPdf}
                      className="btn-ghost"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Download className="w-4 h-4" />
                      LATAA PDF
                    </button>

                    {!emailSent ? (
                      <button
                        onClick={handleSendQuote}
                        disabled={sending}
                        className="btn-primary"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        {sending ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> LÄHETETÄÄN…</>
                        ) : (
                          <><Send className="w-4 h-4" /> LÄHETÄ SÄHKÖPOSTIIN</>
                        )}
                      </button>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          border: '2px solid var(--ink)',
                          padding: '10px 20px',
                          fontFamily: 'var(--mono)',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--ink)',
                          background: 'var(--paper-2)',
                        }}
                      >
                        <CheckCircle className="w-4 h-4" style={{ color: 'var(--cure)' }} />
                        LÄHETETTY
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="error-panel">{error}</div>
                  )}

                  {/* Vahvista tilaus — shown after email is sent and order is in DB */}
                  {emailSent && dbOrderId && !orderConfirmed && (
                    <button
                      onClick={handleConfirmOrder}
                      disabled={confirming}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '8px',
                        background: 'var(--crimson)',
                        border: '2px solid var(--crimson)',
                        minHeight: '52px',
                        fontSize: '14px',
                      }}
                    >
                      {confirming ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> VAHVISTETAAN…</>
                      ) : (
                        <><ShieldCheck className="w-4 h-4" /> VAHVISTA TILAUS</>
                      )}
                    </button>
                  )}

                  {/* Order confirmed state */}
                  {orderConfirmed && confirmMessage && (
                    <div style={{
                      border: '2px solid var(--ink)',
                      padding: '16px 20px',
                      background: 'var(--paper-2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '8px',
                    }}>
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--cure)', flexShrink: 0 }} />
                      <p style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--ink)',
                        margin: 0,
                      }}>
                        {confirmMessage}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--ink-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    width: '100%',
                    minHeight: '44px',
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Uusi tarjouspyyntö
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <SignInModal
        isOpen={signInModal === 'signin'}
        onClose={() => setSignInModal(null)}
        onSwitchToSignUp={() => setSignInModal('signup')}
        onSuccess={() => {
          setSignInModal(null);
          // If arrived via /login?next=..., navigate there
          const state = (window.history.state && window.history.state.usr) as { next?: string } | undefined;
          if (state?.next && state.next !== '/') {
            window.location.assign(state.next);
          }
        }}
      />
      <SignUpModal
        isOpen={signInModal === 'signup'}
        onClose={() => setSignInModal(null)}
        onSwitchToSignIn={() => setSignInModal('signin')}
        onSuccess={() => setSignInModal(null)}
      />
    </div>
  );
}

function buildEmailHtml(
  quote: QuoteState,
  info: { customerName: string; customerEmail: string; leveys: number; korkeus: number; quantity: number; materiaali: string; notes: string }
): string {
  return `
<!DOCTYPE html>
<html lang="fi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #f4e4bc; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #e8d8b0; border: 2px solid #1a1a1a; overflow: hidden;">
    <div style="background: #1a1a1a; padding: 24px; color: #f4e4bc;">
      <p style="margin: 0 0 4px; font-family: 'Courier New', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.7;">DTF STUDIO HELSINKI</p>
      <h1 style="margin: 0; font-size: 22px; font-family: Georgia, serif; font-weight: 700;">Tarjous #${quote.quoteId}</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #1a1a1a; font-size: 15px; font-family: Georgia, serif; margin-bottom: 12px;">Hei ${info.customerName || info.customerEmail},</p>
      <p style="color: #44423d; font-size: 14px; font-family: Georgia, serif; margin-bottom: 16px;">Tarjouspyyntösi on vastaanotettu. Hinta-arviosi alla.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; font-family: Georgia, serif;">
        <tr style="background: #f4e4bc;"><td style="padding: 8px 12px; color: #44423d; border-bottom: 1px solid #e8d8b0;">Koko</td><td style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid #e8d8b0;">${info.leveys} × ${info.korkeus} cm</td></tr>
        <tr><td style="padding: 8px 12px; color: #44423d; border-bottom: 1px solid #e8d8b0;">Kappalemäärä</td><td style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid #e8d8b0;">${info.quantity} kpl</td></tr>
        <tr style="background: #f4e4bc;"><td style="padding: 8px 12px; color: #44423d; border-bottom: 1px solid #e8d8b0;">A3-arkkeja</td><td style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid #e8d8b0;">${quote.gangSheet.sheets} kpl</td></tr>
        <tr><td style="padding: 8px 12px; color: #44423d;">Käyttöaste</td><td style="padding: 8px 12px; font-weight: 600;">${(quote.gangSheet.utilisation * 100).toFixed(0)}%</td></tr>
      </table>

      <div style="background: #1a1a1a; color: #f4e4bc; border: 2px solid #1a1a1a; padding: 20px 24px; margin: 16px 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #e8d8b0;">Yhteensä (ALV 0%)</p>
        </div>
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #f4e4bc; font-family: Georgia, serif;">${quote.gangSheet.totalEur.toFixed(2)} €</p>
      </div>

      <p style="color: #44423d; font-size: 13px; font-family: Georgia, serif; margin-bottom: 16px;">PDF-tarjous on liitetty tähän viestiin. Otamme yhteyttä vahvistaaksemme tilauksen.</p>
      <hr style="border: none; border-top: 1px solid #e8d8b0; margin: 20px 0;">
      <p style="color: #44423d; font-family: 'Courier New', monospace; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">DTF Studio Helsinki · <a href="mailto:hello@dtfstudio.fi" style="color: #b22222;">hello@dtfstudio.fi</a> · <a href="https://dtfstudio.fi" style="color: #b22222;">dtfstudio.fi</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
