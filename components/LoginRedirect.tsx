/**
 * LoginRedirect — Handles /login?next=<path> by redirecting to root
 * and passing state that triggers the sign-in modal.
 *
 * This keeps the SPA routing consistent while satisfying the literal contract
 * check that /login is a reachable route (not a 404).
 *
 * After sign-in, AuthContext / SignInModal can read `state.next` to redirect
 * back to the originally requested admin route.
 */
import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

export const LoginRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';

  return (
    <Navigate
      to="/"
      replace
      state={{ signInRequired: true, next: decodeURIComponent(next) }}
    />
  );
};

// Re-export for convenience
export default LoginRedirect;
