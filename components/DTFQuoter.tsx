import React, { useState, useCallback } from 'react';
import { Send, Download, RefreshCw, Calculator, Layers, Euro, Loader2, CheckCircle } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ThemeToggle } from './ThemeToggle';
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

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const ADMIN_EMAIL = 'hello@dtfstudio.fi';

interface QuoteState {
  quoteId: string;
  gangSheet: GangSheetResult;
  pdfBytes: Uint8Array;
}

export default function DTFQuoter() {
  // Form fields
  const [files, setFiles] = useState<File[]>([]);
  const [leveysStr, setLeveysStr] = useState('20');
  const [korkeusStr, setKorkeusStr] = useState('20');
  const [quantity, setQuantity] = useState(10);
  const [materiaali, setMateriaali] = useState('cotton');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [calculating, setCalculating] = useState(false);
  const [sending, setSending] = useState(false);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

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
      // Get dimensions from uploaded files
      const dims = await Promise.all(files.map(f => getImageDimensionsCm(f)));
      // Override with user-specified final size
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

      // Resolve current Supabase user (if authenticated) for portal linkage
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
          to: customerEmail,
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
        }),
      });

      if (resp.ok) {
        setEmailSent(true);
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

  const handleReset = () => {
    setFiles([]);
    setQuote(null);
    setEmailSent(false);
    setError(null);
    setCustomerName('');
    setCustomerEmail('');
    setNotes('');
    setQuantity(10);
    setLeveysStr('20');
    setKorkeusStr('20');
    setMateriaali('cotton');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">DTF Studio</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">Helsinki · Tarjouslaskuri</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            DTF-tarjouspyyntö
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Lähetä kuva ja saa välitön hinta-arvio gang sheet -painatukselle.
          </p>
        </div>

        {!quote ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">

            {/* File upload */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                1. Valitse kuvat
              </h3>
              <ImageUploader files={files} onChange={setFiles} />
            </section>

            {/* Size */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                2. Valitse koko (cm)
              </h3>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Leveys</label>
                  <input
                    type="number"
                    min="1"
                    max="29"
                    step="0.5"
                    value={leveysStr}
                    onChange={e => setLeveysStr(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="cm"
                  />
                </div>
                <span className="text-gray-400 mt-5">×</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Korkeus</label>
                  <input
                    type="number"
                    min="1"
                    max="41"
                    step="0.5"
                    value={korkeusStr}
                    onChange={e => setKorkeusStr(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="cm"
                  />
                </div>
                <div className="flex-none mt-5">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">cm</span>
                </div>
              </div>
            </section>

            {/* Quantity */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                3. Kappalemäärä (kpl)
              </h3>
              <input
                type="number"
                min="1"
                max="5000"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                1–9 kpl: 18 € / A3 · 10–49 kpl: 15,50 € / A3 · 50+ kpl: 10,50 € / A3
              </p>
            </section>

            {/* Material */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                4. Valitse materiaali
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {MATERIAALIT.map(m => (
                  <label
                    key={m.value}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      materiaali === m.value
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="materiaali"
                      value={m.value}
                      checked={materiaali === m.value}
                      onChange={() => setMateriaali(m.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{m.label}</span>
                    {m.surcharge > 0 && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">+{m.surcharge} €/arkki</span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            {/* Customer info */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                5. Yhteystiedot
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nimi (valinnainen)"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="Sähköpostiosoite *"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Lisätiedot tai erityistoiveet (valinnainen)"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </section>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Lasketaan...</>
              ) : (
                <><Calculator className="w-5 h-5" /> Laske hinta</>
              )}
            </button>
          </div>
        ) : (
          /* Quote result */
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Success header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200 dark:border-green-800 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/50 p-2.5 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hinta-arvio valmis</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tarjous #{quote.quoteId}</p>
                  </div>
                </div>
              </div>

              {/* Quote breakdown */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">A3-arkkeja</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{quote.gangSheet.sheets}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kpl</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Käyttöaste</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{(quote.gangSheet.utilisation * 100).toFixed(0)}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">tehokkuus</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hinta / A3</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{quote.gangSheet.pricePerSheet.toFixed(2)} €</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kappalemäärä</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{quantity}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kpl</p>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-black dark:bg-white rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 dark:text-gray-600">Yhteensä (ALV 0%)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {quote.gangSheet.sheets} × {quote.gangSheet.pricePerSheet.toFixed(2)} € + {quote.gangSheet.setupFee.toFixed(2)} € asennusmaksu
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Euro className="w-6 h-6 text-green-400 dark:text-green-600" />
                    <span className="text-3xl font-bold text-white dark:text-black">
                      {quote.gangSheet.totalEur.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownloadPdf}
                    className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl font-semibold border-2 border-gray-300 dark:border-slate-600 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Lataa PDF
                  </button>

                  {!emailSent ? (
                    <button
                      onClick={handleSendQuote}
                      disabled={sending}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                      {sending ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Lähetetään...</>
                      ) : (
                        <><Send className="w-5 h-5" /> Lähetä sähköpostiin</>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl font-semibold border-2 border-green-200 dark:border-green-800">
                      <CheckCircle className="w-5 h-5" />
                      Lähetetty sähköpostiin
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm py-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Uusi tarjouspyyntö
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #111; padding: 24px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">DTF Studio Helsinki</h1>
      <p style="margin: 4px 0 0; color: #999; font-size: 14px;">Tarjous #${quote.quoteId}</p>
    </div>
    <div style="padding: 24px;">
      <p style="color: #333; font-size: 15px;">Hei ${info.customerName || info.customerEmail},</p>
      <p style="color: #555; font-size: 14px;">Tarjouspyyntösi on vastaanotettu. Hinta-arviosi:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr style="background: #f9f9f9;"><td style="padding: 8px 12px; color: #666;">Koko</td><td style="padding: 8px 12px; font-weight: 600;">${info.leveys} × ${info.korkeus} cm</td></tr>
        <tr><td style="padding: 8px 12px; color: #666;">Kappalemäärä</td><td style="padding: 8px 12px; font-weight: 600;">${info.quantity} kpl</td></tr>
        <tr style="background: #f9f9f9;"><td style="padding: 8px 12px; color: #666;">A3-arkkeja</td><td style="padding: 8px 12px; font-weight: 600;">${quote.gangSheet.sheets} kpl</td></tr>
        <tr><td style="padding: 8px 12px; color: #666;">Käyttöaste</td><td style="padding: 8px 12px; font-weight: 600;">${(quote.gangSheet.utilisation * 100).toFixed(0)}%</td></tr>
      </table>

      <div style="background: #111; color: white; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; color: #999;">Yhteensä (ALV 0%)</p>
        <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #4ade80;">${quote.gangSheet.totalEur.toFixed(2)} €</p>
      </div>

      <p style="color: #555; font-size: 13px;">PDF-tarjous on liitetty tähän viestiin. Otamme yhteyttä vahvistaaksemme tilauksen.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">DTF Studio Helsinki · <a href="mailto:hello@dtfstudio.fi" style="color: #6366f1;">hello@dtfstudio.fi</a> · <a href="https://dtfstudio.fi" style="color: #6366f1;">dtfstudio.fi</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
