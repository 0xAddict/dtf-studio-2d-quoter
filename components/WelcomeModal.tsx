import React, { useEffect, useRef, useState } from 'react';
import { Upload, Play, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onGetQuote: (name: string, email: string) => void;
  onTrySample: () => void;
  onClose?: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onGetQuote,
  onTrySample,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Get all focusable elements within the modal
    const getFocusableElements = () => {
      return modalElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key handler
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      // Tab key handler
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetQuote = () => {
    if (validateForm()) {
      onGetQuote(name, email);
    }
  };

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
      <div
        ref={modalRef}
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

        {/* User Info Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="welcome-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="welcome-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              } rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="John Smith"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'welcome-name-error' : undefined}
            />
            {errors.name && <p id="welcome-name-error" className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="welcome-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="welcome-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              } rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="john@example.com"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'welcome-email-error' : undefined}
            />
            {errors.email && <p id="welcome-email-error" className="mt-1 text-xs text-red-500" role="alert">{errors.email}</p>}
          </div>
        </div>

        {/* CTA Message */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 mb-6 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Get started with a quote</span>
            <br />
            Or try our sample file to explore the viewer.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGetQuote}
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
    </div>
  );
};
