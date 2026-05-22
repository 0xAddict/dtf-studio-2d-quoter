/**
 * AdminOrderDetailPage — /admin/orders/:id
 * M4: Full order detail — lines/files/customer/payment/Trello link/status history/notes.
 * Tabs: Line items, Files, Status history, Notes, Customer info
 * Sidebar: Trello link, Stripe link, admin actions (requires_payment toggle, cancel)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase/client';
import { getOrder, adminSetRequiresPayment, DtfOrder, statusLabel } from '../../services/supabase/orders';

type Tab = 'lines' | 'files' | 'history' | 'notes' | 'customer';

interface StatusHistoryRow {
  id: number;
  order_id: string;
  from_status: string | null;
  to_status: string;
  source: string;
  actor_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface NoteRow {
  id: number;
  order_id: string;
  admin_id: string;
  body: string;
  created_at: string;
}

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };

const SOURCE_LABELS: Record<string, string> = {
  customer: 'Asiakas',
  admin: 'Admin',
  trello_webhook: 'Trello',
  stripe_webhook: 'Stripe',
  system: 'Järjestelmä',
};

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session, user } = useAuth();
  const adminId = session?.user?.id ?? null;

  const [order, setOrder] = useState<DtfOrder | null>(null);
  const [history, setHistory] = useState<StatusHistoryRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('lines');

  // Note compose
  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Override
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [orderRes, histRes, notesRes] = await Promise.all([
      supabase.from('dtf_orders').select('*').eq('id', id).single(),
      supabase.from('dtf_order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: true }),
      supabase.from('dtf_order_notes').select('*').eq('order_id', id).order('created_at', { ascending: true }),
    ]);

    if (orderRes.data) setOrder(orderRes.data as DtfOrder);
    if (histRes.data) setHistory(histRes.data as StatusHistoryRow[]);
    if (notesRes.data) setNotes(notesRes.data as NoteRow[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAddNote = async () => {
    if (!noteBody.trim() || !id || !adminId) return;
    setSavingNote(true);
    setNoteError(null);

    const { data, error } = await supabase
      .from('dtf_order_notes')
      .insert({ order_id: id, admin_id: adminId, body: noteBody.trim() })
      .select()
      .single();

    if (error) {
      setNoteError(error.message);
    } else {
      setNotes(prev => [...prev, data as NoteRow]);
      setNoteBody('');
      // Append status history
      await supabase.from('dtf_order_status_history').insert({
        order_id: id,
        from_status: order?.status ?? null,
        to_status: order?.status ?? 'unknown',
        source: 'admin',
        actor_id: adminId,
        metadata: { note: 'admin_note_added' },
      });
    }

    setSavingNote(false);
  };

  const handleRequiresPaymentToggle = async (newValue: boolean) => {
    if (!id) return;
    setOverrideLoading(true);
    setOverrideMsg(null);
    const result = await adminSetRequiresPayment(id, newValue);
    if (result.ok) {
      setOrder(prev => prev ? { ...prev, requires_payment: newValue } : prev);
      setOverrideMsg(`Asetettu: ${newValue ? 'Maksu vaaditaan' : 'Laskutus (ei maksua)'}`);
    } else {
      setOverrideMsg(`Virhe: ${result.error}`);
    }
    setOverrideLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ ...MONO, fontSize: '11px', padding: '32px 0', color: '#666' }}>Ladataan…</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div style={{ border: '1px solid #b22222', padding: '16px', background: '#fff0f0', ...MONO, fontSize: '11px', color: '#b22222' }}>
          Tilausta ei löydy: {id}
        </div>
        <Link to="/admin/orders" style={{ ...MONO, fontSize: '11px', color: '#b22222', textDecoration: 'underline', display: 'block', marginTop: '16px' }}>
          ← Takaisin tilauksiin
        </Link>
      </AdminLayout>
    );
  }

  const lineItems = (order.files ?? []) as Array<{ name: string; url: string }>;
  const sizeCm = order.size_cm as { width?: number; height?: number; quantity?: number } | null;

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <Link to="/admin/orders" style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b22222', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
        ← Tilaukset
      </Link>

      {/* Order header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b22222', marginBottom: '4px' }}>
            Tilaus
          </div>
          <h1 style={{ ...SERIF, fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px 0' }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ ...MONO, fontSize: '11px', color: '#666' }}>{order.customer_email}</span>
            <span style={{ ...MONO, fontSize: '10px', padding: '2px 8px', border: '1px solid #1a1a1a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {statusLabel(order.status)}
            </span>
            <span style={{ ...MONO, fontSize: '12px', fontWeight: 700, color: '#b22222' }}>
              €{Number(order.quote_eur).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Sidebar actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
          {order.trello_card_id && (
            <a
              href={`https://trello.com/c/${order.trello_card_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
                padding: '8px 12px', minHeight: '44px', border: '2px solid #1a1a1a',
                background: '#f4e4bc', color: '#1a1a1a', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              Trello ↗
            </a>
          )}
          {order.stripe_session_id && (
            <a
              href={`https://dashboard.stripe.com/payments`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
                padding: '8px 12px', minHeight: '44px', border: '2px solid #635bff',
                background: '#f4e4bc', color: '#635bff', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              Stripe ↗
            </a>
          )}
        </div>
      </div>

      <div style={{ width: '48px', height: '2px', background: '#b22222', marginBottom: '24px' }} />

      {/* Main layout: content + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

        {/* Tabs */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '2px solid #1a1a1a', marginBottom: '20px', overflowX: 'auto' }}>
            {(['lines','files','history','notes','customer'] as Tab[]).map(t => {
              const labels = { lines: 'Tuote', files: 'Tiedostot', history: 'Historia', notes: 'Muistiinpanot', customer: 'Asiakas' };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    ...MONO, fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase',
                    padding: '10px 16px', minHeight: '44px', border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: tab === t ? '#b22222' : '#1a1a1a',
                    borderBottom: tab === t ? '2px solid #b22222' : '2px solid transparent',
                    marginBottom: '-2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {labels[t]}
                  {t === 'notes' && notes.length > 0 && (
                    <span style={{ marginLeft: '6px', background: '#b22222', color: '#f4e4bc', borderRadius: '9px', padding: '0 5px', fontSize: '9px' }}>
                      {notes.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab: Lines */}
          {tab === 'lines' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ border: '2px solid #1a1a1a', background: '#e8d8b0', padding: '16px 20px' }}>
                <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '12px' }}>Tilauksen tiedot</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                  {[
                    ['Arkkeja', `${order.sheet_count} kpl`],
                    ['Materiaali', order.material ?? '—'],
                    ['Leveys', sizeCm?.width ? `${sizeCm.width} cm` : '—'],
                    ['Korkeus', sizeCm?.height ? `${sizeCm.height} cm` : '—'],
                    ['Kappalemäärä', sizeCm?.quantity ?? '—'],
                    ['Alennus', order.discount_amount_cents > 0 ? `€${(order.discount_amount_cents / 100).toFixed(2)}` : '—'],
                    ['Tilauksen hinta', `€${Number(order.quote_eur).toFixed(2)}`],
                    ['Maksu', order.payment_status],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase', color: '#666', marginBottom: '2px' }}>{label}</div>
                      <div style={{ ...MONO, fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              {order.notes && (
                <div style={{ border: '1px solid #1a1a1a', padding: '12px 16px', background: '#f4e4bc' }}>
                  <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Asiakkaan muistiinpanot</div>
                  <div style={{ ...SERIF, fontSize: '14px', color: '#1a1a1a' }}>{order.notes}</div>
                </div>
              )}
              {order.internal_notes && (
                <div style={{ border: '1px dashed #b22222', padding: '12px 16px', background: '#f4e4bc' }}>
                  <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b22222', marginBottom: '8px' }}>Sisäiset muistiinpanot</div>
                  <div style={{ ...SERIF, fontSize: '14px', color: '#1a1a1a' }}>{order.internal_notes}</div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Files */}
          {tab === 'files' && (
            <div>
              {lineItems.length === 0 ? (
                <div style={{ ...MONO, fontSize: '11px', color: '#666', padding: '24px', border: '1px solid #e8d8b0', textAlign: 'center' }}>
                  Ei tiedostoja tallennettu.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                  {lineItems.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        border: '2px solid #1a1a1a',
                        padding: '12px',
                        background: '#f4e4bc',
                        textDecoration: 'none',
                        color: '#1a1a1a',
                      }}
                    >
                      <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b22222', marginBottom: '4px' }}>Tiedosto {i + 1}</div>
                      <div style={{ ...MONO, fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Status History */}
          {tab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.length === 0 ? (
                <div style={{ ...MONO, fontSize: '11px', color: '#666', padding: '24px', border: '1px solid #e8d8b0', textAlign: 'center' }}>
                  Ei tilahistoriaa.
                </div>
              ) : (
                history.map(row => (
                  <div key={row.id} style={{ border: '1px solid #e8d8b0', padding: '12px 16px', background: '#f4e4bc', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'start' }}>
                    <div>
                      <div style={{ ...MONO, fontSize: '11px', fontWeight: 600 }}>
                        {row.from_status ? `${row.from_status} → ${row.to_status}` : `→ ${row.to_status}`}
                      </div>
                      <div style={{ ...MONO, fontSize: '10px', color: '#666', marginTop: '2px' }}>
                        {SOURCE_LABELS[row.source] ?? row.source}
                      </div>
                    </div>
                    <div style={{ ...MONO, fontSize: '10px', color: '#999', whiteSpace: 'nowrap' }}>
                      {new Date(row.created_at).toLocaleString('fi')}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Notes */}
          {tab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notes.map(note => (
                <div key={note.id} style={{ border: '1px solid #e8d8b0', padding: '12px 16px', background: '#f4e4bc' }}>
                  <div style={{ ...SERIF, fontSize: '14px', color: '#1a1a1a', marginBottom: '8px' }}>{note.body}</div>
                  <div style={{ ...MONO, fontSize: '10px', color: '#999' }}>
                    {new Date(note.created_at).toLocaleString('fi')}
                  </div>
                </div>
              ))}

              {/* Add note */}
              <div style={{ border: '2px solid #1a1a1a', padding: '16px', background: '#e8d8b0' }}>
                <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '10px' }}>Lisää muistiinpano</div>
                <textarea
                  value={noteBody}
                  onChange={e => setNoteBody(e.target.value)}
                  rows={3}
                  placeholder="Sisäinen muistiinpano…"
                  style={{
                    ...SERIF, fontSize: '14px', width: '100%', padding: '10px 14px',
                    border: '2px solid #1a1a1a', background: '#f4e4bc', color: '#1a1a1a',
                    outline: 'none', resize: 'vertical', borderRadius: '2px', boxSizing: 'border-box',
                  }}
                />
                {noteError && <div style={{ ...MONO, fontSize: '11px', color: '#b22222', marginTop: '6px' }}>{noteError}</div>}
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteBody.trim()}
                  style={{
                    ...MONO, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '8px 16px', minHeight: '44px', marginTop: '8px',
                    border: '2px solid #1a1a1a', background: '#1a1a1a', color: '#f4e4bc',
                    cursor: savingNote || !noteBody.trim() ? 'default' : 'pointer',
                    opacity: savingNote || !noteBody.trim() ? 0.5 : 1,
                  }}
                >
                  {savingNote ? 'Tallennetaan…' : 'Tallenna'}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Customer */}
          {tab === 'customer' && (
            <div style={{ border: '2px solid #1a1a1a', padding: '20px', background: '#e8d8b0' }}>
              <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '16px' }}>Asiakastiedot</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  ['Sähköposti', order.customer_email],
                  ['Nimi', order.customer_name ?? '—'],
                  ['Asiakas-ID', order.customer_id ?? 'Ei rekisteröitynyt'],
                  ['Admin tilaus', order.created_by_admin ? 'Kyllä' : 'Ei'],
                ].map(([label, val]) => (
                  <div key={label as string} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                    <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase', color: '#666' }}>{label}</div>
                    <div style={{ ...MONO, fontSize: '12px', fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
                <Link
                  to={`/admin/orders?q=${encodeURIComponent(order.customer_email)}`}
                  style={{ ...MONO, fontSize: '11px', color: '#b22222', textDecoration: 'underline', display: 'block', marginTop: '8px' }}
                >
                  Kaikki tilaukset → {order.customer_email}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Payment + status summary */}
          <div style={{ border: '2px solid #1a1a1a', padding: '16px', background: '#e8d8b0' }}>
            <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '12px' }}>Maksutilanne</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ ...MONO, fontSize: '10px', color: '#999', marginBottom: '2px' }}>Maksu</div>
                <div style={{ ...MONO, fontSize: '12px', fontWeight: 700, color: order.payment_status === 'paid' ? '#14532d' : '#1a1a1a' }}>
                  {order.payment_status === 'paid' ? 'Maksettu ✓' : order.payment_status === 'invoice_pending' ? 'Lasku odottaa' : order.payment_status === 'none' ? 'Ei maksettu' : order.payment_status}
                </div>
              </div>
              {order.confirmed_at && (
                <div>
                  <div style={{ ...MONO, fontSize: '10px', color: '#999', marginBottom: '2px' }}>Vahvistettu</div>
                  <div style={{ ...MONO, fontSize: '12px' }}>{new Date(order.confirmed_at).toLocaleString('fi')}</div>
                </div>
              )}
              <div>
                <div style={{ ...MONO, fontSize: '10px', color: '#999', marginBottom: '2px' }}>Hinta</div>
                <div style={{ ...MONO, fontSize: '16px', fontWeight: 700, color: '#b22222' }}>€{Number(order.quote_eur).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Admin override: requires_payment */}
          {order.status === 'quote' && (
            <div style={{ border: '1px dashed #b22222', padding: '16px', background: '#f4e4bc' }}>
              <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b22222', marginBottom: '10px' }}>
                Admin — maksun vaatimus
              </div>
              <div style={{ ...MONO, fontSize: '11px', color: '#1a1a1a', marginBottom: '10px' }}>
                {order.requires_payment ? 'Vaaditaan maksu' : 'Laskutus (ei maksua)'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => handleRequiresPaymentToggle(true)}
                  disabled={overrideLoading || order.requires_payment === true}
                  style={{
                    ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
                    padding: '8px 12px', minHeight: '44px',
                    border: '2px solid #1a1a1a',
                    background: order.requires_payment ? '#1a1a1a' : '#f4e4bc',
                    color: order.requires_payment ? '#f4e4bc' : '#1a1a1a',
                    cursor: overrideLoading ? 'wait' : 'pointer',
                    opacity: overrideLoading ? 0.6 : 1,
                  }}
                >
                  Vaadi maksu
                </button>
                <button
                  onClick={() => handleRequiresPaymentToggle(false)}
                  disabled={overrideLoading || order.requires_payment === false}
                  style={{
                    ...MONO, fontSize: '10px', letterSpacing: '0.10em', textTransform: 'uppercase',
                    padding: '8px 12px', minHeight: '44px',
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
                <div style={{ ...MONO, fontSize: '10px', color: overrideMsg.startsWith('Virhe') ? '#b22222' : '#14532d', marginTop: '8px' }}>
                  {overrideMsg}
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div style={{ border: '1px solid #e8d8b0', padding: '12px', background: '#f4e4bc' }}>
            <div style={{ ...MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Metatiedot</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                ['Luotu', new Date(order.created_at).toLocaleString('fi')],
                ['Päivitetty', new Date(order.updated_at).toLocaleString('fi')],
                ['Admin tilaus', order.created_by_admin ? 'Kyllä' : 'Ei'],
              ].map(([label, val]) => (
                <div key={label as string} style={{ display: 'grid', gridTemplateColumns: '80px 1fr' }}>
                  <div style={{ ...MONO, fontSize: '9px', letterSpacing: '0.10em', textTransform: 'uppercase', color: '#999' }}>{label}</div>
                  <div style={{ ...MONO, fontSize: '10px', color: '#1a1a1a' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
