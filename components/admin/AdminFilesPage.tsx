/**
 * AdminFilesPage — /admin/files
 * M5: Searchable artwork browser.
 * Grid view of all dtf_orders.files[] references.
 * Filter by customer email, order #, filename.
 * Click → preview modal + "Open order" link.
 * Capped at last 90 days orders.
 * Brand tokens: var(--paper), var(--paper-2), var(--ink), var(--accent), var(--serif), var(--mono)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../services/supabase/client';

interface FileRecord {
  orderId: string;
  customerEmail: string;
  name: string;
  url: string;
  orderDate: string;
}

const PAGE_SIZE = 24;

const MONO: React.CSSProperties = { fontFamily: 'var(--mono)' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--serif)' };

function isImageUrl(url: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
}

export const AdminFilesPage: React.FC = () => {
  const [allFiles, setAllFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<FileRecord | null>(null);

  useEffect(() => { loadFiles(); }, []);

  async function loadFiles() {
    setLoading(true);
    setError(null);

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error: fetchErr } = await supabase
      .from('dtf_orders')
      .select('id, customer_email, files, created_at')
      .gte('created_at', ninetyDaysAgo)
      .not('files', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    const fileList: FileRecord[] = [];
    for (const order of (data ?? [])) {
      const files = (order.files ?? []) as Array<{ name: string; url: string }>;
      for (const f of files) {
        fileList.push({
          orderId: order.id,
          customerEmail: order.customer_email,
          name: f.name,
          url: f.url,
          orderDate: order.created_at,
        });
      }
    }

    setAllFiles(fileList);
    setLoading(false);
  }

  const filtered = allFiles.filter(f => {
    if (customerFilter && !f.customerEmail.toLowerCase().includes(customerFilter.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!f.name.toLowerCase().includes(q) && !f.orderId.toLowerCase().includes(q) && !f.customerEmail.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
        05 · Tiedostot
      </div>
      <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
        Tiedostot
      </h1>
      <div style={{ width: '48px', height: '2px', background: 'var(--accent)', marginBottom: '24px' }} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Hae tiedostonimellä tai tilauksella…"
          style={{
            ...SERIF, fontSize: '1rem', padding: '10px 14px',
            border: '2px solid var(--ink)', background: 'var(--paper)', color: 'var(--ink)',
            outline: 'none', borderRadius: '2px', maxWidth: '320px',
          }}
        />
        <input
          type="text"
          value={customerFilter}
          onChange={e => { setCustomerFilter(e.target.value); setPage(1); }}
          placeholder="Suodata sähköpostilla…"
          style={{
            ...SERIF, fontSize: '1rem', padding: '10px 14px',
            border: '2px solid var(--ink)', background: 'var(--paper)', color: 'var(--ink)',
            outline: 'none', borderRadius: '2px', maxWidth: '280px',
          }}
        />
      </div>

      <div style={{ ...MONO, fontSize: '11px', color: 'var(--muted)', marginBottom: '16px' }}>
        {filtered.length} tiedostoa{totalPages > 1 ? ` · sivu ${page}/${totalPages}` : ''}
      </div>

      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: 'var(--muted)', padding: '24px 0' }}>Ladataan…</div>
      ) : error ? (
        <div style={{ border: '1px solid var(--accent)', padding: '16px', background: 'var(--field)', ...MONO, fontSize: '11px', color: 'var(--accent)' }}>
          Virhe: {error}
        </div>
      ) : paginated.length === 0 ? (
        <div style={{ border: '2px solid var(--ink)', padding: '32px', textAlign: 'center', ...MONO, fontSize: '11px', color: 'var(--muted)' }}>
          Ei tiedostoja.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {paginated.map((f, i) => (
            <div
              key={`${f.orderId}-${i}`}
              onClick={() => setPreview(f)}
              style={{
                border: '2px solid var(--ink)',
                background: 'var(--paper)',
                padding: '0',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ink)')}
            >
              {/* Preview area */}
              <div style={{ height: '120px', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {isImageUrl(f.url) ? (
                  <img
                    src={f.url}
                    alt={f.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ ...MONO, fontSize: '24px', color: 'var(--ink-soft)' }}>📄</div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                  {f.name}
                </div>
                <div style={{ ...MONO, fontSize: '10px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.customerEmail}
                </div>
                <div style={{ ...MONO, fontSize: '10px', color: 'var(--accent)', marginTop: '2px' }}>
                  #{f.orderId.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              ...MONO, fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase',
              padding: '8px 16px', minHeight: '44px',
              border: '2px solid var(--ink)',
              background: page <= 1 ? 'var(--paper-2)' : 'var(--ink)',
              color: page <= 1 ? 'var(--ink-soft)' : 'var(--paper)',
              cursor: page <= 1 ? 'default' : 'pointer',
            }}
          >
            ← Edellinen
          </button>
          <span style={{ ...MONO, fontSize: '11px', color: 'var(--muted)', padding: '0 8px' }}>{page}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              ...MONO, fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase',
              padding: '8px 16px', minHeight: '44px',
              border: '2px solid var(--ink)',
              background: page >= totalPages ? 'var(--paper-2)' : 'var(--ink)',
              color: page >= totalPages ? 'var(--ink-soft)' : 'var(--paper)',
              cursor: page >= totalPages ? 'default' : 'pointer',
            }}
          >
            Seuraava →
          </button>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--paper)', border: '2px solid var(--ink)', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
          >
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--paper-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ ...MONO, fontSize: '11px', fontWeight: 700 }}>{preview.name}</div>
                <div style={{ ...MONO, fontSize: '10px', color: 'var(--muted)' }}>{preview.customerEmail}</div>
              </div>
              <button onClick={() => setPreview(null)} style={{ ...MONO, fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', minHeight: '44px' }}>×</button>
            </div>
            {/* Preview */}
            <div style={{ padding: '24px', textAlign: 'center' }}>
              {isImageUrl(preview.url) ? (
                <img src={preview.url} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
              ) : (
                <div style={{ ...MONO, fontSize: '48px', margin: '40px 0' }}>📄</div>
              )}
            </div>
            {/* Actions */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--paper-2)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...MONO, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '10px 20px', minHeight: '44px',
                  border: '2px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center',
                }}
              >
                Avaa alkuperäinen ↗
              </a>
              <Link
                to={`/admin/orders/${preview.orderId}`}
                style={{
                  ...MONO, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '10px 20px', minHeight: '44px',
                  border: '2px solid var(--ink)', background: 'var(--paper)', color: 'var(--ink)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center',
                }}
              >
                Avaa tilaus #{preview.orderId.slice(0, 8).toUpperCase()}
              </Link>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
