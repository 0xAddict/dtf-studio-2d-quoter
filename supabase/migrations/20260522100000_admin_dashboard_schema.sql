-- sprint-admin-v1: Admin dashboard schema
-- M1: 8 new dtf_orders cols + 4 new tables + self-attach trigger + RLS
-- Created 2026-05-22

-- ============================================================
-- 1. Extend dtf_orders with 8 new columns (additive, no breaking changes)
-- ============================================================

ALTER TABLE public.dtf_orders
  ADD COLUMN IF NOT EXISTS created_by_admin      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_payment       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_status         text NOT NULL DEFAULT 'none'
    CHECK (payment_status IN ('none','invoice_pending','paid','refunded','failed')),
  ADD COLUMN IF NOT EXISTS stripe_session_id      text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent  text,
  ADD COLUMN IF NOT EXISTS trello_card_id          text,
  ADD COLUMN IF NOT EXISTS internal_notes         text,
  ADD COLUMN IF NOT EXISTS discount_amount_cents  int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmed_at           timestamptz,
  ADD COLUMN IF NOT EXISTS admin_id               uuid REFERENCES auth.users(id);

-- Update status constraint to include full lifecycle states from design §2
-- Drop old constraint if it only had a subset of values
ALTER TABLE public.dtf_orders
  DROP CONSTRAINT IF EXISTS dtf_orders_status_check;

ALTER TABLE public.dtf_orders
  ADD CONSTRAINT dtf_orders_status_check
    CHECK (status IN ('quote','new','confirmed','in_design','in_production','packed','shipped','delivered','cancelled'));

-- Indexes for new cols
CREATE INDEX IF NOT EXISTS dtf_orders_payment_status_idx ON public.dtf_orders(payment_status);
CREATE INDEX IF NOT EXISTS dtf_orders_admin_id_idx ON public.dtf_orders(admin_id);

-- ============================================================
-- 2. dtf_order_status_history — append-only audit log
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dtf_order_status_history (
  id          bigserial PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES public.dtf_orders(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  source      text NOT NULL CHECK (source IN ('customer','admin','trello_webhook','stripe_webhook','system')),
  actor_id    uuid,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dtf_order_status_history_order_idx
  ON public.dtf_order_status_history(order_id, created_at DESC);

ALTER TABLE public.dtf_order_status_history ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; admins can read; status is written server-side
DROP POLICY IF EXISTS "service_role_all" ON public.dtf_order_status_history;
CREATE POLICY "service_role_all" ON public.dtf_order_status_history
  FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "admin_read_status_history" ON public.dtf_order_status_history;
CREATE POLICY "admin_read_status_history" ON public.dtf_order_status_history
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "customer_read_own_status_history" ON public.dtf_order_status_history;
CREATE POLICY "customer_read_own_status_history" ON public.dtf_order_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dtf_orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

-- ============================================================
-- 3. dtf_order_notes — admin free-text threaded notes per order
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dtf_order_notes (
  id         bigserial PRIMARY KEY,
  order_id   uuid NOT NULL REFERENCES public.dtf_orders(id) ON DELETE CASCADE,
  admin_id   uuid NOT NULL REFERENCES auth.users(id),
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dtf_order_notes_order_idx
  ON public.dtf_order_notes(order_id, created_at DESC);

ALTER TABLE public.dtf_order_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.dtf_order_notes;
CREATE POLICY "service_role_all" ON public.dtf_order_notes
  FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "admin_all_notes" ON public.dtf_order_notes;
CREATE POLICY "admin_all_notes" ON public.dtf_order_notes
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 4. dtf_trello_status_map — Trello list → status mapping
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dtf_trello_status_map (
  list_id    text PRIMARY KEY,
  status     text NOT NULL,
  position   int NOT NULL,
  is_active  boolean NOT NULL DEFAULT true
);

ALTER TABLE public.dtf_trello_status_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.dtf_trello_status_map;
CREATE POLICY "service_role_all" ON public.dtf_trello_status_map
  FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "admin_all_trello_map" ON public.dtf_trello_status_map;
CREATE POLICY "admin_all_trello_map" ON public.dtf_trello_status_map
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Read-only for all authenticated (needed for webhook resolution)
DROP POLICY IF EXISTS "authenticated_read_trello_map" ON public.dtf_trello_status_map;
CREATE POLICY "authenticated_read_trello_map" ON public.dtf_trello_status_map
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 5. dtf_admin_notifications — notification feed
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dtf_admin_notifications (
  id         bigserial PRIMARY KEY,
  type       text NOT NULL,
  order_id   uuid REFERENCES public.dtf_orders(id),
  payload    jsonb NOT NULL,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dtf_admin_notifications_created_idx
  ON public.dtf_admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS dtf_admin_notifications_read_idx
  ON public.dtf_admin_notifications(read_at)
  WHERE read_at IS NULL;

ALTER TABLE public.dtf_admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.dtf_admin_notifications;
CREATE POLICY "service_role_all" ON public.dtf_admin_notifications
  FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "admin_all_notifications" ON public.dtf_admin_notifications;
CREATE POLICY "admin_all_notifications" ON public.dtf_admin_notifications
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 6. RLS additions on dtf_orders for admin-writable cols
-- ============================================================

-- Admin can read + write all orders
DROP POLICY IF EXISTS "admin_all_orders" ON public.dtf_orders;
CREATE POLICY "admin_all_orders" ON public.dtf_orders
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 7. Self-attach trigger: back-fill customer_id on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.attach_guest_orders_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dtf_orders
     SET customer_id = NEW.id
   WHERE customer_email = NEW.email
     AND customer_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_attach_orders ON auth.users;
CREATE TRIGGER on_auth_user_created_attach_orders
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.attach_guest_orders_on_signup();
