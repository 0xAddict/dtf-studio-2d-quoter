import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Package,
  Calendar,
  Layers,
  Tag,
  FileText,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Check,
} from 'lucide-react';
import {
  getOrder,
  shortOrderId,
  statusLabel,
  DtfOrder,
} from '../services/supabase/orders';
// tokens.css owned by epic 02-admin-branding — this component is a read-only
// consumer of --color-* aliases (set up in index.html :root from canonical tokens).

// ---------------------------------------------------------------
// Tilauksen tiedot -sivu — DTF Studio Helsinki asiakasportaali
// ---------------------------------------------------------------

// ── Status timeline — 4-step order progress tracker ──────────────
// Steps: Tilaus vastaanotettu → Maksu vahvistettu → Tuotannossa → Lähetetty
const TIMELINE_STEPS = [
  { key: 'received',  label: 'Tilaus\nvastaanotettu' },
  { key: 'paid',      label: 'Maksu\nvahvistettu' },
  { key: 'production', label: 'Tuotannossa' },
  { key: 'shipped',  label: 'Lähetetty' },
] as const;

type TimelineStepKey = typeof TIMELINE_STEPS[number]['key'];

/** Maps order status string to the furthest completed timeline step */
function statusToTimelineStep(status: string): TimelineStepKey {
  const s = (status ?? '').toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'shipped') return 'shipped';
  if (s === 'processing' || s === 'active' || s === 'in_production') return 'production';
  if (s === 'paid' || s === 'payment_confirmed') return 'paid';
  return 'received'; // pending, new, default
}

const STEP_ORDER: TimelineStepKey[] = ['received', 'paid', 'production', 'shipped'];

interface StatusTimelineProps {
  status: string;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  const activeStep = statusToTimelineStep(status);
  const activeIdx = STEP_ORDER.indexOf(activeStep);

  return (
    <div className="status-timeline" aria-label="Tilauksen eteneminen" role="list">
      {TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx < activeIdx;
        const isActive = idx === activeIdx;
        const stepClass = [
          'status-timeline__step',
          isDone ? 'status-timeline__step--done' : '',
          isActive ? 'status-timeline__step--active' : '',
        ].filter(Boolean).join(' ');

        return (
          <div key={step.key} className={stepClass} role="listitem" aria-current={isActive ? 'step' : undefined}>
            <div className="status-timeline__dot">
              {isDone && (
                <Check
                  style={{ width: '12px', height: '12px', color: 'var(--color-paper)', strokeWidth: 3 }}
                />
              )}
              {isActive && (
                <div
                  style={{ width: '8px', height: '8px', background: 'var(--color-accent)' }}
                />
              )}
            </div>
            <span className="status-timeline__label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

type FileEntry = { name: string; url: string };

/** Maps order status to stamp style class */
function statusStampClass(status: string): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'pending' || s === 'new') return 'status-stamp status-stamp--pending';
  if (s === 'processing' || s === 'active') return 'status-stamp status-stamp--active';
  if (s === 'completed' || s === 'done') return 'status-stamp status-stamp--done';
  return 'status-stamp status-stamp--pending';
}

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<DtfOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error: err } = await getOrder(id);
      if (err || !data) {
        setError('Tilausta ei löydy tai sinulla ei ole oikeutta katsella sitä.');
      } else {
        setOrder(data);
      }
      setLoading(false);
    })();
  }, [id]);

  const files: FileEntry[] = (() => {
    if (!order?.files) return [];
    if (Array.isArray(order.files)) return order.files as FileEntry[];
    return [];
  })();

  const isImage = (url: string) =>
    /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);

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
          className="max-w-3xl mx-auto"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}
        >
          <button
            onClick={() => navigate('/account')}
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
            aria-label="Takaisin tilauslistaan"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--ink)' }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
              {order ? `DTF-${shortOrderId(order.id)}` : 'Tilauksen tiedot'}
            </h1>
            {order && (
              <p className="kicker">Luotu {formatDate(order.created_at)}</p>
            )}
          </div>
          {order && (
            <span className={statusStampClass(order.status)}>
              {statusLabel(order.status)}
            </span>
          )}
        </div>
      </header>

      <main
        className="max-w-3xl mx-auto"
        style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="error-panel">
            <p style={{ marginBottom: '12px' }}>{error}</p>
            <button
              onClick={() => navigate('/account')}
              className="btn-ghost"
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              Takaisin tilauslistaan
            </button>
          </div>
        )}

        {order && !loading && (
          <>
            {/* Status timeline — Tilaus vastaanotettu → Maksu vahvistettu → Tuotannossa → Lähetetty */}
            <div className="brand-card" style={{ padding: '16px 20px 12px' }}>
              <p className="kicker" style={{ marginBottom: '4px', color: 'var(--color-accent)' }}>
                TILAUKSEN ETENEMINEN
              </p>
              <StatusTimeline status={order.status} />
            </div>

            {/* Summary card */}
            <div className="brand-card" style={{ padding: '20px 24px' }}>
              <p className="kicker kicker--crimson" style={{ marginBottom: '4px' }}>YHTEENVETO</p>
              <div className="section-header">Tilauksen tiedot</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
                className="sm:grid-cols-3"
              >
                <InfoItem icon={<Tag className="w-4 h-4" />} label="Tilaus-ID" value={`DTF-${shortOrderId(order.id)}`} mono />
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Tilauspäivä" value={formatDate(order.created_at)} />
                <InfoItem
                  icon={<Tag className="w-4 h-4" />}
                  label="Hinta"
                  value={`${Number(order.quote_eur).toFixed(2)} €`}
                  highlight
                />
                <InfoItem icon={<Layers className="w-4 h-4" />} label="A3-arkkeja" value={`${order.sheet_count} kpl`} />
                {order.material && (
                  <InfoItem icon={<Package className="w-4 h-4" />} label="Materiaali" value={order.material} />
                )}
                {order.size_cm && (
                  <InfoItem
                    icon={<Layers className="w-4 h-4" />}
                    label="Koko"
                    value={`${(order.size_cm as any).w ?? '—'} × ${(order.size_cm as any).h ?? '—'} cm`}
                  />
                )}
              </div>

              {order.notes && (
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--paper)', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'var(--serif)', fontSize: '0.875rem', color: 'var(--ink-soft)' }}>
                    <MessageSquare className="w-4 h-4" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p>{order.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Gang sheet download */}
            {order.gang_sheet_url && (
              <div className="brand-card" style={{ padding: '20px 24px' }}>
                <p className="kicker kicker--crimson" style={{ marginBottom: '4px' }}>TULOSTUSARKKI</p>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package className="w-4 h-4" />
                  Gang sheet PDF
                </div>
                <a
                  href={order.gang_sheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    fontSize: '12px',
                  }}
                >
                  <Download className="w-4 h-4" />
                  LATAA GANG SHEET PDF
                </a>
              </div>
            )}

            {/* Uploaded files */}
            {files.length > 0 && (
              <div className="brand-card" style={{ padding: '20px 24px' }}>
                <p className="kicker kicker--crimson" style={{ marginBottom: '4px' }}>TIEDOSTOT</p>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon className="w-4 h-4" />
                  Lähettämäsi tiedostot
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                  }}
                  className="sm:grid-cols-3"
                >
                  {files.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px',
                        border: '2px solid var(--ink)',
                        background: 'var(--paper)',
                        textDecoration: 'none',
                        transition: 'border-color 0.1s, background 0.1s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-accent)';
                        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--field)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-ink)';
                        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--paper)';
                      }}
                    >
                      {isImage(file.url) ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--paper-2)',
                          }}
                        >
                          <FileText className="w-8 h-8" style={{ color: 'var(--ink-soft)' }} />
                        </div>
                      )}
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        color: 'var(--ink-soft)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        {file.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// Small helper component
const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}> = ({ icon, label, value, mono, highlight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-soft)' }}>
      {icon}
      {label}
    </div>
    <p style={{
      fontFamily: mono ? 'var(--mono)' : 'var(--serif)',
      fontSize: '0.9rem',
      fontWeight: 600,
      color: highlight ? 'var(--color-accent)' : 'var(--ink)',
    }}>
      {value}
    </p>
  </div>
);

export default OrderDetailPage;
