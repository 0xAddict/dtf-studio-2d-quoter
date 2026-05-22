import { supabase } from './client';

// ============================================================
// DTF Orders — service module for dtf_orders table
// ============================================================

export type DtfOrderStatus =
  | 'quote'
  | 'new'
  | 'confirmed'
  | 'in_design'
  | 'in_production'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type DtfPaymentStatus = 'none' | 'invoice_pending' | 'paid' | 'refunded' | 'failed';

export interface DtfOrder {
  id: string;
  customer_id: string | null;
  customer_email: string;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
  quote_eur: number;
  sheet_count: number;
  material: string | null;
  size_cm: Record<string, number> | null;
  files: Array<{ name: string; url: string }> | null;
  gang_sheet_url: string | null;
  status: DtfOrderStatus;
  trello_card_id: string | null;
  notes: string | null;
  // M2 admin fields
  created_by_admin: boolean;
  requires_payment: boolean;
  payment_status: DtfPaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  internal_notes: string | null;
  discount_amount_cents: number;
  confirmed_at: string | null;
  admin_id: string | null;
}

export interface DtfOrderInsert {
  customer_id?: string | null;
  customer_email: string;
  customer_name?: string | null;
  quote_eur: number;
  sheet_count: number;
  material?: string | null;
  size_cm?: Record<string, number> | null;
  files?: Array<{ name: string; url: string }> | null;
  gang_sheet_url?: string | null;
  status?: DtfOrderStatus;
  trello_card_id?: string | null;
  notes?: string | null;
}

/**
 * Get all orders for the currently authenticated user.
 * Returns [] when not logged in (no error).
 */
export async function getOrders(userId: string): Promise<{ data: DtfOrder[]; error: any }> {
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from('dtf_orders')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrders error:', error);
    return { data: [], error };
  }

  return { data: (data ?? []) as DtfOrder[], error: null };
}

/**
 * Get a single order by UUID.
 * Returns null when not found or RLS denies.
 */
export async function getOrder(id: string): Promise<{ data: DtfOrder | null; error: any }> {
  const { data, error } = await supabase
    .from('dtf_orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('getOrder error:', error);
    return { data: null, error };
  }

  return { data: data as DtfOrder | null, error: null };
}

/**
 * Short display ID — first 8 chars of UUID.
 */
export function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/**
 * One-click order confirm (no payment required).
 * Calls finalise-quote Netlify function with path=one_click.
 * Returns { ok, requires_payment, message } — if requires_payment=true, UI must redirect to Stripe.
 */
export async function confirmOrderOneClick(
  orderId: string,
  userId?: string | null
): Promise<{ ok: boolean; requires_payment?: boolean; message?: string; error?: string }> {
  const resp = await fetch('/api/finalise-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, path: 'one_click', actor_id: userId ?? null }),
  });

  const json = await resp.json().catch(() => ({ error: 'Network error' }));

  if (resp.status === 402) {
    // Requires payment — redirect to Stripe
    return { ok: false, requires_payment: true, message: json.message };
  }

  if (!resp.ok) {
    return { ok: false, error: json.error ?? 'Confirmation failed' };
  }

  return { ok: true };
}

/**
 * Start Stripe Checkout for an order.
 * Returns { ok, checkoutUrl } or { ok: false, blocked: true, message } if Stripe not yet configured.
 */
export async function startStripeCheckout(
  orderId: string
): Promise<{ ok: boolean; checkoutUrl?: string; blocked?: boolean; message?: string; error?: string }> {
  const resp = await fetch('/api/stripe-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  const json = await resp.json().catch(() => ({ error: 'Network error' }));

  if (resp.status === 503 && json.blocked) {
    return { ok: false, blocked: true, message: json.message };
  }

  if (!resp.ok) {
    return { ok: false, error: json.error ?? 'Stripe checkout failed' };
  }

  return { ok: true, checkoutUrl: json.checkoutUrl };
}

/**
 * Admin override: set requires_payment on an order.
 */
export async function adminSetRequiresPayment(
  orderId: string,
  requiresPayment: boolean
): Promise<{ ok: boolean; error?: string }> {
  const resp = await fetch('/api/finalise-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, path: 'admin_override', requires_payment: requiresPayment }),
  });

  const json = await resp.json().catch(() => ({ error: 'Network error' }));

  if (!resp.ok) return { ok: false, error: json.error ?? 'Override failed' };
  return { ok: true };
}

/**
 * Human-readable Finnish status label.
 */
export function statusLabel(status: DtfOrderStatus): string {
  const labels: Record<DtfOrderStatus, string> = {
    quote: 'Tarjous',
    new: 'Uusi',
    confirmed: 'Vahvistettu',
    in_design: 'Suunnittelussa',
    in_production: 'Tuotannossa',
    packed: 'Pakattu',
    shipped: 'Lähetetty',
    delivered: 'Toimitettu',
    cancelled: 'Peruutettu',
  };
  return labels[status] ?? status;
}

/**
 * Tailwind colour classes for status badge.
 */
export function statusColor(status: DtfOrderStatus): string {
  const colors: Record<DtfOrderStatus, string> = {
    quote: 'bg-gray-100 text-gray-700',
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    confirmed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    in_design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    in_production: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    packed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    shipped: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}
