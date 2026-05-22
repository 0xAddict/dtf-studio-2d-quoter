/**
 * RequireAdmin — Route guard for /admin/* routes.
 * Reads app_metadata.role === 'admin' from the Supabase session JWT.
 * No DB round-trip — JWT claim only (fast, no extra latency).
 *
 * Behaviour:
 *   - No session     → redirect /login?next=<current path>
 *   - Session, not admin → redirect / + toast "Admin access required"
 *   - Session, admin → render children
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireAdminProps {
  children: React.ReactNode;
}

function isAdminSession(session: { user?: { app_metadata?: { role?: string } } } | null): boolean {
  if (!session) return false;
  return session.user?.app_metadata?.role === 'admin';
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  // While auth is resolving, show minimal branded loader
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4e4bc',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1a1a1a',
        }}
      >
        Ladataan...
      </div>
    );
  }

  // No session → redirect to / (home opens sign-in modal) with return path in state
  if (!session) {
    return <Navigate to="/" replace state={{ signInRequired: true, next: location.pathname + location.search }} />;
  }

  // Session exists but not admin → redirect home
  if (!isAdminSession(session)) {
    return <Navigate to="/" replace state={{ adminDenied: true }} />;
  }

  // Admin confirmed — render
  return <>{children}</>;
};

export { isAdminSession };
