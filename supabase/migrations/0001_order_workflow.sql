-- One Globe (OG) order workflow
-- Tables are only reached from the website's server code with the service-role key.
-- Row Level Security is ON with no policies, so the public (anon) key can't read or write anything.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ orders
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_no         text not null unique,                 -- e.g. OG-20261123-K7QX (shown to customers)
  access_key       text not null,                        -- secret in the customer's private link
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- customer
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text,
  team_name        text,

  -- what they want
  order_type       text,                                 -- Cricket Jersey, Rugby, Company Shirts, ...
  quantities       jsonb not null default '{}'::jsonb,   -- {"Male M": 10, "Kids S": 4, ...}
  total_qty        integer not null default 0,
  fabric           text,
  needed_by        date,
  details          text,                                 -- free text from the quote request

  -- workflow
  current_step     text not null default 'quote',
  step_status      text not null default 'waiting_team', -- who acts next: waiting_customer | waiting_team | done
  status           text not null default 'active',       -- active | completed | cancelled
  design_path      text,                                 -- own | request (chosen at step 2/3)
  skip_sample      boolean not null default false,
  production_stage text,                                 -- in_production | printing | stitching | quality_check | ready

  -- quote & payment (payment is marked by staff; no online payment)
  quote_amount     numeric(10,2),
  quote_note       text,
  payment_status   text not null default 'unpaid',       -- unpaid | deposit | paid

  -- shipping
  shipping_address jsonb,                                -- {name, line1, line2, city, state, zip, country, phone}
  carrier          text,
  tracking_number  text,
  shipped_at       timestamptz,
  delivered_at     timestamptz,

  -- feedback
  feedback_rating  smallint check (feedback_rating between 1 and 5),
  feedback_text    text,

  -- chat bookkeeping
  unread_for_staff integer not null default 0,
  unread_for_customer integer not null default 0,
  last_message_at  timestamptz
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_step_idx on public.orders (current_step, status);

-- ------------------------------------------------------------------ history: every action, by everyone
create table if not exists public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  created_at  timestamptz not null default now(),
  actor       text not null,            -- customer | owner | sales | production | system
  actor_name  text,
  step        text not null,            -- step key the action belongs to
  action      text not null,            -- machine name, e.g. quote_sent, design_approved
  label       text not null,            -- human wording shown in the timeline
  note        text,
  file_ids    uuid[] not null default '{}'
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- ------------------------------------------------------------------ chat with sales
create table if not exists public.order_messages (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  created_at  timestamptz not null default now(),
  sender      text not null,            -- customer | owner | sales | production
  sender_name text,
  body        text not null,
  file_ids    uuid[] not null default '{}'
);
create index if not exists order_messages_order_idx on public.order_messages (order_id, created_at);

-- ------------------------------------------------------------------ files (logos, designs, proofs, sample photos ...)
create table if not exists public.order_files (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  created_at    timestamptz not null default now(),
  uploaded_by   text not null,          -- customer | owner | sales | production
  kind          text not null,          -- logo | own_design | reference | proof | sample_photo | production_photo | chat | other
  storage_path  text not null,          -- path inside the private "order-files" bucket
  file_name     text not null,
  content_type  text,
  size_bytes    integer
);
create index if not exists order_files_order_idx on public.order_files (order_id, created_at);

-- ------------------------------------------------------------------ keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql
set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ lock everything down (server uses service role)
alter table public.orders          enable row level security;
alter table public.order_events    enable row level security;
alter table public.order_messages  enable row level security;
alter table public.order_files     enable row level security;

-- ------------------------------------------------------------------ private storage bucket for order files
insert into storage.buckets (id, name, public, file_size_limit)
values ('order-files', 'order-files', false, 15728640)   -- 15 MB per file
on conflict (id) do nothing;
