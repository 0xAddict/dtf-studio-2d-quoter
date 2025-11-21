import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, CheckCircle, Loader } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onVerified: (name: string, email: string) => void;
  onClose: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onVerified,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
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

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('access_key', 'a82cd435-98b5-4787-a9e9-1476be34ece4');
      formData.append('name', name);
      formData.append('email', email);
      formData.append('subject', 'New Quote Request - Hexea Forge');
      formData.append('from_name', 'Hexea Forge');
      formData.append('message', `New user signed up for quotes:\nName: ${name}\nEmail: ${email}`);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit information');
      }

      console.log('[EMAIL] Successfully submitted to Web3Forms:', result);

      setIsSubmitting(false);
      setIsVerifying(true);

      await new Promise(resolve => setTimeout(resolve, 1500));

      onVerified(name, email);
    } catch (err: any) {
      console.error('[EMAIL] Error submitting to Web3Forms:', err);
      setErrors({ email: err.message || 'Something went wrong. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = () => {
    onClose();
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
        aria-labelledby="email-verification-title"
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-scale-in border border-gray-200 dark:border-slate-700"
        onClick={handleModalClick}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close email verification dialog"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isVerifying ? (
          <div className="text-center py-8" role="status" aria-live="polite">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting you to the viewer...
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 p-4 rounded-2xl shadow-lg">
                <Mail className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
            </div>

            <h2 id="email-verification-title" className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
              Get Started
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 text-sm leading-relaxed">
              Enter your details to begin your quote
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="John Smith"
                  aria-describedby={errors.name ? "name-error" : undefined}
                  aria-invalid={!!errors.name}
                  aria-required="true"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors`}
                  required
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="mt-1 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="john@example.com"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                  aria-required="true"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors`}
                  required
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.01] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" aria-hidden="true" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4 leading-relaxed">
              By continuing, you agree to receive quote notifications via email
            </p>
          </>
        )}
      </div>
    </div>
  );
};
