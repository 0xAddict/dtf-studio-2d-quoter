import React, { useEffect } from 'react';
import FocusLock from 'react-focus-lock';
import { Upload, Play, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onGetQuote: () => void;
  onTrySample: () => void;
  onClose?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onGetQuote,
  onTrySample,
  onClose,
}) => {
  // ESC key handler
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (onClose) onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <FocusLock returnFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 animate-scale-in border border-gray-200 dark:border-slate-700"
          onClick={handleModalClick}
        >
        {/* Close Button (if onClose provided) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close welcome dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Logo/Header */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 p-4 rounded-2xl shadow-lg">
            <img
              src="/hexea.png"
              alt="Hexea Logo"
              className="h-12 w-auto brightness-0 invert object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h1 id="welcome-title" className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          Welcome to Hexea Forge
        </h1>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed">
          Get direct-to-production quotes instantly. Simply provide your 3D model,
          select your scale and materials, and receive a professional quote.
        </p>

        {/* CTA Message */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 mb-6 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">First, confirm your email to get started.</span>
            <br />
            Or try our sample file to explore the viewer.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onGetQuote}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
          >
            <Upload className="w-5 h-5" />
            Get a Quote
          </button>

          <button
            onClick={onTrySample}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-6 py-4 rounded-xl font-semibold border-2 border-gray-300 dark:border-slate-600 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-slate-900"
          >
            <Play className="w-5 h-5" />
            Try with Sample
          </button>
        </div>
      </div>
      </FocusLock>
    </div>
  );
};
