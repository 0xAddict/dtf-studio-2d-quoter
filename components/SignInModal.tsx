import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onSuccess: () => void;
}

const PAPER = '#f4e4bc';
const PAPER_2 = '#e8d8b0';
const FIELD = '#fbf2d6';
const INK = '#1a1a1a';
const INK_SOFT = '#44423d';
const CRIMSON = '#b22222';
const SERIF = "'Source Serif 4','Source Serif Pro',Georgia,serif";
const MONO = "'IBM Plex Mono','Courier New',monospace";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Anna sähköpostiosoitteesi');
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

  const handleBackdropClick = () => {
    // Click-outside disabled — user must close via X or complete sign-in
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
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-modal-title"
        onClick={handleModalClick}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: PAPER,
          border: `2px solid ${INK}`,
          borderRadius: 0,
          boxShadow: `8px 8px 0 ${INK}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: `2px solid ${CRIMSON}`,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: MONO,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: INK,
                opacity: 0.7,
              }}
            >
              DTF STUDIO HELSINKI
            </p>
            <h2
              id="signin-modal-title"
              style={{
                margin: '4px 0 0',
                fontFamily: SERIF,
                fontSize: '24px',
                fontWeight: 600,
                color: INK,
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
              color: INK,
              cursor: 'pointer',
              opacity: isSubmitting ? 0.4 : 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = PAPER_2)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontFamily: MONO,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: INK,
                marginBottom: '6px',
              }}
            >
              Sähköposti <span style={{ color: CRIMSON }}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="sinä@esimerkki.fi"
              required
              disabled={isSubmitting}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                background: FIELD,
                border: `2px solid ${INK}`,
                borderRadius: 0,
                fontFamily: SERIF,
                fontSize: '15px',
                color: INK,
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.outline = `2px solid ${CRIMSON}`)}
              onBlur={e => (e.currentTarget.style.outline = 'none')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontFamily: MONO,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: INK,
                marginBottom: '6px',
              }}
            >
              Salasana <span style={{ color: CRIMSON }}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: FIELD,
                border: `2px solid ${INK}`,
                borderRadius: 0,
                fontFamily: SERIF,
                fontSize: '15px',
                color: INK,
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.outline = `2px solid ${CRIMSON}`)}
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
                background: PAPER_2,
                borderLeft: `3px solid ${CRIMSON}`,
                marginBottom: '16px',
              }}
            >
              <AlertCircle style={{ width: '18px', height: '18px', color: CRIMSON, flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontFamily: MONO, fontSize: '12px', color: INK, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
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
              background: INK,
              color: PAPER,
              border: `2px solid ${INK}`,
              borderRadius: 0,
              fontFamily: MONO,
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
              <>KIRJAUDU SISÄÄN</>
            )}
          </button>

          {/* Switch to Sign Up */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '16px',
              marginBottom: 0,
              fontFamily: SERIF,
              fontSize: '14px',
              color: INK_SOFT,
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
                color: CRIMSON,
                fontFamily: SERIF,
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
