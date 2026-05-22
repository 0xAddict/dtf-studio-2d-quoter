/**
 * AdminHomePage — /admin root
 * M1: placeholder that confirms gate works.
 * Stats grid + full dashboard shipped in M4.
 */
import React from 'react';
import { AdminLayout } from './AdminLayout';

export const AdminHomePage: React.FC = () => {
  return (
    <AdminLayout>
      {/* Page kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#b22222',
          marginBottom: '8px',
        }}
      >
        01 · Hallintapaneeli
      </div>

      <h1
        style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#1a1a1a',
          margin: '0 0 8px 0',
          lineHeight: 1.2,
        }}
      >
        DTF Studio — Admin
      </h1>

      {/* Crimson 2px underline rule */}
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '32px' }} />

      {/* Placeholder tiles — full stats grid shipped in M4 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {[
          { label: 'Tilaukset tänään', value: '—', link: '/admin/orders?period=today' },
          { label: 'Viikon liikevaihto', value: '—', link: '/admin/orders?period=week&payment=paid' },
          { label: 'Tuotannossa', value: '—', link: '/admin/orders?status=in_production' },
          { label: 'Odottaa maksua', value: '—', link: '/admin/orders?payment=invoice_pending' },
        ].map(({ label, value, link }) => (
          <a
            key={label}
            href={link}
            style={{
              display: 'block',
              border: '2px solid #1a1a1a',
              background: '#f4e4bc',
              padding: '20px 24px',
              textDecoration: 'none',
              color: '#1a1a1a',
              minHeight: '88px',
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '28px',
                fontWeight: 700,
                color: '#b22222',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
          </a>
        ))}
      </div>

      {/* M4 notice */}
      <div
        style={{
          border: '1px solid #1a1a1a',
          padding: '16px 20px',
          background: '#e8d8b0',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.06em',
          color: '#1a1a1a',
        }}
      >
        Tilastot ladataan Milestone 4:ssa. Käytä ylänavigaatiota tilauksiin, asiakkaisiin ja tiedostoihin.
      </div>
    </AdminLayout>
  );
};
