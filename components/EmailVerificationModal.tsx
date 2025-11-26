import React, { useState } from 'react';
import { X, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { resendVerificationEmail } from '../services/supabase/auth';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const { error } = await resendVerificationEmail(email);

      if (error) {
        setResendError(error.message || 'Failed to resend email');
        setIsResending(false);
        return;
      }

      setResendSuccess(true);
      setIsResending(false);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err: any) {
      setResendError(err.message || 'An unexpected error occurred');
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-modal-title"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 id="verification-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Check Your Email
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verification Email Sent!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a verification link to:
            </p>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>What's next?</strong>
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected back and automatically signed in</li>
              <li>Start uploading models and requesting quotes!</li>
            </ol>
          </div>

          {/* Resend Button */}
          <div className="space-y-2">
            <button
              onClick={handleResend}
              disabled={isResending || resendSuccess}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Email sent!
                </>
              ) : (
                <>
                  Didn't receive the email? Resend
                </>
              )}
            </button>

            {resendError && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {resendError}
              </p>
            )}
          </div>

          {/* Note */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-500">
            The verification link will expire in 24 hours.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
