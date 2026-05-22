/**
 * AdminNewQuotePage — /admin/quotes/new
 * M1: placeholder. Stripped line-item form shipped in M3.
 */
import React from 'react';
import { AdminLayout } from './AdminLayout';

export const AdminNewQuotePage: React.FC = () => {
  return (
    <AdminLayout>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        05C · Uusi tarjous
      </div>
      <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Uusi tarjous (puhelu)
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '32px' }} />
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#1a1a1a', border: '1px solid #1a1a1a', padding: '16px 20px', background: '#e8d8b0' }}>
        Puhelintilauslomake ladataan Milestone 3:ssa.
      </div>
    </AdminLayout>
  );
};
