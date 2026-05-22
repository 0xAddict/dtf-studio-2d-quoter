/**
 * AdminOrderDetailPage — /admin/orders/:id
 * M1: placeholder. Full detail view shipped in M4.
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        02 · Tilaukset / Yksityiskohta
      </div>
      <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Tilaus #{id?.slice(0, 8)}
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '32px' }} />
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#1a1a1a', border: '1px solid #1a1a1a', padding: '16px 20px', background: '#e8d8b0', marginBottom: '16px' }}>
        Tilauksen yksityiskohdat ladataan Milestone 4:ssa.
      </div>
      <Link to="/admin/orders" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#b22222', textDecoration: 'underline' }}>
        ← Takaisin tilauksiin
      </Link>
    </AdminLayout>
  );
};
