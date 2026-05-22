-- sprint-customer-portal-v1: dtf_orders table for customer portal + Trello OMS sync
-- Created 2026-05-23

create table if not exists dtf_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  quote_eur numeric(10,2) not null,
  sheet_count int not null,
  material text,
  size_cm jsonb,
  files jsonb,
  gang_sheet_url text,
  status text not null default 'new' check (status in ('new','in_design','in_production','shipped','delivered','cancelled')),
  trello_card_id text,
  notes text
);

create index if not exists dtf_orders_customer_idx on dtf_orders(customer_id);
create index if not exists dtf_orders_status_idx on dtf_orders(status);
create index if not exists dtf_orders_created_at_idx on dtf_orders(created_at desc);

alter table dtf_orders enable row level security;

drop policy if exists "own_orders_select" on dtf_orders;
create policy "own_orders_select" on dtf_orders
  for select to authenticated
  using (auth.uid() = customer_id);

drop policy if exists "anon_insert" on dtf_orders;
create policy "anon_insert" on dtf_orders
  for insert to anon
  with check (true);

drop policy if exists "service_role_all" on dtf_orders;
create policy "service_role_all" on dtf_orders
  for all to service_role
  using (true);
