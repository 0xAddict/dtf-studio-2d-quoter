/**
 * AdminLayout — shared chrome for all /admin/* pages.
 * Brand: Paper #f4e4bc, Ink #1a1a1a, Crimson #b22222
 * Source Serif 4 (body) + IBM Plex Mono (kickers/labels)
 * 2px heavy edges, no gradients, no rounded-full.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Yleiskatsaus', exact: true },
  { href: '/admin/orders', label: 'Tilaukset' },
  { href: '/admin/customers', label: 'Asiakkaat' },
  { href: '/admin/files', label: 'Tiedostot' },
  { href: '/admin/notifications', label: 'Ilmoitukset' },
  { href: '/admin/quotes/new', label: 'Uusi tarjous' },
] as const;

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  function isActive(href: string, exact = false): boolean {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4e4bc',
        fontFamily: "'Source Serif 4', Georgia, serif",
        color: '#1a1a1a',
      }}
    >
      {/* Top nav bar */}
      <header
        style={{
          borderBottom: '2px solid #1a1a1a',
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '52px',
        }}
      >
        {/* Brand + admin label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/admin"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#f4e4bc',
              textDecoration: 'none',
            }}
          >
            DTF Studio
          </Link>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#b22222',
              border: '1px solid #b22222',
              padding: '1px 6px',
            }}
          >
            Admin
          </span>
        </div>

        {/* User + sign out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            color: '#e8d8b0',
          }}
        >
          <span>{user?.email}</span>
          <button
            onClick={() => signOut()}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#e8d8b0',
              background: 'transparent',
              border: '1px solid #e8d8b0',
              padding: '3px 10px',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '28px',
            }}
          >
            Kirjaudu ulos
          </button>
        </div>
      </header>

      {/* Secondary nav */}
      <nav
        style={{
          borderBottom: '1px solid #1a1a1a',
          background: '#e8d8b0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '0',
          overflowX: 'auto',
        }}
      >
        {NAV_ITEMS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              to={href}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: active ? '#b22222' : '#1a1a1a',
                padding: '12px 16px',
                borderBottom: active ? '2px solid #b22222' : '2px solid transparent',
                whiteSpace: 'nowrap',
                display: 'flex',
                minHeight: '44px',
                alignItems: 'center',
              } as React.CSSProperties}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      <main style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
};
