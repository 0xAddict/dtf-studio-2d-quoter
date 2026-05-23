import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// tokens.css owned by epic 02-admin-branding — this component is a read-only consumer
// of --color-* aliases (set up in index.html :root from the canonical token values).

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
  onSuccess: () => void;
}

export const SignUpModal: React.FC<SignUpModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignIn,
  onSuccess,
}) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Anna nimesi');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Anna sähköpostiosoitteesi');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Anna kelvollinen sähköpostiosoite');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Salasanan tulee olla vähintään 8 merkkiä');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Salasanat eivät täsmää');
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
      const { error: signUpError } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      if (signUpError) {
        setError(signUpError.message || 'Tilin luonti epäonnistui');
        setIsSubmitting(false);
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Odottamaton virhe');
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = () => {
    // Click-outside disabled
  };
  const handleModalClick = (e: React.MouseEvent) => e.stopPropagation();

  if (!isOpen) return null;

  // Password strength — uses token-safe color expressions (no hardcoded hex for tokens)
  const getPasswordStrength = () => {
    const p = formData.password;
    if (p.length === 0) return { strength: 0, label: '', colorVar: 'var(--color-paper-2)' };
    if (p.length < 8)  return { strength: 1, label: 'Heikko',     colorVar: 'var(--color-accent)' };
    if (p.length < 12) return { strength: 2, label: 'Kohtalainen', colorVar: '#d4a017' };
    if (p.length < 16) return { strength: 3, label: 'Hyvä',       colorVar: '#2d5a4f' };
    return               { strength: 4, label: 'Vahva',      colorVar: '#1a5a3f' };
  };
  const passwordStrength = getPasswordStrength();

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--color-field)',
    border: '2px solid var(--color-ink)',
    borderRadius: 0,
    fontFamily: 'var(--color-serif)',
    fontSize: '15px',
    color: 'var(--color-ink)',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--color-mono)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--color-ink)',
    marginBottom: '6px',
  };

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
        aria-labelledby="signup-modal-title"
        onClick={handleModalClick}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--color-paper)',
          border: '2px solid var(--color-ink)',
          borderRadius: 0,
          boxShadow: '8px 8px 0 var(--color-ink)',
          maxHeight: '90vh',
          overflowY: 'auto',
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
                fontFamily: 'var(--color-mono)',
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
            {/* Vahvista tilaus — branded Finnish for account creation */}
            <h2
              id="signup-modal-title"
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--color-serif)',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}
            >
              Rekisteröidy
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="name" style={labelStyle}>
              Nimi <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Etunimi Sukunimi"
              required
              disabled={isSubmitting}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.outline = '2px solid var(--color-accent)')}
              onBlur={e => (e.currentTarget.style.outline = 'none')}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={labelStyle}>
              Sähköposti <span style={{ color: 'var(--color-accent)' }}>*</span>
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
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.outline = '2px solid var(--color-accent)')}
              onBlur={e => (e.currentTarget.style.outline = 'none')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="password" style={labelStyle}>
              Salasana <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={8}
              disabled={isSubmitting}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.outline = '2px solid var(--color-accent)')}
              onBlur={e => (e.currentTarget.style.outline = 'none')}
            />
            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      style={{
                        height: '3px',
                        flex: 1,
                        background: level <= passwordStrength.strength ? passwordStrength.colorVar : 'var(--color-paper-2)',
                      }}
                    />
                  ))}
                </div>
                {passwordStrength.label && (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--color-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-ink-soft)',
                    }}
                  >
                    Vahvuus: {passwordStrength.label}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password — Vahvista salasana */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="confirmPassword" style={labelStyle}>
              Vahvista salasana <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              style={inputStyle}
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
              <p style={{ margin: 0, fontFamily: 'var(--color-mono)', fontSize: '12px', color: 'var(--color-ink)', lineHeight: 1.5 }}>{error}</p>
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
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              border: '2px solid var(--color-ink)',
              borderRadius: 0,
              fontFamily: 'var(--color-mono)',
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
              <>LUO TILI</>
            )}
          </button>

          {/* Switch */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '16px',
              marginBottom: 0,
              fontFamily: 'var(--color-serif)',
              fontSize: '14px',
              color: 'var(--color-ink-soft)',
            }}
          >
            Onko jo tili?{' '}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              disabled={isSubmitting}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-accent)',
                fontFamily: 'var(--color-serif)',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                cursor: 'pointer',
                padding: 0,
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Kirjaudu sisään
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
