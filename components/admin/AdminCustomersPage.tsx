/**
 * AdminCustomersPage — /admin/customers
 * M5: Customer list with LTV aggregation (SUM paid quote_eur),
 * last order timestamp + status, total order count.
 * Search by email. Sort by LTV / last_order_date.
 * Click row → filtered /admin/orders?q=email
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../services/supabase/client';

interface CustomerRow {
  email: string;
  totalOrders: number;
  ltv: number;
  lastOrderDate: string | null;
  lastOrderStatus: string | null;
  customerId: string | null;
}

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };

type SortKey = 'ltv' | 'lastOrderDate' | 'totalOrders';

export const AdminCustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('ltv');

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    setLoading(true);
    setError(null);

    // Fetch all orders (customer_email, payment_status, quote_eur, created_at, status, customer_id)
    const { data, error: fetchErr } = await supabase
      .from('dtf_orders')
      .select('customer_email, payment_status, quote_eur, created_at, status, customer_id')
      .order('created_at', { ascending: false });

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    // Aggregate by customer_email
    const map = new Map<string, CustomerRow>();
    for (const o of (data ?? [])) {
      if (!map.has(o.customer_email)) {
        map.set(o.customer_email, {
          email: o.customer_email,
          totalOrders: 0,
          ltv: 0,
          lastOrderDate: null,
          lastOrderStatus: null,
          customerId: o.customer_id ?? null,
        });
      }
      const rec = map.get(o.customer_email)!;
      rec.totalOrders++;
      if (o.payment_status === 'paid') {
        rec.ltv += Number(o.quote_eur);
      }
      // customer_id: use first non-null
      if (!rec.customerId && o.customer_id) rec.customerId = o.customer_id;
      // last order
      if (!rec.lastOrderDate || new Date(o.created_at) > new Date(rec.lastOrderDate)) {
        rec.lastOrderDate = o.created_at;
        rec.lastOrderStatus = o.status;
      }
    }

    setCustomers(Array.from(map.values()));
    setLoading(false);
  }

  // Filter + sort client-side
  let displayed = [...customers];
  if (search) {
    const q = search.toLowerCase();
    displayed = displayed.filter(c => c.email.toLowerCase().includes(q));
  }
  displayed.sort((a, b) => {
    if (sortBy === 'ltv') return b.ltv - a.ltv;
    if (sortBy === 'totalOrders') return b.totalOrders - a.totalOrders;
    if (sortBy === 'lastOrderDate') {
      if (!a.lastOrderDate) return 1;
      if (!b.lastOrderDate) return -1;
      return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
    }
    return 0;
  });

  const SortBtn = ({ key: k, label }: { key: SortKey; label: string }) => (
    <button
      onClick={() => setSortBy(k)}
      style={{
        ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
        padding: '4px 10px', minHeight: '28px',
        border: '1px solid #1a1a1a',
        background: sortBy === k ? '#1a1a1a' : '#f4e4bc',
        color: sortBy === k ? '#f4e4bc' : '#1a1a1a',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <AdminLayout>
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        04 · Asiakkaat
      </div>
      <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Asiakkaat
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '24px' }} />

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hae sähköpostilla…"
          style={{
            ...SERIF, fontSize: '1rem', padding: '10px 14px',
            border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
            outline: 'none', borderRadius: '2px', maxWidth: '320px',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666' }}>Järjestys:</span>
          <SortBtn key="ltv" label="LTV" />
          <SortBtn key="lastOrderDate" label="Viimeisin" />
          <SortBtn key="totalOrders" label="Tilaukset" />
        </div>
      </div>

      <div style={{ ...MONO, fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        {displayed.length} asiakasta
      </div>

      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: '#666', padding: '24px 0' }}>Haetaan asiakkaita…</div>
      ) : error ? (
        <div style={{ border: '1px solid #b22222', padding: '16px', background: '#fff0f0', ...MONO, fontSize: '11px', color: '#b22222' }}>
          Asiakkaiden haku epäonnistui — {error}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ border: '2px solid #1a1a1a', padding: '32px', textAlign: 'center', ...MONO, fontSize: '11px', color: '#666' }}>
          Ei asiakkaita näillä suodattimilla
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #1a1a1a' }}>
                {['Sähköposti', 'Tilauksia', 'LTV (maksettu)', 'Viimeisin tilaus', 'Viim. tila'].map(col => (
                  <th key={col} style={{
                    ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '8px 12px', textAlign: 'left', background: '#e8d8b0', fontWeight: 700, whiteSpace: 'nowrap',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((c, i) => (
                <tr
                  key={c.email}
                  onClick={() => navigate(`/admin/orders?q=${encodeURIComponent(c.email)}`)}
                  style={{
                    borderBottom: '1px solid #e8d8b0',
                    background: i % 2 === 0 ? '#f4e4bc' : '#faf0d8',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e8d8b0')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#f4e4bc' : '#faf0d8')}
                >
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '12px', fontWeight: 600 }}>{c.email}</td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '12px', textAlign: 'center' }}>{c.totalOrders}</td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '13px', fontWeight: 700, color: c.ltv > 0 ? '#b22222' : '#aaa' }}>
                    €{c.ltv.toFixed(0)}
                  </td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '10px', color: '#666', whiteSpace: 'nowrap' }}>
                    {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('fi') : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {c.lastOrderStatus && (
                      <span style={{
                        ...MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '2px 8px', border: '1px solid #1a1a1a',
                      }}>
                        {c.lastOrderStatus}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};
