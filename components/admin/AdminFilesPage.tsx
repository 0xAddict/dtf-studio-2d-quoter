/**
 * AdminFilesPage — /admin/files
 * M5: Searchable artwork browser.
 * Grid view of all dtf_orders.files[] references.
 * Filter by customer email, order #, filename.
 * Click → preview modal + "Open order" link.
 * Capped at last 90 days orders.
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

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };

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

    // Fetch orders from last 90 days with files
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

  // Filter client-side
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
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        05 · Tiedostot
      </div>
      <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Tiedostot
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '24px' }} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Hae tiedostonimellä tai tilauksella…"
          style={{
            ...SERIF, fontSize: '1rem', padding: '10px 14px',
            border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
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
            border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
            outline: 'none', borderRadius: '2px', maxWidth: '280px',
          }}
        />
      </div>

      <div style={{ ...MONO, fontSize: '11px', color: '#666', marginBottom: '16px' }}>
        {filtered.length} tiedostoa{totalPages > 1 ? ` · sivu ${page}/${totalPages}` : ''}
      </div>

      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: '#666', padding: '24px 0' }}>Haetaan tiedostoja…</div>
      ) : error ? (
        <div style={{ border: '1px solid #b22222', padding: '16px', background: '#fff0f0', ...MONO, fontSize: '11px', color: '#b22222' }}>
          Tiedostojen haku epäonnistui — {error}
        </div>
      ) : paginated.length === 0 ? (
        <div style={{ border: '2px solid #1a1a1a', padding: '32px', textAlign: 'center', ...MONO, fontSize: '11px', color: '#666' }}>
          Ei tiedostoja hakuehdoilla
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {paginated.map((f, i) => (
            <div
              key={`${f.orderId}-${i}`}
              onClick={() => setPreview(f)}
              style={{
                border: '2px solid #1a1a1a',
                background: '#f4e4bc',
                padding: '0',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#b22222')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
            >
              {/* Preview area */}
              <div style={{ height: '120px', background: '#e8d8b0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {isImageUrl(f.url) ? (
                  <img
                    src={f.url}
                    alt={f.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ ...MONO, fontSize: '24px', color: '#999' }}>📄</div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                  {f.name}
                </div>
                <div style={{ ...MONO, fontSize: '10px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.customerEmail}
                </div>
                <div style={{ ...MONO, fontSize: '10px', color: '#b22222', marginTop: '2px' }}>
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
              border: '2px solid #1a1a1a',
              background: page <= 1 ? '#e8d8b0' : '#1a1a1a',
              color: page <= 1 ? '#aaa' : '#f4e4bc',
              cursor: page <= 1 ? 'default' : 'pointer',
            }}
          >
            ← Edellinen
          </button>
          <span style={{ ...MONO, fontSize: '11px', color: '#666', padding: '0 8px' }}>{page}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              ...MONO, fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase',
              padding: '8px 16px', minHeight: '44px',
              border: '2px solid #1a1a1a',
              background: page >= totalPages ? '#e8d8b0' : '#1a1a1a',
              color: page >= totalPages ? '#aaa' : '#f4e4bc',
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
            style={{ background: '#f4e4bc', border: '2px solid #1a1a1a', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
          >
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8d8b0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ ...MONO, fontSize: '11px', fontWeight: 700 }}>{preview.name}</div>
                <div style={{ ...MONO, fontSize: '10px', color: '#666' }}>{preview.customerEmail}</div>
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
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e8d8b0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...MONO, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '10px 20px', minHeight: '44px',
                  border: '2px solid #1a1a1a', background: '#1a1a1a', color: '#f4e4bc',
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
                  border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
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
