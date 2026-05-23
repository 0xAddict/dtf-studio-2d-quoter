/**
 * AdminOrdersPage — /admin/orders
 * M4: Filterable + searchable orders table.
 * Columns: order#, email, status, total, payment, created_at
 * Filters: status (multi-select), payment status, search by email/order#
 * Pagination: 50/page, cursor-based via offset
 * Brand: manila/crimson/serif/mono, ≥44px touch targets
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../services/supabase/client';
import { DtfOrder, DtfOrderStatus, DtfPaymentStatus, statusLabel } from '../../services/supabase/orders';

const PAGE_SIZE = 50;

const ALL_STATUSES: DtfOrderStatus[] = ['quote','new','confirmed','in_design','in_production','packed','shipped','delivered','cancelled'];
const ALL_PAYMENT: DtfPaymentStatus[] = ['none','invoice_pending','paid','refunded','failed'];

const STATUS_LABELS: Record<DtfOrderStatus, string> = {
  quote: 'Tarjous', new: 'Uusi', confirmed: 'Vahvistettu', in_design: 'Suunnittelu',
  in_production: 'Tuotanto', packed: 'Pakattu', shipped: 'Lähetetty',
  delivered: 'Toimitettu', cancelled: 'Peruutettu',
};

const PAYMENT_LABELS: Record<DtfPaymentStatus, string> = {
  none: 'Ei maksua', invoice_pending: 'Lasku odottaa', paid: 'Maksettu',
  refunded: 'Hyvitetty', failed: 'Epäonnistui',
};

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };

function StatusChip({ status }: { status: DtfOrderStatus }) {
  const colors: Record<DtfOrderStatus, { bg: string; color: string }> = {
    quote: { bg: '#e8d8b0', color: '#1a1a1a' },
    new: { bg: '#dbeafe', color: '#1e3a8a' },
    confirmed: { bg: '#d1fae5', color: '#064e3b' },
    in_design: { bg: '#ede9fe', color: '#4c1d95' },
    in_production: { bg: '#fef9c3', color: '#78350f' },
    packed: { bg: '#e0e7ff', color: '#1e1b4b' },
    shipped: { bg: '#ffedd5', color: '#7c2d12' },
    delivered: { bg: '#dcfce7', color: '#14532d' },
    cancelled: { bg: '#fee2e2', color: '#7f1d1d' },
  };
  const c = colors[status] ?? { bg: '#e8d8b0', color: '#1a1a1a' };
  return (
    <span style={{
      ...MONO,
      fontSize: '10px',
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      padding: '3px 8px',
      border: '1px solid currentColor',
      background: c.bg,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function PaymentChip({ status }: { status: DtfPaymentStatus }) {
  const colors: Record<DtfPaymentStatus, { bg: string; color: string }> = {
    none: { bg: '#f4e4bc', color: '#666' },
    invoice_pending: { bg: '#fef9c3', color: '#92400e' },
    paid: { bg: '#dcfce7', color: '#14532d' },
    refunded: { bg: '#e0e7ff', color: '#312e81' },
    failed: { bg: '#fee2e2', color: '#7f1d1d' },
  };
  const c = colors[status] ?? { bg: '#f4e4bc', color: '#666' };
  return (
    <span style={{
      ...MONO,
      fontSize: '10px',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '3px 8px',
      border: '1px solid currentColor',
      background: c.bg,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {PAYMENT_LABELS[status] ?? status}
    </span>
  );
}

export const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const statusFilter = searchParams.getAll('status') as DtfOrderStatus[];
  const paymentFilter = searchParams.getAll('payment') as DtfPaymentStatus[];
  const searchQuery = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');

  const [orders, setOrders] = useState<DtfOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('dtf_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }
    if (paymentFilter.length > 0) {
      query = query.in('payment_status', paymentFilter);
    }
    if (searchQuery) {
      // Search by email or UUID prefix
      query = query.or(`customer_email.ilike.%${searchQuery}%,id.ilike.${searchQuery}%`);
    }

    const { data, count, error: fetchErr } = await query;

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as DtfOrder[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [statusFilter.join(','), paymentFilter.join(','), searchQuery, page]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function setFilter(key: string, values: string[]) {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    values.forEach(v => next.append(key, v));
    next.set('page', '1');
    setSearchParams(next);
  }

  function setSearch(q: string) {
    const next = new URLSearchParams(searchParams);
    next.set('q', q);
    next.set('page', '1');
    setSearchParams(next);
  }

  function setPage(p: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  }

  function toggleStatus(s: DtfOrderStatus) {
    const next = statusFilter.includes(s)
      ? statusFilter.filter(x => x !== s)
      : [...statusFilter, s];
    setFilter('status', next);
  }

  function togglePayment(p: DtfPaymentStatus) {
    const next = paymentFilter.includes(p)
      ? paymentFilter.filter(x => x !== p)
      : [...paymentFilter, p];
    setFilter('payment', next);
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        02 · Tilaukset
      </div>
      <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Tilaukset
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '24px' }} />

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hae sähköpostilla tai tilausnumerolla…"
          style={{
            ...SERIF,
            fontSize: '1rem',
            padding: '10px 14px',
            border: '2px solid #1a1a1a',
            background: '#f4e4bc',
            color: '#1a1a1a',
            outline: 'none',
            borderRadius: '2px',
            maxWidth: '400px',
          }}
        />

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginRight: '4px' }}>Tila:</span>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              style={{
                ...MONO,
                fontSize: '10px',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                minHeight: '28px',
                border: '1px solid #1a1a1a',
                background: statusFilter.includes(s) ? '#1a1a1a' : '#f4e4bc',
                color: statusFilter.includes(s) ? '#f4e4bc' : '#1a1a1a',
                cursor: 'pointer',
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          {statusFilter.length > 0 && (
            <button onClick={() => setFilter('status', [])} style={{ ...MONO, fontSize: '10px', color: '#b22222', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Tyhjennä
            </button>
          )}
        </div>

        {/* Payment filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginRight: '4px' }}>Maksu:</span>
          {ALL_PAYMENT.map(p => (
            <button
              key={p}
              onClick={() => togglePayment(p)}
              style={{
                ...MONO,
                fontSize: '10px',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                minHeight: '28px',
                border: '1px solid #1a1a1a',
                background: paymentFilter.includes(p) ? '#1a1a1a' : '#f4e4bc',
                color: paymentFilter.includes(p) ? '#f4e4bc' : '#1a1a1a',
                cursor: 'pointer',
              }}
            >
              {PAYMENT_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Count + pagination info */}
      <div style={{ ...MONO, fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        {total} tilausta {totalPages > 1 ? `· sivu ${page}/${totalPages}` : ''}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', padding: '24px 0', color: '#666' }}>Haetaan tilauksia…</div>
      ) : error ? (
        <div style={{ border: '1px solid #b22222', padding: '16px', background: '#fff0f0', ...MONO, fontSize: '11px', color: '#b22222' }}>
          Tilausten haku epäonnistui — {error}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ border: '2px solid #1a1a1a', padding: '32px', background: '#e8d8b0', textAlign: 'center', ...MONO, fontSize: '11px', color: '#666' }}>
          Ei tilauksia näillä suodattimilla
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #1a1a1a' }}>
                {['Tilaus #', 'Asiakas', 'Tila', 'Maksu', 'Hinta', 'Luotu'].map(col => (
                  <th key={col} style={{
                    ...MONO,
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: '#e8d8b0',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
                <th style={{ padding: '8px 12px', background: '#e8d8b0', width: '44px' }} />
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  style={{
                    borderBottom: '1px solid #e8d8b0',
                    background: i % 2 === 0 ? '#f4e4bc' : '#faf0d8',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e8d8b0')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#f4e4bc' : '#faf0d8')}
                >
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.customer_email}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <StatusChip status={order.status} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <PaymentChip status={order.payment_status} />
                  </td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '12px', fontWeight: 700, color: '#b22222', whiteSpace: 'nowrap' }}>
                    €{Number(order.quote_eur).toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '10px', color: '#666', whiteSpace: 'nowrap' }}>
                    {new Date(order.created_at).toLocaleDateString('fi')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', minWidth: '44px', minHeight: '44px' }}>
                    <span style={{ color: '#b22222', fontSize: '14px' }}>→</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(page - 1)}
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
          <span style={{ ...MONO, fontSize: '11px', color: '#666', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
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
    </AdminLayout>
  );
};
