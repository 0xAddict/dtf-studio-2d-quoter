import React, { useState, useEffect } from 'react';
import FocusLock from 'react-focus-lock';
import { Mail, ArrowRight, CheckCircle, Loader } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onVerified: (email: string) => void;
  onClose: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onVerified,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit email to Web3Forms for capture
      const formData = new FormData();
      formData.append('access_key', 'a82cd435-98b5-4787-a9e9-1476be34ece4');
      formData.append('email', email);
      formData.append('subject', 'New Quote Request - Hexea Forge');
      formData.append('from_name', 'Hexea Forge');
      formData.append('message', `New user signed up for quotes: ${email}`);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit email');
      }

      console.log('[EMAIL] Successfully submitted to Web3Forms:', result);

      // Show verification success
      setIsSubmitting(false);
      setIsVerifying(true);

      // Show success message briefly
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call onVerified callback
      onVerified(email);
    } catch (err: any) {
      console.error('[EMAIL] Error submitting to Web3Forms:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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
      <FocusLock returnFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-verification-title"
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-scale-in border border-gray-200 dark:border-slate-700"
          onClick={handleModalClick}
        >
          {/* Close button */}
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
            // Verification Success State
            <div className="text-center py-8" role="status" aria-live="polite">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting you to the viewer...
              </p>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 p-4 rounded-2xl shadow-lg">
                  <Mail className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
              </div>

              {/* Title */}
              <h2 id="email-verification-title" className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                Verify Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 text-sm leading-relaxed">
                Enter your email to get started with your quote
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    aria-describedby={error ? "email-error" : undefined}
                    aria-invalid={!!error}
                    aria-required="true"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div
                    id="email-error"
                    role="alert"
                    className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    {error}
                  </div>
                )}

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
      </FocusLock>
    </div>
  );
};
