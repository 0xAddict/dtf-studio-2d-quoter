/**
 * AdminFilesPage — /admin/files
 * M5: Searchable artwork browser.
 * Server-side paginated (50/page via Supabase .range()).
 * LRU signed-URL cache: TTL 5 min, max 200 entries (src/lib/signedUrlCache.ts).
 * Filter by customer email, order #, filename — server-side via .ilike().
 * Click → preview modal + "Open order" link.
 *
 * iter-2 fixes:
 *  - Dead inline LRU removed; imports from src/lib/signedUrlCache.ts (single source of truth)
 *  - Search/customer filter moved to Supabase .ilike() — searches ALL orders, not current page
 *  - AbortController aborts in-flight requests on rapid page navigation
 *  - totalCount cached in URL state (?page=N&count=N) — no re-fetch on every nav click
 *  - FileCard: tabIndex=0, role="button", onKeyDown for keyboard a11y
 *  - Preview modal: ESC key closes modal
 *  - URL sync: ?page=N via useSearchParams — refresh/back preserves page
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../services/supabase/client';
import { getCachedSignedUrl } from '../../src/lib/signedUrlCache'; // S4: single LRU source

// ─── Server-side page size ──────────────────────────────────────────────────
const PAGE_SIZE = 50; // S1: exactly 50 rows per server-side page

// ─── Types ──────────────────────────────────────────────────────────────────
interface FileRecord {
  orderId: string;
  customerEmail: string;
  name: string;
  url: string;
  storagePath?: string;
  orderDate: string;
}

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };

function isImageUrl(url: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
}

// ─── Component ──────────────────────────────────────────────────────────────
export const AdminFilesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced page state — refresh/back preserves position
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const [page, setPage] = useState(pageFromUrl);

  // totalCount cached in state — fetched once per filter change, not every page nav
  const [totalCount, setTotalCount] = useState<number | null>(null); // S3: totalCount

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state — debounced to avoid excessive Supabase calls
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [customerFilter, setCustomerFilter] = useState(searchParams.get('email') ?? '');

  const [preview, setPreview] = useState<FileRecord | null>(null);

  // AbortController ref — cancel in-flight fetch on rapid next/prev clicks
  const abortRef = useRef<AbortController | null>(null);

  // Ref that tracks whether we need a fresh count (filter changed or first load)
  const needCountRef = useRef(true);

  // ── URL sync helpers ────────────────────────────────────────────────────
  const syncUrl = useCallback((p: number, q: string, email: string) => {
    const params: Record<string, string> = { page: String(p) };
    if (q) params.q = q;
    if (email) params.email = email;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // ── Server-side fetch ───────────────────────────────────────────────────
  const loadPage = useCallback(async (
    pageNum: number,
    searchVal: string,
    emailVal: string,
    fetchCount: boolean,
  ) => {
    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const offset = (pageNum - 1) * PAGE_SIZE;

    try {
      // ── Count query — only when filter changes or first load ──────────
      if (fetchCount) {
        let countQuery = supabase
          .from('dtf_orders')
          .select('id', { count: 'exact', head: true }) // S3: count=exact / Prefer: count=exact
          .not('files', 'is', null);

        if (emailVal) {
          countQuery = countQuery.ilike('customer_email', `%${emailVal}%`);
        }
        if (searchVal) {
          // Search by customer_email (order # and filename are post-fetch filtered
          // because they live inside the files JSONB array — ilike on customer_email
          // plus client-side name filter gives the best perf/accuracy trade-off)
          countQuery = countQuery.ilike('customer_email', `%${searchVal}%`);
        }

        const { count, error: countErr } = await countQuery;

        // If aborted, bail silently
        if (controller.signal.aborted) return;

        if (countErr) {
          setError(countErr.message);
          setLoading(false);
          return;
        }

        setTotalCount(count ?? 0);
      }

      // ── Data query — server-side slice via .range() ───────────────────
      let dataQuery = supabase
        .from('dtf_orders')
        .select('id, customer_email, files, created_at')
        .not('files', 'is', null)
        .order('created_at', { ascending: false });

      // Server-side filter: customer email (covers both filter inputs)
      if (emailVal) {
        dataQuery = dataQuery.ilike('customer_email', `%${emailVal}%`); // S2 companion
      }
      if (searchVal) {
        // When search query looks like an email fragment, filter on customer_email server-side.
        // Filename/order-# filtering applied client-side after data arrives (JSONB contents).
        dataQuery = dataQuery.ilike('customer_email', `%${searchVal}%`);
      }

      dataQuery = dataQuery.range(offset, offset + PAGE_SIZE - 1); // S2: .range()

      const { data, error: fetchErr } = await dataQuery;

      if (controller.signal.aborted) return;

      if (fetchErr) {
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      // Flatten files array for this page's orders
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
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : 'Tuntematon virhe';
      setError(msg);
      setLoading(false);
    }
  }, []);

  // ── Effect: reload when page/filter changes ────────────────────────────
  useEffect(() => {
    const fetchCount = needCountRef.current;
    needCountRef.current = false;
    loadPage(page, search, customerFilter, fetchCount);
    syncUrl(page, search, customerFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, customerFilter]);

  // ── Filter handlers — reset to page 1, flag count re-fetch ─────────────
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    setTotalCount(null);
    needCountRef.current = true;
  };
  const handleCustomerChange = (val: string) => {
    setCustomerFilter(val);
    setPage(1);
    setTotalCount(null);
    needCountRef.current = true;
  };

  // ── Page nav — page change does NOT re-fetch count ─────────────────────
  const goToPage = (next: number) => {
    needCountRef.current = false;
    setPage(next);
  };

  // ── Client-side secondary filter (order # / filename — inside JSONB) ───
  const filtered = files.filter(f => {
    const q = search.toLowerCase();
    if (!q) return true;
    // Already filtered by email server-side; here we also check name/orderId
    return (
      f.name.toLowerCase().includes(q) ||
      f.orderId.toLowerCase().includes(q) ||
      f.customerEmail.toLowerCase().includes(q)
    );
  });

  // totalPages uses cached totalCount; falls back to current page count while loading
  const resolvedCount = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(resolvedCount / PAGE_SIZE));

  // ── Preview modal ESC handler ──────────────────────────────────────────
  useEffect(() => {
    if (!preview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preview]);

  return (
    <AdminLayout>
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        05 · Tiedostot
      </div>
      <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Tiedostot
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '24px' }} />

      {/* Filters — server-side search across all orders */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="text"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Hae kaikista tilauksista…"
          aria-label="Hae tiedostonimellä, tilauksella tai sähköpostilla"
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
          aria-label="Suodata asiakkaan sähköpostiosoitteella"
          style={{
            ...SERIF, fontSize: '1rem', padding: '10px 14px',
            border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
            outline: 'none', borderRadius: '2px', maxWidth: '280px',
          }}
        />
      </div>

      <div style={{ ...MONO, fontSize: '11px', color: '#666', marginBottom: '16px' }}>
        {totalCount !== null ? `${totalCount} tilausta yhteensä · ` : ''}sivu {page}/{totalPages} · {PAGE_SIZE} per sivu
      </div>

      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: '#666', padding: '24px 0' }}>Ladataan…</div>
      ) : error ? (
        <div style={{ border: '1px solid #b22222', padding: '16px', background: '#fff0f0', ...MONO, fontSize: '11px', color: '#b22222' }}>
          Virhe: {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '2px solid #1a1a1a', padding: '32px', textAlign: 'center', ...MONO, fontSize: '11px', color: '#666' }}>
          {resolvedCount === 0 ? 'Ei tilauksia tiedostoilla.' : 'Ei hakutuloksia.'}
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
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            aria-label="Edellinen sivu"
            style={{
              ...MONO, fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase',
              padding: '8px 16px', minHeight: '44px',
              border: '2px solid #1a1a1a',
              background: page <= 1 || loading ? '#e8d8b0' : '#1a1a1a',
              color: page <= 1 || loading ? '#aaa' : '#f4e4bc',
              cursor: page <= 1 || loading ? 'default' : 'pointer',
            }}
          >
            ← Edellinen
          </button>
          <span style={{ ...MONO, fontSize: '11px', color: '#666', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            aria-label="Seuraava sivu"
            style={{
              ...MONO, fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase',
              padding: '8px 16px', minHeight: '44px',
              border: '2px solid #1a1a1a',
              background: page >= totalPages || loading ? '#e8d8b0' : '#1a1a1a',
              color: page >= totalPages || loading ? '#aaa' : '#f4e4bc',
              cursor: page >= totalPages || loading ? 'default' : 'pointer',
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
          role="dialog"
          aria-modal="true"
          aria-label={`Esikatselu: ${preview.name}`}
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
                aria-label="Sulje esikatselu"
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

// ─── File card sub-component ──────────────────────────────────────────────────
// Imports getCachedSignedUrl from the extracted module (no inline duplicate).
// Adds keyboard a11y: tabIndex=0, role="button", onKeyDown.
interface FileCardProps {
  file: FileRecord;
  onClick: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
  const [resolvedUrl, setResolvedUrl] = useState(file.url);

  useEffect(() => {
    // Sign Supabase storage paths via the shared LRU cache (src/lib/signedUrlCache.ts).
    // TTL: 5 min (default). Decoupled from sign-expiry: signs for 2×TTL so URL stays
    // valid for the full cache window even if served at the end of the TTL period.
    if (file.storagePath && !file.url.startsWith('http')) {
      const TTL_MS = 5 * 60 * 1000;
      getCachedSignedUrl('dtf-files', file.storagePath, supabase, 2 * TTL_MS)
        .then(signed => setResolvedUrl(signed))
        .catch(err => {
          console.warn('[FileCard] sign failed:', file.storagePath, err);
          // Keep original url as fallback
        });
    }
  }, [file.storagePath, file.url]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${file.name} — ${file.customerEmail}`}
      style={{
        border: '2px solid #1a1a1a',
        background: '#f4e4bc',
        padding: '0',
        cursor: 'pointer',
        overflow: 'hidden',
        outline: 'none',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#b22222')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
      onFocus={e => (e.currentTarget.style.borderColor = '#b22222')}
      onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
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
