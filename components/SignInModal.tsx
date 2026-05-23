import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// tokens.css owned by epic 02-admin-branding — this component is a read-only consumer
// of --color-* aliases (set up in index.html :root from the canonical token values).
// Font families via var(--mono) / var(--serif) (bare brand tokens, not color namespace).

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onSuccess: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onSuccess,
}) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + ESC handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSubmitting) onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Move focus into dialog on open
    const raf = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      const firstInput = dialog?.querySelector<HTMLElement>('input');
      firstInput?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(raf);
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Anna sähköpostiosoitteesi');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Anna kelvollinen sähköpostiosoite');
      return false;
    }
    if (!formData.password) {
      setError('Anna salasanasi');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { error: signInError } = await signIn({
        email: formData.email,
        password: formData.password,
      });
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Virheellinen sähköposti tai salasana');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Vahvista sähköpostisi ennen kirjautumista. Tarkista postilaatikkosi.');
        } else {
          setError(signInError.message || 'Kirjautuminen epäonnistui');
        }
        setIsSubmitting(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsSubmitting(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Odottamaton virhe');
      setIsSubmitting(false);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => e.stopPropagation();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(26,26,26,0.55)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-modal-title"
        onClick={handleModalClick}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--color-paper)',
          border: '2px solid var(--color-ink)',
          borderRadius: 0,
          boxShadow: '8px 8px 0 var(--color-ink)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '2px solid var(--color-accent)',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ink)',
                opacity: 0.7,
              }}
            >
              DTF STUDIO HELSINKI
            </p>
            {/* Branded Finnish label — Kirjaudu */}
            <h2
              id="signin-modal-title"
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--serif)',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}
            >
              Kirjaudu sisään
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Sulje"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              opacity: isSubmitting ? 0.4 : 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-paper-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form — noValidate so custom Finnish validation fires first */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: '20px 24px 24px' }}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="si-email"
              style={{
                display: 'block',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ink)',
                marginBottom: '6px',
              }}
            >
              Sähköposti <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <input
              type="email"
              id="si-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="sinä@esimerkki.fi"
              disabled={isSubmitting}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--color-field)',
                border: '2px solid var(--color-ink)',
                borderRadius: 0,
                fontFamily: 'var(--serif)',
                fontSize: '15px',
                color: 'var(--color-ink)',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.outline = '2px solid var(--color-accent)')}
              onBlur={e => (e.currentTarget.style.outline = 'none')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="si-password"
              style={{
                display: 'block',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ink)',
                marginBottom: '6px',
              }}
            >
              Salasana <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <input
              type="password"
              id="si-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--color-field)',
                border: '2px solid var(--color-ink)',
                borderRadius: 0,
                fontFamily: 'var(--serif)',
                fontSize: '15px',
                color: 'var(--color-ink)',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.outline = '2px solid var(--color-accent)')}
              onBlur={e => (e.currentTarget.style.outline = 'none')}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                background: 'var(--color-paper-2)',
                borderLeft: '3px solid var(--color-accent)',
                marginBottom: '16px',
              }}
            >
              <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--color-accent)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--color-ink)', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Submit — primary CTA: Kirjaudu */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              padding: '12px 18px',
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              border: '2px solid var(--color-ink)',
              borderRadius: 0,
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                LADATAAN…
              </>
            ) : (
              <>KIRJAUDU</>
            )}
          </button>

          {/* Switch to Sign Up */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '16px',
              marginBottom: 0,
              fontFamily: 'var(--serif)',
              fontSize: '14px',
              color: 'var(--color-ink-soft)',
            }}
          >
            Ei vielä tiliä?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              disabled={isSubmitting}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-accent)',
                fontFamily: 'var(--serif)',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                cursor: 'pointer',
                padding: 0,
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Rekisteröidy
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
