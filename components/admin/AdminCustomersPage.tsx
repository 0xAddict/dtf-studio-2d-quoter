/**
 * AdminCustomersPage — /admin/customers
 * M5: Customer list with LTV aggregation (SUM paid quote_eur),
 * last order timestamp + status, total order count.
 * Search by email. Sort by LTV / last_order_date.
 * Click row → filtered /admin/orders?q=email
 * Brand tokens: var(--paper), var(--paper-2), var(--ink), var(--accent), var(--serif), var(--mono)
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

const MONO: React.CSSProperties = { fontFamily: 'var(--mono)' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--serif)' };

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

    const { data, error: fetchErr } = await supabase
      .from('dtf_orders')
      .select('customer_email, payment_status, quote_eur, created_at, status, customer_id')
      .order('created_at', { ascending: false });

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

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
      if (o.payment_status === 'paid') rec.ltv += Number(o.quote_eur);
      if (!rec.customerId && o.customer_id) rec.customerId = o.customer_id;
      if (!rec.lastOrderDate || new Date(o.created_at) > new Date(rec.lastOrderDate)) {
        rec.lastOrderDate = o.created_at;
        rec.lastOrderStatus = o.status;
      }
    }

    setCustomers(Array.from(map.values()));
    setLoading(false);
  }

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
        border: '1px solid var(--ink)',
        background: sortBy === k ? 'var(--ink)' : 'var(--paper)',
        color: sortBy === k ? 'var(--paper)' : 'var(--ink)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <AdminLayout>
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
        04 · Asiakkaat
      </div>
      <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
        Asiakkaat
      </h1>
      <div style={{ width: '48px', height: '2px', background: 'var(--accent)', marginBottom: '24px' }} />

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hae sähköpostilla…"
          style={{
            ...SERIF, fontSize: '1rem', padding: '10px 14px',
            border: '2px solid var(--ink)', background: 'var(--paper)', color: 'var(--ink)',
            outline: 'none', borderRadius: '2px', maxWidth: '320px',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Järjestys:</span>
          <SortBtn key="ltv" label="LTV" />
          <SortBtn key="lastOrderDate" label="Viimeisin" />
          <SortBtn key="totalOrders" label="Tilaukset" />
        </div>
      </div>

      <div style={{ ...MONO, fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
        {displayed.length} asiakasta
      </div>

      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: 'var(--muted)', padding: '24px 0' }}>Ladataan…</div>
      ) : error ? (
        <div style={{ border: '1px solid var(--accent)', padding: '16px', background: 'var(--field)', ...MONO, fontSize: '11px', color: 'var(--accent)' }}>
          Virhe: {error}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ border: '2px solid var(--ink)', padding: '32px', textAlign: 'center', ...MONO, fontSize: '11px', color: 'var(--muted)' }}>
          Ei asiakkaita.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--ink)' }}>
                {['Sähköposti', 'Tilauksia', 'LTV (maksettu)', 'Viimeisin tilaus', 'Viim. tila'].map(col => (
                  <th key={col} style={{
                    ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '8px 12px', textAlign: 'left', background: 'var(--paper-2)', fontWeight: 700, whiteSpace: 'nowrap',
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
                    borderBottom: '1px solid var(--paper-2)',
                    background: i % 2 === 0 ? 'var(--paper)' : 'var(--field)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--paper)' : 'var(--field)')}
                >
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '12px', fontWeight: 600 }}>{c.email}</td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '12px', textAlign: 'center' }}>{c.totalOrders}</td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '13px', fontWeight: 700, color: c.ltv > 0 ? 'var(--accent)' : 'var(--ink-soft)' }}>
                    €{c.ltv.toFixed(0)}
                  </td>
                  <td style={{ padding: '10px 12px', ...MONO, fontSize: '10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('fi') : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {c.lastOrderStatus && (
                      <span style={{
                        ...MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '2px 8px', border: '1px solid var(--ink)',
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
