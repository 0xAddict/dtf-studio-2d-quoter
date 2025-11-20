import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Download, CheckCircle } from 'lucide-react';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelData: {
    fileName: string;
    vertices: number;
    triangles: number;
    dimensions: { x: string; y: string; z: string };
    material: string;
    scale: number;
  } | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  quantity: string;
  timeline: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

interface QuoteData {
  quoteId: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  modelInfo: {
    fileName: string;
    material: string;
    scale: number;
    quantity: number;
    timeline: string;
    vertices: number;
    triangles: number;
    dimensions: { x: string; y: string; z: string };
  };
  pricing: {
    baseCost: number;
    materialCost: number;
    quantityDiscount: number;
    total: number;
  };
}

const materialNames: Record<string, string> = {
  'asa': 'ASA - Kestävä ja säänkestävä',
  'tpu': 'TPU - Joustava kumimainen',
  'pla': 'PLA - Edullinen',
  'petg': 'PETG - Kestävä ja sitkeä',
  'nylon-carbon': 'Nylon + hiilikuitu',
  'resin-standard': 'Hartsi - ABS-tyyppinen',
  'resin-clear': 'Hartsi - Kirkas',
};

const materialPrices: Record<string, number> = {
  'asa': 25,
  'tpu': 30,
  'pla': 15,
  'petg': 20,
  'nylon-carbon': 45,
  'resin-standard': 35,
  'resin-clear': 40,
};

export const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({ isOpen, onClose, modelData }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    quantity: '1',
    timeline: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generatedQuote, setGeneratedQuote] = useState<QuoteData | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    const previouslyFocused = document.activeElement as HTMLElement;

    const getFocusableElements = () => {
      return modalElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  const generateQuote = (): QuoteData => {
    const quantity = parseInt(formData.quantity) || 1;
    const baseCost = 50;
    const materialCost = modelData?.material
      ? (materialPrices[modelData.material] || 20) * quantity
      : 20 * quantity;
    const quantityDiscount = quantity >= 10 ? materialCost * 0.15 : quantity >= 5 ? materialCost * 0.10 : 0;
    const total = baseCost + materialCost - quantityDiscount;

    return {
      quoteId: `HF-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString('fi-FI'),
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || 'Ei annettu',
        company: formData.company || '-',
      },
      modelInfo: {
        fileName: modelData?.fileName || 'Tuntematon',
        material: modelData?.material ? materialNames[modelData.material] || modelData.material : 'Ei valittu',
        scale: modelData?.scale || 100,
        quantity,
        timeline: formData.timeline || 'Ei määritelty',
        vertices: modelData?.vertices || 0,
        triangles: modelData?.triangles || 0,
        dimensions: modelData?.dimensions || { x: '0', y: '0', z: '0' },
      },
      pricing: {
        baseCost,
        materialCost,
        quantityDiscount,
        total,
      },
    };
  };

  const downloadQuotePDF = (quote: QuoteData) => {
    // Generate HTML content for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tarjous ${quote.quoteId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      line-height: 1.6;
      color: #1f2937;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #4f46e5;
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .quote-id {
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .section-title {
      color: #4f46e5;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .label {
      font-weight: 600;
      color: #374151;
    }
    .value {
      color: #6b7280;
    }
    .pricing-table {
      width: 100%;
      margin-top: 20px;
    }
    .pricing-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .pricing-row.total {
      border-top: 3px solid #4f46e5;
      border-bottom: 3px solid #4f46e5;
      font-size: 20px;
      font-weight: 700;
      color: #4f46e5;
      margin-top: 10px;
    }
    .discount {
      color: #059669;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>HEXEA FORGE</h1>
    <div class="quote-id">Tarjous #${quote.quoteId}</div>
    <div class="quote-id">Päivämäärä: ${quote.date}</div>
  </div>

  <div class="section">
    <div class="section-title">Asiakastiedot</div>
    <div class="info-grid">
      <div class="info-row">
        <span class="label">Nimi:</span>
        <span class="value">${quote.customer.name}</span>
      </div>
      <div class="info-row">
        <span class="label">Yritys:</span>
        <span class="value">${quote.customer.company}</span>
      </div>
      <div class="info-row">
        <span class="label">Sähköposti:</span>
        <span class="value">${quote.customer.email}</span>
      </div>
      <div class="info-row">
        <span class="label">Puhelin:</span>
        <span class="value">${quote.customer.phone}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Mallin tiedot</div>
    <div class="info-grid">
      <div class="info-row">
        <span class="label">Tiedosto:</span>
        <span class="value">${quote.modelInfo.fileName}</span>
      </div>
      <div class="info-row">
        <span class="label">Materiaali:</span>
        <span class="value">${quote.modelInfo.material}</span>
      </div>
      <div class="info-row">
        <span class="label">Koko:</span>
        <span class="value">${quote.modelInfo.scale}%</span>
      </div>
      <div class="info-row">
        <span class="label">Määrä:</span>
        <span class="value">${quote.modelInfo.quantity} kpl</span>
      </div>
      <div class="info-row">
        <span class="label">Aikataulu:</span>
        <span class="value">${quote.modelInfo.timeline}</span>
      </div>
      <div class="info-row">
        <span class="label">Kolmiot:</span>
        <span class="value">${quote.modelInfo.triangles.toLocaleString()}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Hinnoittelu</div>
    <div class="pricing-table">
      <div class="pricing-row">
        <span>Perushinta</span>
        <span>${quote.pricing.baseCost.toFixed(2)} €</span>
      </div>
      <div class="pricing-row">
        <span>Materiaali (${quote.modelInfo.quantity} kpl)</span>
        <span>${quote.pricing.materialCost.toFixed(2)} €</span>
      </div>
      ${quote.pricing.quantityDiscount > 0 ? `
      <div class="pricing-row discount">
        <span>Määräalennus</span>
        <span>-${quote.pricing.quantityDiscount.toFixed(2)} €</span>
      </div>
      ` : ''}
      <div class="pricing-row total">
        <span>YHTEENSÄ (ALV 0%)</span>
        <span>${quote.pricing.total.toFixed(2)} €</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Hexea Forge - 3D-tulostuspalvelut</p>
    <p>Tarjous on voimassa 30 päivää</p>
    <p>Hinnat eivät sisällä arvonlisäveroa</p>
  </div>
</body>
</html>
    `.trim();

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hexea-tarjous-${quote.quoteId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nimi on pakollinen';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Sähköposti on pakollinen';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Virheellinen sähköpostiosoite';
    }

    if (formData.phone && !/^[+]?[\d\s-]{6,}$/.test(formData.phone)) {
      newErrors.phone = 'Virheellinen puhelinnumero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Generate quote
      const quote = generateQuote();
      setGeneratedQuote(quote);

      // Prepare model info for the email
      const modelInfo = modelData ? `
Mallin tiedot:
- Tiedosto: ${modelData.fileName}
- Materiaali: ${modelData.material ? materialNames[modelData.material] || modelData.material : 'Ei valittu'}
- Koko: ${modelData.scale}%
- Määrä: ${formData.quantity} kpl
- Vertices: ${modelData.vertices.toLocaleString()}
- Triangles: ${modelData.triangles.toLocaleString()}
- Mitat (alkuperäiset): X: ${modelData.dimensions.x}, Y: ${modelData.dimensions.y}, Z: ${modelData.dimensions.z}

Hinnoittelu:
- Perushinta: ${quote.pricing.baseCost.toFixed(2)} €
- Materiaalikustannus: ${quote.pricing.materialCost.toFixed(2)} €
${quote.pricing.quantityDiscount > 0 ? `- Määräalennus: -${quote.pricing.quantityDiscount.toFixed(2)} €\n` : ''}- Yhteensä: ${quote.pricing.total.toFixed(2)} €
      `.trim() : 'Ei mallia ladattu';

      // Send to Web3Forms
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: 'a82cd435-98b5-4787-a9e9-1476be34ece4',
          subject: `Uusi tarjouspyyntö #${quote.quoteId} - ${formData.name}`,
          from_name: 'Hexea Forge',
          name: formData.name,
          email: formData.email,
          phone: formData.phone || 'Ei annettu',
          company: formData.company || 'Ei annettu',
          quantity: formData.quantity,
          timeline: formData.timeline || 'Ei määritelty',
          message: formData.message || 'Ei lisätietoja',
          model_info: modelInfo,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        // Auto-download quote PDF
        downloadQuotePDF(quote);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBackdropClick = () => {
    if (submitStatus !== 'success') {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleNewQuote = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      quantity: '1',
      timeline: '',
      message: '',
    });
    setGeneratedQuote(null);
    setSubmitStatus('idle');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700"
        onClick={handleModalClick}
      >
        {submitStatus === 'success' && generatedQuote ? (
          // Success View with Quote Summary
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Tarjous lähetetty!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Tarjouksesi #{generatedQuote.quoteId} on lähetetty sähköpostiisi
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Tarjouksen yhteenveto</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Materiaali:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{generatedQuote.modelInfo.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Määrä:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{generatedQuote.modelInfo.quantity} kpl</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-200 dark:border-indigo-800">
                  <span className="font-semibold text-gray-900 dark:text-white">Yhteensä:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{generatedQuote.pricing.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => downloadQuotePDF(generatedQuote)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-3 rounded-lg font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Lataa tarjous (HTML)
              </button>
              <button
                onClick={handleNewQuote}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
              >
                Sulje
              </button>
            </div>
          </div>
        ) : (
          // Form View
          <>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 id="quote-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Pyydä tarjous</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
                aria-label="Sulje"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modelData && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Mallin yhteenveto</h3>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
                  <p><strong>Tiedosto:</strong> {modelData.fileName}</p>
                  <p><strong>Materiaali:</strong> {modelData.material ? materialNames[modelData.material] || 'Ei valittu' : 'Ei valittu'}</p>
                  <p><strong>Koko:</strong> {modelData.scale}%</p>
                  <p><strong>Kolmiot:</strong> {modelData.triangles.toLocaleString()}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nimi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  } rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Matti Meikäläinen"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sähköposti <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  } rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="matti@esimerkki.fi"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Puhelin
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  } rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="+358 40 123 4567"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && <p id="phone-error" className="mt-1 text-xs text-red-500" role="alert">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yritys
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Yrityksen nimi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Määrä (kpl)
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aikataulu
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Valitse...</option>
                    <option value="urgent">Kiireellinen (1-3 pv)</option>
                    <option value="normal">Normaali (1-2 vk)</option>
                    <option value="flexible">Joustava (2+ vk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lisätiedot
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Kerro projektistasi tarkemmin..."
                />
              </div>

              {submitStatus === 'error' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Virhe lähetyksessä. Yritä uudelleen tai ota yhteyttä suoraan.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.01] disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Lähetetään...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    Lähetä tarjouspyyntö
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Tietojasi käsitellään luottamuksellisesti.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
