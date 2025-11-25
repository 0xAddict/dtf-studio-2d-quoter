import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Download, CheckCircle } from 'lucide-react';
import { uploadMultipleFiles } from '../services/supabase/storage';
import { useQuoteRequests } from '../services/supabase/hooks';
import { saveQuote } from '../services/supabase/quotes';
import { useAuth } from '../contexts/AuthContext';

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
  modelFile?: File | null;
  userInfo?: {
    name: string;
    email: string;
  };
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  quantity: string;
  timeline: string;
  finishing: string;
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
    finishing: string;
    vertices: number;
    triangles: number;
    dimensions: { x: string; y: string; z: string };
  };
  pricing: {
    baseCost: number;
    materialCost: number;
    finishingCost: number;
    quantityDiscount: number;
    total: number;
  };
}

const materialNames: Record<string, string> = {
  'asa': 'ASA - Durable and weather-resistant',
  'tpu': 'TPU - Flexible rubber-like',
  'pla': 'PLA - Affordable',
  'petg': 'PETG - Durable and tough',
  'nylon-carbon': 'Nylon + carbon fiber',
  'resin-standard': 'Resin - ABS-type',
  'resin-clear': 'Resin - Clear',
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

const finishingPrices: Record<string, number> = {
  'standard': 0,
  'smooth': 15,
  'painted': 30,
  'premium': 50,
};

export const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({ isOpen, onClose, modelData, modelFile, userInfo }) => {
  const { user } = useAuth();
  const { submitQuote } = useQuoteRequests();

  const [formData, setFormData] = useState<FormData>({
    name: userInfo?.name || user?.name || '',
    email: userInfo?.email || user?.email || '',
    phone: '',
    company: '',
    quantity: '1',
    timeline: '',
    finishing: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generatedQuote, setGeneratedQuote] = useState<QuoteData | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Pre-populate form with userInfo or authenticated user
  useEffect(() => {
    const name = userInfo?.name || user?.name || '';
    const email = userInfo?.email || user?.email || '';

    setFormData(prev => ({
      ...prev,
      name,
      email,
    }));
  }, [userInfo, user]);

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
    const finishingCost = formData.finishing
      ? (finishingPrices[formData.finishing] || 0) * quantity
      : 0;
    const quantityDiscount = quantity >= 10 ? materialCost * 0.15 : quantity >= 5 ? materialCost * 0.10 : 0;
    const total = baseCost + materialCost + finishingCost - quantityDiscount;

    return {
      quoteId: `HF-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString('en-US'),
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || 'Not provided',
        company: formData.company || '-',
      },
      modelInfo: {
        fileName: modelData?.fileName || 'Unknown',
        material: modelData?.material ? materialNames[modelData.material] || modelData.material : 'Not selected',
        scale: modelData?.scale || 100,
        quantity,
        timeline: formData.timeline || 'Not specified',
        finishing: formData.finishing || 'Standard',
        vertices: modelData?.vertices || 0,
        triangles: modelData?.triangles || 0,
        dimensions: modelData?.dimensions || { x: '0', y: '0', z: '0' },
      },
      pricing: {
        baseCost,
        materialCost,
        finishingCost,
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
  <title>Quote ${quote.quoteId}</title>
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
    <div class="quote-id">Quote #${quote.quoteId}</div>
    <div class="quote-id">Date: ${quote.date}</div>
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="info-grid">
      <div class="info-row">
        <span class="label">Name:</span>
        <span class="value">${quote.customer.name}</span>
      </div>
      <div class="info-row">
        <span class="label">Company:</span>
        <span class="value">${quote.customer.company}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${quote.customer.email}</span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span class="value">${quote.customer.phone}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Model Details</div>
    <div class="info-grid">
      <div class="info-row">
        <span class="label">File:</span>
        <span class="value">${quote.modelInfo.fileName}</span>
      </div>
      <div class="info-row">
        <span class="label">Material:</span>
        <span class="value">${quote.modelInfo.material}</span>
      </div>
      <div class="info-row">
        <span class="label">Scale:</span>
        <span class="value">${quote.modelInfo.scale}%</span>
      </div>
      <div class="info-row">
        <span class="label">Quantity:</span>
        <span class="value">${quote.modelInfo.quantity} pcs</span>
      </div>
      <div class="info-row">
        <span class="label">Timeline:</span>
        <span class="value">${quote.modelInfo.timeline}</span>
      </div>
      <div class="info-row">
        <span class="label">Finishing:</span>
        <span class="value">${quote.modelInfo.finishing}</span>
      </div>
      <div class="info-row">
        <span class="label">Triangles:</span>
        <span class="value">${quote.modelInfo.triangles.toLocaleString()}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Pricing</div>
    <div class="pricing-table">
      <div class="pricing-row">
        <span>Base Price</span>
        <span>${quote.pricing.baseCost.toFixed(2)} €</span>
      </div>
      <div class="pricing-row">
        <span>Material (${quote.modelInfo.quantity} pcs)</span>
        <span>${quote.pricing.materialCost.toFixed(2)} €</span>
      </div>
      ${quote.pricing.finishingCost > 0 ? `
      <div class="pricing-row">
        <span>Finishing (${quote.modelInfo.quantity} pcs)</span>
        <span>${quote.pricing.finishingCost.toFixed(2)} €</span>
      </div>
      ` : ''}
      ${quote.pricing.quantityDiscount > 0 ? `
      <div class="pricing-row discount">
        <span>Quantity Discount</span>
        <span>-${quote.pricing.quantityDiscount.toFixed(2)} €</span>
      </div>
      ` : ''}
      <div class="pricing-row total">
        <span>TOTAL (VAT 0%)</span>
        <span>${quote.pricing.total.toFixed(2)} €</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Hexea Forge - 3D Printing Services</p>
    <p>Quote valid for 30 days</p>
    <p>Prices do not include VAT</p>
  </div>
</body>
</html>
    `.trim();

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hexea-quote-${quote.quoteId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.phone && !/^[+]?[\d\s-]{6,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
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

      // Upload model file to Supabase if available
      let attachmentUrls: string[] = [];
      if (modelFile) {
        setUploadingFiles(true);
        try {
          const uploadResults = await uploadMultipleFiles(
            [modelFile],
            'ATTACHMENTS',
            `quotes/${quote.quoteId}`
          );

          // Filter successful uploads and get URLs
          attachmentUrls = uploadResults
            .filter(result => result.url && !result.error)
            .map(result => result.url);

          // Log upload results for debugging
          if (attachmentUrls.length > 0) {
            console.log('Model file uploaded successfully:', attachmentUrls[0]);
          } else {
            console.warn('Model file upload failed:', uploadResults);
          }

          setUploadingFiles(false);
        } catch (uploadError) {
          console.error('Error uploading model file:', uploadError);
          setUploadingFiles(false);
          // Continue with quote submission even if upload fails
        }
      } else {
        console.warn('No model file to upload with quote');
      }

      // Save quote to database (quote_requests table - for ALL quotes)
      // Includes user_id for authenticated users, null for anonymous
      try {
        const quoteData = {
          user_id: user?.id || null,
          quote_id: quote.quoteId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          quantity: parseInt(formData.quantity),
          material: modelData?.material ? materialNames[modelData.material] || modelData.material : 'Not specified',
          timeline: formData.timeline || null,
          finishing: formData.finishing || null,
          scale: modelData?.scale || 100,
          notes: formData.message || null,
          // Model file info
          model_file_name: modelData?.fileName || null,
          model_file_url: attachmentUrls[0] || null,
          // Model stats
          vertices: modelData?.vertices || null,
          triangles: modelData?.triangles || null,
          dimensions: modelData?.dimensions ? JSON.stringify(modelData.dimensions) : null,
          // Pricing breakdown
          base_cost: quote.pricing.baseCost,
          material_cost: quote.pricing.materialCost,
          finishing_cost: quote.pricing.finishingCost,
          quantity_discount: quote.pricing.quantityDiscount,
          total_cost: quote.pricing.total,
          // Keep model_data for backward compatibility with WordPress plugin
          model_data: JSON.stringify({
            quoteId: quote.quoteId,
            fileName: modelData?.fileName,
            material: modelData?.material ? materialNames[modelData.material] || modelData.material : 'Not specified',
            scale: modelData?.scale,
            quantity: parseInt(formData.quantity),
            timeline: formData.timeline,
            finishing: formData.finishing,
            vertices: modelData?.vertices,
            triangles: modelData?.triangles,
            dimensions: modelData?.dimensions,
            pricing: quote.pricing,
            attachmentUrl: attachmentUrls[0] || null,
          }),
        };

        const { data: savedQuote, error: saveError } = await submitQuote(quoteData);

        if (saveError) {
          console.error('Error saving quote to database:', saveError);
          // Don't fail - continue with email submission
        } else {
          console.log('Quote saved to database successfully:', savedQuote);
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue with email submission
      }

      // Prepare model info for the email
      const modelInfo = modelData ? `
Model Details:
- File: ${modelData.fileName}
- Material: ${modelData.material ? materialNames[modelData.material] || modelData.material : 'Not selected'}
- Scale: ${modelData.scale}%
- Quantity: ${formData.quantity} pcs
- Timeline: ${formData.timeline || 'Not specified'}
- Finishing: ${formData.finishing || 'Standard'}
- Vertices: ${modelData.vertices.toLocaleString()}
- Triangles: ${modelData.triangles.toLocaleString()}
- Dimensions (original): X: ${modelData.dimensions.x}, Y: ${modelData.dimensions.y}, Z: ${modelData.dimensions.z}

Pricing:
- Base Price: ${quote.pricing.baseCost.toFixed(2)} €
- Material Cost: ${quote.pricing.materialCost.toFixed(2)} €
${quote.pricing.finishingCost > 0 ? `- Finishing Cost: ${quote.pricing.finishingCost.toFixed(2)} €\n` : ''}${quote.pricing.quantityDiscount > 0 ? `- Quantity Discount: -${quote.pricing.quantityDiscount.toFixed(2)} €\n` : ''}- Total: ${quote.pricing.total.toFixed(2)} €
      `.trim() : 'No model loaded';

      // Prepare model file link for email
      const attachmentLinks = attachmentUrls.length > 0
        ? `\n\nModel File Download:\n${attachmentUrls[0]}`
        : '';

      // Send to Web3Forms
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: 'ad897559-e4df-411a-bcb7-086c366bf81f',
          subject: `New Quote Request #${quote.quoteId} - ${formData.name}`,
          from_name: 'Hexea Forge',
          name: formData.name,
          email: formData.email,
          phone: formData.phone || 'Not provided',
          company: formData.company || 'Not provided',
          quantity: formData.quantity,
          timeline: formData.timeline || 'Not specified',
          finishing: formData.finishing || 'Standard',
          message: formData.message || 'No additional information',
          model_info: modelInfo + attachmentLinks,
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
      setUploadingFiles(false);
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
      name: userInfo?.name || '',
      email: userInfo?.email || '',
      phone: '',
      company: '',
      quantity: '1',
      timeline: '',
      finishing: '',
      message: '',
    });
    setGeneratedQuote(null);
    setSubmitStatus('idle');
    onClose();
  };

  // Helper to get tooltip message for disabled button
  const getDisabledButtonTooltip = () => {
    const missing: string[] = [];
    if (!modelData?.material) missing.push('Material');
    if (!formData.timeline) missing.push('Timeline');
    if (!formData.finishing) missing.push('Finishing');

    if (missing.length === 0) return '';
    return `Please fill required fields: ${missing.join(', ')}`;
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
                Quote Sent!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your quote #{generatedQuote.quoteId} has been sent to your email
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Quote Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Material:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{generatedQuote.modelInfo.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{generatedQuote.modelInfo.quantity} pcs</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-200 dark:border-indigo-800">
                  <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
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
                Download Quote (HTML)
              </button>
              <button
                onClick={handleNewQuote}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          // Form View
          <>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 id="quote-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Request Quote</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modelData && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Model Summary</h3>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
                  <p><strong>File:</strong> {modelData.fileName}</p>
                  <p><strong>Material:</strong> {modelData.material ? materialNames[modelData.material] || 'Not selected' : 'Not selected'}</p>
                  <p><strong>Scale:</strong> {modelData.scale}%</p>
                  <p><strong>Triangles:</strong> {modelData.triangles.toLocaleString()}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
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
                  placeholder="John Smith"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
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
                  placeholder="john@example.com"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
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
                  placeholder="+1 234 567 8900"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && <p id="phone-error" className="mt-1 text-xs text-red-500" role="alert">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Company name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity (pcs)
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
                    Timeline <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="urgent">Urgent (1-3 days)</option>
                    <option value="normal">Normal (1-2 weeks)</option>
                    <option value="flexible">Flexible (2+ weeks)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="finishing" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Finishing <span className="text-red-500">*</span>
                </label>
                <select
                  id="finishing"
                  name="finishing"
                  value={formData.finishing}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select...</option>
                  <option value="standard">Standard (No additional cost)</option>
                  <option value="smooth">Smooth (+€15 per piece)</option>
                  <option value="painted">Painted (+€30 per piece)</option>
                  <option value="premium">Premium Finish (+€50 per piece)</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Information
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell us more about your project..."
                />
              </div>

              {submitStatus === 'error' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Submission error. Please try again or contact us directly.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || uploadingFiles || !modelData?.material || !formData.timeline || !formData.finishing}
                title={getDisabledButtonTooltip()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.01] disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {uploadingFiles ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Uploading files...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    Send Quote Request
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Your information will be handled confidentially.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
