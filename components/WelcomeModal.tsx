import React, { useEffect, useRef, useState } from 'react';
import { Upload, Play, X } from 'lucide-react';
import { SignUpModal } from './SignUpModal';
import { SignInModal } from './SignInModal';
import { EmailVerificationModal } from './EmailVerificationModal';
import { useAuth } from '../contexts/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

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
  const { user, loading: authLoading } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [showAuthModal, setShowAuthModal] = useState<'signup' | 'signin' | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  // Auto-close welcome modal when user signs in
  useEffect(() => {
    if (user && isOpen) {
      console.log('✅ User signed in, closing welcome modal');
      setShowAuthModal(null);
      if (onClose) onClose();
    }
  }, [user, isOpen, onClose]);

  // Use the custom focus trap hook for accessible keyboard navigation
  useFocusTrap(modalRef, {
    isActive: isOpen && !showAuthModal && !showVerification,
    onEscape: onClose,
    restoreFocus: true,
  });

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (onClose) onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative glass-heavy rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 animate-scale-in border border-gray-200/50 dark:border-slate-700/50"
        onClick={handleModalClick}
      >
        {/* Loading Overlay - Show while checking auth or after sign out */}
        {authLoading && (
          <div className="absolute inset-0 glass-heavy rounded-2xl z-50 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Loading...</p>
          </div>
        )}

        {/* Close Button (if onClose provided) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-xl hover:bg-gray-100/80 dark:hover:bg-slate-800/80 transition-colors text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            onClick={() => {
              setShowAuthModal('signup');
              // Don't close welcome modal yet, user might cancel
            }}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 min-h-[56px]"
          >
            <Upload className="w-5 h-5" />
            Sign Up / Sign In
          </button>

          <button
            onClick={onTrySample}
            className="w-full flex items-center justify-center gap-3 glass hover:bg-gray-100/50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300 px-6 py-4 rounded-xl font-semibold border border-gray-200/60 dark:border-slate-600/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-slate-900 min-h-[56px]"
          >
            <Play className="w-5 h-5" />
            Try with Sample
          </button>
        </div>
      </div>

      {/* Auth Modals */}
      <SignUpModal
        isOpen={showAuthModal === 'signup'}
        onClose={() => setShowAuthModal(null)}
        onSwitchToSignIn={() => setShowAuthModal('signin')}
        onSuccess={() => {
          // Store email for verification modal
          const emailInput = document.querySelector<HTMLInputElement>('input[type="email"]');
          if (emailInput) {
            setSignupEmail(emailInput.value);
          }
          setShowAuthModal(null);
          setShowVerification(true);
        }}
      />

      <SignInModal
        isOpen={showAuthModal === 'signin'}
        onClose={() => setShowAuthModal(null)}
        onSwitchToSignUp={() => setShowAuthModal('signup')}
        onSuccess={() => {
          setShowAuthModal(null);
          if (onClose) onClose(); // Close welcome modal after sign in
          onGetQuote(); // Proceed to main app
        }}
      />

      <EmailVerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        email={signupEmail}
      />
    </div>
  );
};
