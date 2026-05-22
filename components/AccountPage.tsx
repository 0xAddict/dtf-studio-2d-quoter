import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Loader2,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getOrders,
  shortOrderId,
  statusLabel,
  DtfOrder,
} from '../services/supabase/orders';

// ---------------------------------------------------------------
// Tilaukset-sivu — DTF Studio Helsinki asiakasportaali
// ---------------------------------------------------------------

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

/** Maps order status to stamp style class */
function statusStampClass(status: string): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'pending' || s === 'new') return 'status-stamp status-stamp--pending';
  if (s === 'processing' || s === 'active') return 'status-stamp status-stamp--active';
  if (s === 'completed' || s === 'done') return 'status-stamp status-stamp--done';
  return 'status-stamp status-stamp--pending';
}

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState<DtfOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await getOrders(user.id);
    if (err) {
      setError('Tilausten lataus epäonnistui. Yritä uudelleen.');
    } else {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--paper)', fontFamily: 'var(--serif)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{ background: 'var(--paper)', borderBottom: '2px solid var(--ink)' }}
      >
        <div
          className="max-w-5xl mx-auto px-4"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: '2px solid var(--ink)',
              borderRadius: '2px',
              cursor: 'pointer',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Takaisin"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--ink)' }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}
            >
              Tilaukset
            </h1>
            <p className="kicker" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '2px solid var(--ink)',
              borderRadius: '2px',
              cursor: 'pointer',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.5 : 1,
              flexShrink: 0,
            }}
            aria-label="Päivitä"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              style={{ color: 'var(--ink)' }}
            />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4" style={{ padding: '24px 16px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--crimson)' }} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="error-panel" style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '12px' }}>{error}</p>
            <button onClick={load} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
              Yritä uudelleen
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div
            className="brand-card"
            style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                border: '2px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag className="w-8 h-8" style={{ color: 'var(--ink)' }} />
            </div>
            <div>
              <p className="kicker kicker--crimson" style={{ marginBottom: '4px' }}>TILAUSHISTORIA</p>
              <h3
                style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}
              >
                Ei tilauksia vielä
              </h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto' }}>
                Kun lähetät tarjouspyynnön, se näkyy täällä tilaushistoriana.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
              style={{ marginTop: '8px' }}
            >
              LÄHETÄ TARJOUSPYYNTÖ
            </button>
          </div>
        )}

        {/* Orders table */}
        {!loading && !error && orders.length > 0 && (
          <div
            className="brand-card"
            style={{ overflow: 'hidden' }}
          >
            {/* Page kicker */}
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--paper-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <p className="kicker">TILAUKSET — {orders.length} KPL</p>
            </div>

            {/* Desktop table */}
            <div
              className="hidden sm:block"
              style={{ overflowX: 'auto' }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--ink)', background: 'var(--paper)' }}>
                    {['TILAUS-ID', 'PÄIVÄMÄÄRÄ', 'HINTA (€)', 'TILA', 'GANG SHEET', ''].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '10px 20px',
                          textAlign: i === 2 ? 'right' : i === 3 ? 'center' : 'left',
                          fontFamily: 'var(--mono)',
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: 'var(--ink-soft)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: i < orders.length - 1 ? '1px solid var(--paper-2)' : 'none',
                        background: i % 2 === 0 ? 'transparent' : 'var(--paper)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--field)')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--paper)')}
                    >
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink)' }}>
                        DTF-{shortOrderId(order.id)}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--serif)', color: 'var(--ink)' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--ink)' }}>
                        {Number(order.quote_eur).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span className={statusStampClass(order.status)}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {order.gang_sheet_url ? (
                          <a
                            href={order.gang_sheet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'var(--mono)',
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: 'var(--crimson)',
                              textDecoration: 'none',
                            }}
                          >
                            <Package className="w-3.5 h-3.5" />
                            Lataa PDF
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <Link
                          to={`/account/orders/${order.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: 'var(--mono)',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--crimson)',
                            textDecoration: 'none',
                          }}
                        >
                          Näytä
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div
              className="sm:hidden"
              style={{ borderTop: '1px solid var(--paper-2)' }}
            >
              {orders.map((order, i) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: i < orders.length - 1 ? '1px solid var(--paper-2)' : 'none',
                    textDecoration: 'none',
                    background: 'transparent',
                    transition: 'background 0.1s',
                    minHeight: '64px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      DTF-{shortOrderId(order.id)}
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-soft)' }}>
                      {formatDate(order.created_at)} · {order.sheet_count} A3
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px' }}>
                    <span className={statusStampClass(order.status)}>
                      {statusLabel(order.status)}
                    </span>
                    <span style={{
                      fontFamily: 'var(--serif)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}>
                      {Number(order.quote_eur).toFixed(0)} €
                    </span>
                    <ExternalLink className="w-4 h-4" style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AccountPage;
