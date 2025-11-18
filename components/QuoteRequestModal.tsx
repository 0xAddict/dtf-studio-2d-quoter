import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

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

const materialNames: Record<string, string> = {
  'asa': 'ASA - Kestävä ja säänkestävä',
  'tpu': 'TPU - Joustava kumimainen',
  'pla': 'PLA - Edullinen',
  'petg': 'PETG - Kestävä ja sitkeä',
  'nylon-carbon': 'Nylon + hiilikuitu',
  'resin-standard': 'Hartsi - ABS-tyyppinen',
  'resin-clear': 'Hartsi - Kirkas',
};

export default function QuoteRequestModal({ isOpen, onClose, modelData }: QuoteRequestModalProps) {
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
      // Prepare model info for the email
      const modelInfo = modelData ? `
Mallin tiedot:
- Tiedosto: ${modelData.fileName}
- Materiaali: ${modelData.material ? materialNames[modelData.material] || modelData.material : 'Ei valittu'}
- Koko: ${modelData.scale}%
- Vertices: ${modelData.vertices.toLocaleString()}
- Triangles: ${modelData.triangles.toLocaleString()}
- Mitat (alkuperäiset): X: ${modelData.dimensions.x}, Y: ${modelData.dimensions.y}, Z: ${modelData.dimensions.z}
      `.trim() : 'Ei mallia ladattu';

      // Using Web3Forms for email sending (free tier: 250 emails/month)
      // Replace YOUR_ACCESS_KEY with your actual Web3Forms access key
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: 'YOUR_WEB3FORMS_ACCESS_KEY', // TODO: Replace with actual key
          subject: `Uusi tarjouspyyntö - ${formData.name}`,
          from_name: 'Hexea 3D Viewer',
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
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            company: '',
            quantity: '1',
            timeline: '',
            message: '',
          });
          setSubmitStatus('idle');
          onClose();
        }, 2000);
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
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pyydä tarjous</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Sulje"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Summary */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
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
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
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
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Phone */}
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
            />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Company */}
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

          {/* Quantity & Timeline Row */}
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

          {/* Message */}
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

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                Kiitos! Tarjouspyyntösi on lähetetty. Otamme sinuun yhteyttä pian.
              </p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                Virhe lähetyksessä. Yritä uudelleen tai ota yhteyttä suoraan.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Lähetetään...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Lähetä tarjouspyyntö
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Tietojasi käsitellään luottamuksellisesti.
          </p>
        </form>
      </div>
    </div>
  );
}
