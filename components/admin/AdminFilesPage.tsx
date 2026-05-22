/**
 * AdminFilesPage — /admin/files
 * M1: placeholder. File browser shipped in M5.
 */
import React from 'react';
import { AdminLayout } from './AdminLayout';

export const AdminFilesPage: React.FC = () => {
  return (
    <AdminLayout>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        05 · Tiedostot
      </div>
      <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Tiedostot
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '32px' }} />
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#1a1a1a', border: '1px solid #1a1a1a', padding: '16px 20px', background: '#e8d8b0' }}>
        Tiedostoselain ladataan Milestone 5:ssa.
      </div>
    </AdminLayout>
  );
};
