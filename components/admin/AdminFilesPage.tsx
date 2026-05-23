/**
 * AdminFilesPage — /admin/files
 * M5: Searchable artwork browser.
 * Server-side paginated (50/page via Supabase .range()).
 * LRU signed-URL cache: TTL 5 min, max 200 entries.
 * Filter by customer email, order #, filename.
 * Click → preview modal + "Open order" link.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../services/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

// ─── Server-side page size ──────────────────────────────────────────────────
const PAGE_SIZE = 50; // S1: exactly 50 rows per server-side page

// ─── LRU signed-URL cache constants ────────────────────────────────────────
const TTL_MS = 5 * 60 * 1000; // 5-minute TTL for cached signed URLs (S5)
const MAX_CACHE = 200;         // max 200 entries in signedUrlCache (S6)

interface LRUEntry {
  url: string;
  expiresAt: number; // Date.now() + TTL_MS
}

// Module-level Map preserves LRU insertion order across re-renders
const signedUrlCache = new Map<string, LRUEntry>(); // S4: signedUrlCache

function evictExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of signedUrlCache) {
    if (entry.expiresAt <= now) signedUrlCache.delete(key);
  }
}

/**
 * getCachedSignedUrl — LRU + TTL wrapper for Supabase storage signing.
 * Returns a memoised URL on cache hit; calls Supabase on miss/expiry.
 * Evicts expired entries then oldest entry when maxSize = MAX_CACHE is exceeded.
 */
async function getCachedSignedUrl(
  bucket: string,
  path: string,
  client: SupabaseClient,
): Promise<string> {
  const cacheKey = `${bucket}::${path}`;
  const now = Date.now();

  const existing = signedUrlCache.get(cacheKey);
  if (existing && existing.expiresAt > now) {
    // LRU touch: move to tail
    signedUrlCache.delete(cacheKey);
    signedUrlCache.set(cacheKey, existing);
    return existing.url;
  }

  // Miss or expired — call Supabase
  const expirySeconds = Math.ceil(TTL_MS / 1000);
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expirySeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`signedUrlCache miss: ${path} — ${error?.message ?? 'no data'}`);
  }

  evictExpiredEntries();
  if (signedUrlCache.size >= MAX_CACHE) {
    // Evict oldest (first key in insertion order)
    const oldest = signedUrlCache.keys().next().value;
    if (oldest !== undefined) signedUrlCache.delete(oldest);
  }

  const entry: LRUEntry = { url: data.signedUrl, expiresAt: now + TTL_MS };
  signedUrlCache.set(cacheKey, entry);
  return data.signedUrl;
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface FileRecord {
  orderId: string;
  customerEmail: string;
  name: string;
  url: string;
  storagePath?: string; // path inside bucket, if applicable
  orderDate: string;
}

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };

function isImageUrl(url: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
}

// ─── Component ──────────────────────────────────────────────────────────────
export const AdminFilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0); // S3: totalCount
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<FileRecord | null>(null);

  // ── Server-side fetch with .range() ────────────────────────────────────
  const loadPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);

    const offset = (pageNum - 1) * PAGE_SIZE;

    // Count query — Supabase "exact" count mode (Prefer: count=exact)
    const { count, error: countErr } = await supabase
      .from('dtf_orders')
      .select('id', { count: 'exact', head: true }) // S3: count=exact
      .not('files', 'is', null);

    if (countErr) {
      setError(countErr.message);
      setLoading(false);
      return;
    }

    setTotalCount(count ?? 0);

    // Paginated data fetch using .range() — server-side slice, never fetches all rows
    const { data, error: fetchErr } = await supabase
      .from('dtf_orders')
      .select('id, customer_email, files, created_at')
      .not('files', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1); // S2: .range()

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    // Flatten files array for this page's orders only
    const fileList: FileRecord[] = [];
    for (const order of (data ?? [])) {
      const orderFiles = (order.files ?? []) as Array<{ name: string; url: string; path?: string }>;
      for (const f of orderFiles) {
        fileList.push({
          orderId: order.id,
          customerEmail: order.customer_email,
          name: f.name,
          url: f.url,
          storagePath: f.path,
          orderDate: order.created_at,
        });
      }
    }

    setFiles(fileList);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  // Reset to page 1 when filters change (filters are client-side within current page)
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleCustomerChange = (val: string) => {
    setCustomerFilter(val);
    setPage(1);
  };

  // Client-side filter within the current 50-row page
  const filtered = files.filter(f => {
    if (customerFilter && !f.customerEmail.toLowerCase().includes(customerFilter.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !f.name.toLowerCase().includes(q) &&
        !f.orderId.toLowerCase().includes(q) &&
        !f.customerEmail.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
          onChange={e => handleSearchChange(e.target.value)}
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
          onChange={e => handleCustomerChange(e.target.value)}
          placeholder="Suodata sähköpostilla…"
          style={{
            ...SERIF, fontSize: '1rem', padding: '10px 14px',
            border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
            outline: 'none', borderRadius: '2px', maxWidth: '280px',
          }}
        />
      </div>

      <div style={{ ...MONO, fontSize: '11px', color: '#666', marginBottom: '16px' }}>
        {totalCount} tilausta yhteensä · sivu {page}/{totalPages || 1} · {PAGE_SIZE} per sivu
      </div>

      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: '#666', padding: '24px 0' }}>Ladataan…</div>
      ) : error ? (
        <div style={{ border: '1px solid #b22222', padding: '16px', background: '#fff0f0', ...MONO, fontSize: '11px', color: '#b22222' }}>
          Virhe: {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '2px solid #1a1a1a', padding: '32px', textAlign: 'center', ...MONO, fontSize: '11px', color: '#666' }}>
          Ei tiedostoja.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {filtered.map((f, i) => (
            <FileCard
              key={`${f.orderId}-${i}`}
              file={f}
              onClick={() => setPreview(f)}
            />
          ))}
        </div>
      )}

      {/* Prev/Next pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Edellinen sivu"
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
          <span style={{ ...MONO, fontSize: '11px', color: '#666', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Seuraava sivu"
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
              <button
                onClick={() => setPreview(null)}
                style={{ ...MONO, fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', minHeight: '44px' }}
              >
                ×
              </button>
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

// ─── File card sub-component — uses getCachedSignedUrl for signed-storage paths ─
interface FileCardProps {
  file: FileRecord;
  onClick: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
  const [resolvedUrl, setResolvedUrl] = useState(file.url);

  useEffect(() => {
    // If the URL is a Supabase storage path (not already a full https URL), sign it.
    // The cache (signedUrlCache) prevents duplicate sign calls within the TTL window.
    if (file.storagePath && !file.url.startsWith('http')) {
      getCachedSignedUrl('dtf-files', file.storagePath, supabase)
        .then(signed => setResolvedUrl(signed))
        .catch(() => { /* keep original url on error */ });
    }
  }, [file.storagePath, file.url]);

  return (
    <div
      onClick={onClick}
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
        {isImageUrl(resolvedUrl) ? (
          <img
            src={resolvedUrl}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', color: '#999' }}>📄</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
          {file.name}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.customerEmail}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#b22222', marginTop: '2px' }}>
          #{file.orderId.slice(0, 8).toUpperCase()}
        </div>
      </div>
    </div>
  );
};
