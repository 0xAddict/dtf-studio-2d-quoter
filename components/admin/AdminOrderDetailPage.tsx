/**
 * AdminOrderDetailPage — /admin/orders/:id
 * M2: admin override toggle for requires_payment.
 * Full detail view (lines/files/history/notes) shipped in M4.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { getOrder, adminSetRequiresPayment, DtfOrder } from '../../services/supabase/orders';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<DtfOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getOrder(id).then(({ data }) => {
      setOrder(data);
      setLoading(false);
    });
  }, [id]);

  const handleRequiresPaymentToggle = async (newValue: boolean) => {
    if (!id) return;
    setOverrideLoading(true);
    setOverrideMsg(null);
    const result = await adminSetRequiresPayment(id, newValue);
    if (result.ok) {
      setOrder(prev => prev ? { ...prev, requires_payment: newValue } : prev);
      setOverrideMsg(`requires_payment asetettu: ${newValue ? 'Kyllä' : 'Ei'}`);
    } else {
      setOverrideMsg(`Virhe: ${result.error}`);
    }
    setOverrideLoading(false);
  };

  const kicker: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#b22222', marginBottom: '8px' };
  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#1a1a1a' };
  const card: React.CSSProperties = { border: '2px solid #1a1a1a', background: '#f4e4bc', padding: '20px 24px', marginBottom: '16px' };

  return (
    <AdminLayout>
      <div style={kicker}>02 · Tilaukset / Yksityiskohta</div>
      <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0' }}>
        Tilaus #{id?.slice(0, 8).toUpperCase()}
      </h1>
      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '24px' }} />

      {loading ? (
        <div style={{ ...mono, padding: '16px 0' }}>Ladataan…</div>
      ) : !order ? (
        <div style={{ border: '1px solid #b22222', padding: '16px 20px', background: '#fff0f0', ...mono }}>
          Tilausta ei löydy.
        </div>
      ) : (
        <>
          {/* Order summary */}
          <div style={card}>
            <div style={{ ...kicker, marginBottom: '16px' }}>Yhteenveto</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {[
                ['Asiakas', order.customer_email],
                ['Hinta', `€${Number(order.quote_eur).toFixed(2)}`],
                ['Tila', order.status],
                ['Maksu', order.payment_status],
                ['Vahvistettu', order.confirmed_at ? new Date(order.confirmed_at).toLocaleDateString('fi') : '—'],
                ['Trello-kortti', order.trello_card_id ? order.trello_card_id.slice(0, 12) + '…' : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ ...mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '2px' }}>{label}</div>
                  <div style={{ ...mono, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin override: requires_payment — only show when status is quote */}
          {order.status === 'quote' && (
            <div style={card}>
              <div style={{ ...kicker, marginBottom: '12px' }}>Admin: maksun vaatimus</div>
              <div style={{ ...mono, marginBottom: '16px' }}>
                Nykyinen arvo: <strong>{order.requires_payment ? 'Maksu vaaditaan' : 'Ei vaadita maksua (lasku)'}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                <button
                  onClick={() => handleRequiresPaymentToggle(true)}
                  disabled={overrideLoading || order.requires_payment === true}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase' as const,
                    padding: '8px 16px',
                    minHeight: '44px',
                    border: '2px solid #1a1a1a',
                    background: order.requires_payment ? '#1a1a1a' : '#f4e4bc',
                    color: order.requires_payment ? '#f4e4bc' : '#1a1a1a',
                    cursor: overrideLoading ? 'wait' : 'pointer',
                    opacity: overrideLoading ? 0.6 : 1,
                  }}
                >
                  Maksu vaaditaan
                </button>
                <button
                  onClick={() => handleRequiresPaymentToggle(false)}
                  disabled={overrideLoading || order.requires_payment === false}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase' as const,
                    padding: '8px 16px',
                    minHeight: '44px',
                    border: '2px solid #1a1a1a',
                    background: !order.requires_payment ? '#1a1a1a' : '#f4e4bc',
                    color: !order.requires_payment ? '#f4e4bc' : '#1a1a1a',
                    cursor: overrideLoading ? 'wait' : 'pointer',
                    opacity: overrideLoading ? 0.6 : 1,
                  }}
                >
                  Laskutus (ei maksua)
                </button>
              </div>
              {overrideMsg && (
                <div style={{ ...mono, marginTop: '12px', color: overrideMsg.startsWith('Virhe') ? '#b22222' : '#1a1a1a' }}>
                  {overrideMsg}
                </div>
              )}
            </div>
          )}

          {/* M4 content placeholder */}
          <div style={{ ...mono, border: '1px solid #1a1a1a', padding: '16px 20px', background: '#e8d8b0', marginBottom: '16px' }}>
            Rivit / tiedostot / tilahistoria / muistiinpanot ladataan Milestone 4:ssa.
          </div>
        </>
      )}

      <Link to="/admin/orders" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#b22222', textDecoration: 'underline' }}>
        ← Takaisin tilauksiin
      </Link>
    </AdminLayout>
  );
};
