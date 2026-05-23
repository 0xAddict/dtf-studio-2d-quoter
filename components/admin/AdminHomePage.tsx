/**
 * AdminHomePage — /admin root
 * M4: Stats grid (6 cards) + recent activity feed from dtf_admin_notifications.
 * Each stat card links to pre-filtered /admin/orders.
 * Brand tokens: var(--paper), var(--paper-2), var(--ink), var(--accent), var(--serif), var(--mono)
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../services/supabase/client';

interface StatsGrid {
  todayOrders: number;
  weekRevenue: number;
  inProduction: number;
  awaitingPayment: number;
  cancelledThisMonth: number;
  avgOrderValue: number;
}

interface NotificationRow {
  id: number;
  type: string;
  order_id: string | null;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

const MONO: React.CSSProperties = { fontFamily: 'var(--mono)' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--serif)' };

const TYPE_LABELS: Record<string, string> = {
  new_quote: 'Uusi tarjous',
  payment_received: 'Maksu vastaanotettu',
  trello_status_changed: 'Trello-päivitys',
  customer_signup_attached: 'Asiakas rekisteröityi',
};

function StatCard({ label, value, href, unit }: { label: string; value: string | number; href: string; unit?: string }) {
  return (
    <Link to={href} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        style={{
          border: '2px solid var(--ink)',
          background: 'var(--paper)',
          padding: '20px 24px',
          minHeight: '88px',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--paper-2)')}
        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--paper)')}
      >
        <div style={{
          ...MONO,
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          marginBottom: '12px',
        }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <div style={{
            ...MONO,
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--accent)',
            lineHeight: 1,
          }}>
            {value}
          </div>
          {unit && (
            <div style={{ ...MONO, fontSize: '11px', color: 'var(--muted)' }}>{unit}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

export const AdminHomePage: React.FC = () => {
  const [stats, setStats] = useState<StatsGrid | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgoStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [todayRes, weekRes, inProdRes, awaitingRes, cancelledRes, avg30Res, notifRes] = await Promise.all([
      supabase.from('dtf_orders').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('dtf_orders').select('quote_eur').eq('payment_status', 'paid').gte('created_at', weekAgoStr),
      supabase.from('dtf_orders').select('id', { count: 'exact', head: true }).eq('status', 'in_production'),
      supabase.from('dtf_orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'invoice_pending'),
      supabase.from('dtf_orders').select('id', { count: 'exact', head: true }).eq('status', 'cancelled').gte('created_at', monthAgoStr),
      supabase.from('dtf_orders').select('quote_eur').eq('payment_status', 'paid').gte('created_at', monthAgoStr),
      supabase.from('dtf_admin_notifications').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const weekRevenue = (weekRes.data ?? []).reduce((s, o) => s + Number(o.quote_eur), 0);
    const avg30dOrders = avg30Res.data ?? [];
    const avgOrderValue = avg30dOrders.length > 0
      ? avg30dOrders.reduce((s, o) => s + Number(o.quote_eur), 0) / avg30dOrders.length
      : 0;

    setStats({
      todayOrders: todayRes.count ?? 0,
      weekRevenue,
      inProduction: inProdRes.count ?? 0,
      awaitingPayment: awaitingRes.count ?? 0,
      cancelledThisMonth: cancelledRes.count ?? 0,
      avgOrderValue,
    });

    setNotifications((notifRes.data ?? []) as NotificationRow[]);
    setLoading(false);
  }

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
        01 · Yleiskatsaus
      </div>
      <h1 style={{ ...SERIF, fontSize: '28px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
        DTF Studio — Admin
      </h1>
      <div style={{ width: '48px', height: '2px', background: 'var(--accent)', marginBottom: '32px' }} />

      {/* Stats grid */}
      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: 'var(--muted)', padding: '24px 0' }}>Ladataan…</div>
      ) : stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <StatCard label="Tilauksia tänään" value={stats.todayOrders} href="/admin/orders?period=today" />
            <StatCard label="Viikon liikevaihto" value={`€${stats.weekRevenue.toFixed(0)}`} href="/admin/orders?payment=paid" />
            <StatCard label="Tuotannossa" value={stats.inProduction} href="/admin/orders?status=in_production" />
            <StatCard label="Odottaa maksua" value={stats.awaitingPayment} href="/admin/orders?payment=invoice_pending" />
            <StatCard label="Peruutettuja (30pv)" value={stats.cancelledThisMonth} href="/admin/orders?status=cancelled" />
            <StatCard label="Keskim. tilausarvo (30pv)" value={`€${stats.avgOrderValue.toFixed(0)}`} href="/admin/orders?payment=paid" unit="/ tilaus" />
          </div>

          {/* Recent activity */}
          <div>
            <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)', marginBottom: '16px', borderBottom: '1px solid var(--ink)', paddingBottom: '8px' }}>
              Viimeisimmät tapahtumat
            </div>

            {notifications.length === 0 ? (
              <div style={{ ...MONO, fontSize: '11px', color: 'var(--muted)', padding: '16px', border: '1px solid var(--paper-2)', background: 'var(--paper)' }}>
                Ei tapahtumia.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ border: '1px solid var(--paper-2)', padding: '12px 16px', background: n.read_at ? 'var(--paper)' : 'var(--field)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                    <div>
                      <div style={{ ...MONO, fontSize: '11px', fontWeight: n.read_at ? 400 : 700, color: 'var(--ink)' }}>
                        {TYPE_LABELS[n.type] ?? n.type}
                        {n.payload?.customer_email && (
                          <span style={{ color: 'var(--muted)', fontWeight: 400 }}> — {n.payload.customer_email}</span>
                        )}
                        {n.payload?.quote_eur && (
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}> €{Number(n.payload.quote_eur).toFixed(2)}</span>
                        )}
                      </div>
                      {n.order_id && (
                        <Link to={`/admin/orders/${n.order_id}`} style={{ ...MONO, fontSize: '10px', color: 'var(--accent)', textDecoration: 'underline' }}>
                          Tilaus #{n.order_id.slice(0, 8).toUpperCase()}
                        </Link>
                      )}
                    </div>
                    <div style={{ ...MONO, fontSize: '10px', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                      {new Date(n.created_at).toLocaleString('fi')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link to="/admin/notifications" style={{ ...MONO, fontSize: '11px', color: 'var(--accent)', textDecoration: 'underline', display: 'block', marginTop: '16px' }}>
              Kaikki ilmoitukset →
            </Link>
          </div>
        </>
      )}
    </AdminLayout>
  );
};
