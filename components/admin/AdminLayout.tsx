/**
 * AdminLayout — shared chrome for all /admin/* pages.
 * Brand tokens: var(--paper), var(--paper-2), var(--ink), var(--accent), var(--serif), var(--mono)
 * 2px heavy edges, no gradients, no rounded-full.
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase/client';

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
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread count
    supabase.from('dtf_admin_notifications').select('id', { count: 'exact', head: true }).is('read_at', null).then(({ count }) => {
      setUnreadCount(count ?? 0);
    });

    // Subscribe to new notifications
    const channel = supabase
      .channel('admin-layout-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dtf_admin_notifications' }, () => {
        setUnreadCount(c => c + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dtf_admin_notifications' }, () => {
        // Re-fetch count on any update (mark-read changes)
        supabase.from('dtf_admin_notifications').select('id', { count: 'exact', head: true }).is('read_at', null).then(({ count }) => {
          setUnreadCount(count ?? 0);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function isActive(href: string, exact = false): boolean {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        fontFamily: 'var(--serif)',
        color: 'var(--ink)',
      }}
    >
      {/* Top nav bar */}
      <header
        style={{
          borderBottom: '2px solid var(--ink)',
          background: 'var(--ink)',
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
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--paper)',
              textDecoration: 'none',
            }}
          >
            DTF Studio
          </Link>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
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
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--paper-2)',
          }}
        >
          <span>{user?.email}</span>

          {/* Bell icon with unread count */}
          <Link to="/admin/notifications" style={{ position: 'relative', textDecoration: 'none', display: 'flex', alignItems: 'center', minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', color: 'var(--paper-2)' }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '2px',
                background: 'var(--accent)', color: 'var(--paper)',
                fontFamily: 'var(--mono)',
                fontSize: '9px', fontWeight: 700,
                padding: '1px 4px', borderRadius: '8px',
                minWidth: '14px', textAlign: 'center',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => signOut()}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--paper-2)',
              background: 'transparent',
              border: '1px solid var(--paper-2)',
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
          borderBottom: '1px solid var(--ink)',
          background: 'var(--paper-2)',
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
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--ink)',
                padding: '12px 16px',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
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
