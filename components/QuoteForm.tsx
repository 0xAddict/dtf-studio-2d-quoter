import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

interface QuoteFormProps {
  isOpen: boolean;
  modelName: string;
  onSubmit: (quoteData: QuoteData) => void;
  onClose: () => void;
}

export interface QuoteData {
  material: string;
  scale: number;
  quantity: number;
  finishType: string;
  notes: string;
}

const materials = [
  { value: 'pla', label: 'PLA (Biodegradable)', price: 0.05 },
  { value: 'abs', label: 'ABS (Durable)', price: 0.08 },
  { value: 'petg', label: 'PETG (Strong & Flexible)', price: 0.10 },
  { value: 'nylon', label: 'Nylon (Industrial)', price: 0.15 },
  { value: 'resin', label: 'Resin (High Detail)', price: 0.20 },
  { value: 'metal', label: 'Metal (Premium)', price: 0.50 },
];

const finishes = [
  { value: 'standard', label: 'Standard' },
  { value: 'smooth', label: 'Smoothed & Polished' },
  { value: 'painted', label: 'Painted' },
  { value: 'premium', label: 'Premium Finish' },
];

export const QuoteForm: React.FC<QuoteFormProps> = ({
  isOpen,
  modelName,
  onSubmit,
  onClose,
}) => {
  const [material, setMaterial] = useState('pla');
  const [scale, setScale] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [finishType, setFinishType] = useState('standard');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      material,
      scale,
      quantity,
      finishType,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Request a Quote
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Model: <span className="font-medium text-indigo-600 dark:text-indigo-400">{modelName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Material Selection */}
          <div>
            <label htmlFor="material" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Material
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {materials.map((mat) => (
                <label
                  key={mat.value}
                  className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    material === mat.value
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="material"
                    value={mat.value}
                    checked={material === mat.value}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{mat.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">${mat.price}/cm³</div>
                  </div>
                  {material === mat.value && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <label htmlFor="scale" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Scale: <span className="text-indigo-600 dark:text-indigo-400">{scale}%</span>
            </label>
            <input
              type="range"
              id="scale"
              min="10"
              max="200"
              step="10"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>10%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max="1000"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>

          {/* Finish Type */}
          <div>
            <label htmlFor="finish" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Finish Type
            </label>
            <select
              id="finish"
              value={finishType}
              onChange={(e) => setFinishType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              {finishes.map((finish) => (
                <option key={finish.value} value={finish.value}>
                  {finish.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special requirements or questions..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
          >
            <Send className="w-5 h-5" />
            Get Instant Quote
          </button>
        </form>
      </div>
    </div>
  );
};
