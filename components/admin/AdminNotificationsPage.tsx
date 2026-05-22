/**
 * AdminNotificationsPage — /admin/notifications
 * M5: Full notification feed with read/unread state, mark-as-read,
 * mark-all-read, filter by type. Realtime via Supabase subscription.
 */
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../services/supabase/client';

interface NotificationRow {
  id: number;
  type: string;
  order_id: string | null;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };

const TYPE_LABELS: Record<string, string> = {
  new_quote: 'Uusi tarjous',
  payment_received: 'Maksu vastaanotettu',
  trello_status_changed: 'Trello-päivitys',
  customer_signup_attached: 'Asiakas rekisteröityi',
};

const ALL_TYPES = Object.keys(TYPE_LABELS);

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const realtimeRef = useRef<any>(null);

  useEffect(() => {
    loadNotifications();
    setupRealtime();
    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
      }
    };
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('dtf_admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchErr) { setError(fetchErr.message); }
    else { setNotifications((data ?? []) as NotificationRow[]); }
    setLoading(false);
  }

  function setupRealtime() {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dtf_admin_notifications' },
        (payload) => {
          const newRow = payload.new as NotificationRow;
          setNotifications(prev => [newRow, ...prev]);
        }
      )
      .subscribe();
    realtimeRef.current = channel;
  }

  async function markRead(id: number) {
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from('dtf_admin_notifications')
      .update({ read_at: readAt })
      .eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: readAt } : n));
    }
  }

  async function markAllRead() {
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from('dtf_admin_notifications')
      .update({ read_at: readAt })
      .is('read_at', null);
    if (!error) {
      setNotifications(prev => prev.map(n => n.read_at ? n : { ...n, read_at: readAt }));
    }
  }

  const filtered = notifications.filter(n => {
    if (typeFilter && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = filtered.filter(n => !n.read_at).length;

  return (
    <AdminLayout>
      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>
        06 · Ilmoitukset
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          Ilmoitukset
          {unreadCount > 0 && (
            <span style={{
              ...MONO, fontSize: '12px', background: '#b22222', color: '#f4e4bc',
              padding: '2px 8px', marginLeft: '12px', verticalAlign: 'middle',
            }}>
              {unreadCount} lukematta
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '8px 16px', minHeight: '44px',
              border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
              cursor: 'pointer',
            }}
          >
            Merkitse kaikki luetuiksi
          </button>
        )}
      </div>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '24px' }} />

      {/* Type filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginRight: '4px' }}>Tyyppi:</span>
        <button
          onClick={() => setTypeFilter('')}
          style={{
            ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
            padding: '4px 10px', minHeight: '28px',
            border: '1px solid #1a1a1a',
            background: !typeFilter ? '#1a1a1a' : '#f4e4bc',
            color: !typeFilter ? '#f4e4bc' : '#1a1a1a',
            cursor: 'pointer',
          }}
        >
          Kaikki
        </button>
        {ALL_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
            style={{
              ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
              padding: '4px 10px', minHeight: '28px',
              border: '1px solid #1a1a1a',
              background: typeFilter === t ? '#1a1a1a' : '#f4e4bc',
              color: typeFilter === t ? '#f4e4bc' : '#1a1a1a',
              cursor: 'pointer',
            }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...MONO, fontSize: '11px', color: '#666', padding: '24px 0' }}>Ladataan…</div>
      ) : error ? (
        <div style={{ border: '1px solid #b22222', padding: '16px', background: '#fff0f0', ...MONO, fontSize: '11px', color: '#b22222' }}>Virhe: {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '2px solid #1a1a1a', padding: '32px', textAlign: 'center', ...MONO, fontSize: '11px', color: '#666' }}>
          Ei ilmoituksia.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(n => (
            <div
              key={n.id}
              style={{
                border: `2px solid ${n.read_at ? '#e8d8b0' : '#1a1a1a'}`,
                padding: '16px 20px',
                background: n.read_at ? '#f4e4bc' : '#fffbf0',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '16px',
                alignItems: 'start',
              }}
            >
              <div>
                {/* Type + unread dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {!n.read_at && (
                    <div style={{ width: '8px', height: '8px', background: '#b22222', borderRadius: '50%', flexShrink: 0 }} />
                  )}
                  <span style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b22222' }}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                </div>

                {/* Payload details */}
                <div style={{ ...SERIF, fontSize: '14px', color: '#1a1a1a', marginBottom: '6px' }}>
                  {n.payload?.customer_email && (
                    <span style={{ fontWeight: 600 }}>{n.payload.customer_email}</span>
                  )}
                  {n.payload?.quote_eur && (
                    <span style={{ color: '#b22222', fontWeight: 700 }}> — €{Number(n.payload.quote_eur).toFixed(2)}</span>
                  )}
                  {n.payload?.payment_status && (
                    <span style={{ ...MONO, fontSize: '11px', color: '#666', marginLeft: '8px' }}>({n.payload.payment_status})</span>
                  )}
                </div>

                {/* Order link */}
                {n.order_id && (
                  <Link
                    to={`/admin/orders/${n.order_id}`}
                    style={{ ...MONO, fontSize: '10px', color: '#b22222', textDecoration: 'underline' }}
                  >
                    Tilaus #{n.order_id.slice(0, 8).toUpperCase()} →
                  </Link>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', minWidth: '120px' }}>
                <div style={{ ...MONO, fontSize: '10px', color: '#999', whiteSpace: 'nowrap' }}>
                  {new Date(n.created_at).toLocaleString('fi')}
                </div>
                {!n.read_at && (
                  <button
                    onClick={() => markRead(n.id)}
                    style={{
                      ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
                      padding: '4px 10px', minHeight: '32px',
                      border: '1px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Merkitse luetuksi
                  </button>
                )}
                {n.read_at && (
                  <span style={{ ...MONO, fontSize: '10px', color: '#aaa' }}>Luettu</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
