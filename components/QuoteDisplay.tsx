import React from 'react';
import { CheckCircle, Download, Mail, X } from 'lucide-react';
import type { QuoteData } from './QuoteForm';

interface Quote {
  quoteId: string;
  modelName: string;
  email: string;
  quoteData: QuoteData;
  pricing: {
    materialCost: number;
    finishCost: number;
    baseCost: number;
    total: number;
  };
  estimatedDelivery: string;
  createdAt: string;
}

interface QuoteDisplayProps {
  isOpen: boolean;
  quote: Quote;
  onClose: () => void;
  onNewQuote: () => void;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  isOpen,
  quote,
  onClose,
  onNewQuote,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDownloadQuote = () => {
    // Create a simple text representation of the quote
    const quoteText = `
HEXEA FORGE - PRODUCTION QUOTE
================================

Quote ID: ${quote.quoteId}
Date: ${quote.createdAt}
Model: ${quote.modelName}
Email: ${quote.email}

SPECIFICATIONS
--------------
Material: ${quote.quoteData.material.toUpperCase()}
Scale: ${quote.quoteData.scale}%
Quantity: ${quote.quoteData.quantity}
Finish: ${quote.quoteData.finishType}
${quote.quoteData.notes ? `Notes: ${quote.quoteData.notes}` : ''}

PRICING BREAKDOWN
-----------------
Base Cost:        ${formatCurrency(quote.pricing.baseCost)}
Material Cost:    ${formatCurrency(quote.pricing.materialCost)}
Finish Cost:      ${formatCurrency(quote.pricing.finishCost)}
-----------------
TOTAL:            ${formatCurrency(quote.pricing.total)}

Estimated Delivery: ${quote.estimatedDelivery}

Thank you for choosing Hexea Forge!
    `.trim();

    const blob = new Blob([quoteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hexea-quote-${quote.quoteId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-200 dark:border-slate-700">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200 dark:border-green-800 px-6 py-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quote Generated!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quote ID: <span className="font-mono font-semibold">{quote.quoteId}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Quote Details */}
        <div className="p-6 space-y-6">
          {/* Email Confirmation */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="text-blue-900 dark:text-blue-100 font-medium">
                Quote sent to your email
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                {quote.email}
              </p>
            </div>
          </div>

          {/* Model Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Model Details
            </h4>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Model Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{quote.modelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Material:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{quote.quoteData.material.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Scale:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{quote.quoteData.scale}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{quote.quoteData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Finish:</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">{quote.quoteData.finishType}</span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Pricing Breakdown
            </h4>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Base Cost:</span>
                <span>{formatCurrency(quote.pricing.baseCost)}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Material Cost:</span>
                <span>{formatCurrency(quote.pricing.materialCost)}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Finish Cost:</span>
                <span>{formatCurrency(quote.pricing.finishCost)}</span>
              </div>
              <div className="border-t border-gray-300 dark:border-slate-600 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(quote.pricing.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Estimated Delivery:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{quote.estimatedDelivery}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadQuote}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold border-2 border-gray-300 dark:border-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              <Download className="w-5 h-5" />
              Download Quote
            </button>
            <button
              onClick={onNewQuote}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              New Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
