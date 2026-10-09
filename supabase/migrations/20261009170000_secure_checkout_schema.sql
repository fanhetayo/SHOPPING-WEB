-- Secure checkout schema hardening and guarded data-preserving migration.
-- This migration is intentionally fail-closed: incompatible existing schemas,
-- legacy status checks, or unknown permissive product-image storage policies abort.

begin;

create extension if not exists pgcrypto;

do $$
declare
  r record;
begin
  for r in
    select n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('admin_users','products','settings','payment_methods','orders')
      and c.relkind = 'r'
  loop
    execute format('lock table %I.%I in access exclusive mode', r.nspname, r.relname);
  end loop;
end $$;

do $$
declare
  v_msg text;
  v_rows bigint;
begin
  with expected(table_name, column_name, udt_name, is_array) as (
    values
      ('admin_users','user_id','uuid',false), ('admin_users','created_at','timestamptz',false),
      ('products','id','uuid',false), ('products','title','text',false), ('products','price','int4',false),
      ('products','description','text',false), ('products','category','text',false), ('products','image_url','text',false),
      ('products','images','jsonb',false), ('products','variants','jsonb',false), ('products','is_active','bool',false),
      ('products','created_at','timestamptz',false), ('products','updated_at','timestamptz',false),
      ('settings','id','int4',false), ('settings','store_name','text',false), ('settings','banner_url','text',false),
      ('settings','categories','jsonb',false), ('settings','admin_phone','text',false),
      ('settings','midtrans_client_key','text',false), ('settings','midtrans_server_key','text',false),
      ('settings','midtrans_environment','text',false), ('settings','created_at','timestamptz',false), ('settings','updated_at','timestamptz',false),
      ('payment_methods','id','uuid',false), ('payment_methods','name','text',false), ('payment_methods','type','text',false),
      ('payment_methods','account_number','text',false), ('payment_methods','account_holder','text',false), ('payment_methods','qris_url','text',false),
      ('payment_methods','is_active','bool',false), ('payment_methods','created_at','timestamptz',false), ('payment_methods','updated_at','timestamptz',false),
      ('orders','id','uuid',false), ('orders','checkout_key','uuid',false), ('orders','request_hash','text',false),
      ('orders','snap_token','text',false), ('orders','snap_redirect_url','text',false), ('orders','payment_claimed_at','timestamptz',false),
      ('orders','customer_name','text',false), ('orders','customer_address','text',false), ('orders','customer_phone','text',false),
      ('orders','items','jsonb',false), ('orders','total_price','int4',false), ('orders','payment_method','text',false),
      ('orders','status','text',false), ('orders','midtrans_order_id','text',false), ('orders','midtrans_transaction_id','text',false),
      ('orders','paid_at','timestamptz',false), ('orders','created_at','timestamptz',false), ('orders','updated_at','timestamptz',false)
  ), existing as (
    select c.table_name, c.column_name, c.udt_name
    from information_schema.columns c
    join expected e using (table_name, column_name)
    where c.table_schema = 'public'
  )
  select string_agg(format('%I.%I is %s, expected %s', e.table_name, e.column_name, e.udt_name, x.udt_name), '; ')
  into v_msg
  from existing e
  join expected x using (table_name, column_name)
  where e.udt_name <> x.udt_name;

  if v_msg is not null then
    raise exception 'Incompatible existing schema: %', v_msg;
  end if;

  if to_regclass('public.orders') is not null then
    select string_agg(conrelid::regclass::text || '.' || conname, '; ')
    into v_msg
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
      and pg_get_constraintdef(oid) not ilike '%refunded%';

    if v_msg is not null then
      raise exception 'Incompatible legacy orders.status CHECK constraint(s): %. Drop/replace explicitly before applying.', v_msg;
    end if;

    select count(*) into v_rows from public.orders;
    if v_rows > 0 then
      with required(column_name) as (
        values ('customer_name'),('customer_address'),('customer_phone'),('items'),('total_price'),('payment_method'),('status')
      )
      select string_agg(r.column_name, ', ')
      into v_msg
      from required r
      left join information_schema.columns c
        on c.table_schema = 'public'
       and c.table_name = 'orders'
       and c.column_name = r.column_name
      where c.column_name is null;

      if v_msg is not null then
        raise exception 'Existing populated public.orders is missing required checkout columns: %. Add/backfill them before applying.', v_msg;
      end if;
    end if;
  end if;

  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and permissive = 'PERMISSIVE' and cmd in ('INSERT','UPDATE','DELETE','ALL')  and policyname not in ('Product images public read','Product images admin insert','Product images admin update','Product images admin delete')) then
    raise exception 'Unknown permissive storage.objects policy for products bucket found; review and remove/rename before applying.';
  end if;
end $$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price integer not null check (price >= 0),
  description text,
  category text,
  image_url text,
  images jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'ZYHA ID',
  banner_url text,
  categories jsonb not null default '[]'::jsonb,
  admin_phone text,
  midtrans_client_key text,
  midtrans_server_key text,
  midtrans_environment text not null default 'sandbox' check (midtrans_environment in ('sandbox','production')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Bank','E-Wallet','QRIS','Midtrans')),
  account_number text,
  account_holder text,
  qris_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  checkout_key uuid not null default gen_random_uuid(),
  request_hash text not null,
  snap_token text,
  snap_redirect_url text,
  payment_claimed_at timestamptz,
  customer_name text not null,
  customer_address text not null,
  customer_phone text not null,
  items jsonb not null,
  total_price integer not null check (total_price >= 0),
  payment_method text not null,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','expired','failed','refunded')),
  midtrans_order_id text unique,
  midtrans_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists description text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.settings add column if not exists store_name text not null default 'ZYHA ID';
alter table public.settings add column if not exists banner_url text;
alter table public.settings add column if not exists categories jsonb not null default '[]'::jsonb;
alter table public.settings add column if not exists admin_phone text;
alter table public.settings add column if not exists midtrans_client_key text;
alter table public.settings add column if not exists midtrans_server_key text;
alter table public.settings add column if not exists midtrans_environment text not null default 'sandbox';
alter table public.settings add column if not exists created_at timestamptz not null default now();
alter table public.settings add column if not exists updated_at timestamptz not null default now();
alter table public.payment_methods add column if not exists account_number text;
alter table public.payment_methods add column if not exists account_holder text;
alter table public.payment_methods add column if not exists qris_url text;
alter table public.payment_methods add column if not exists is_active boolean not null default true;
alter table public.payment_methods add column if not exists created_at timestamptz not null default now();
alter table public.payment_methods add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists checkout_key uuid not null default gen_random_uuid();
alter table public.orders add column if not exists request_hash text;
alter table public.orders add column if not exists snap_token text;
alter table public.orders add column if not exists snap_redirect_url text;
alter table public.orders add column if not exists payment_claimed_at timestamptz;
alter table public.orders add column if not exists midtrans_order_id text;
alter table public.orders add column if not exists midtrans_transaction_id text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

update public.orders set request_hash = coalesce(request_hash, 'legacy:' || id::text) where request_hash is null;
alter table public.orders alter column request_hash set not null;

alter table public.products alter column id set default gen_random_uuid();
alter table public.payment_methods alter column id set default gen_random_uuid();
alter table public.orders alter column id set default gen_random_uuid();
alter table public.orders alter column checkout_key set default gen_random_uuid();

create unique index if not exists products_id_uidx on public.products(id);
create unique index if not exists payment_methods_id_uidx on public.payment_methods(id);
create unique index if not exists orders_id_uidx on public.orders(id);
create unique index if not exists orders_checkout_key_uidx on public.orders(checkout_key);
create unique index if not exists orders_midtrans_order_id_uidx on public.orders(midtrans_order_id) where midtrans_order_id is not null;
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

insert into public.settings (id) values (1) on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(auth.uid() in (select au.user_id from public.admin_users au), false);
$$;

create or replace function public.claim_checkout(p_key uuid, p_hash text, p_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_created boolean := false;
begin
  if p_key is null or nullif(p_hash, '') is null or p_order is null then
    raise exception 'checkout key, hash, and order payload are required';
  end if;

  insert into public.orders (
    checkout_key, request_hash, customer_name, customer_address, customer_phone,
    items, total_price, payment_method, midtrans_order_id, status
  ) values (
    p_key,
    p_hash,
    p_order->>'customer_name',
    p_order->>'customer_address',
    p_order->>'customer_phone',
    coalesce(p_order->'items', '[]'::jsonb),
    (p_order->>'total_price')::integer,
    p_order->>'payment_method',
    p_order->>'midtrans_order_id',
    'pending'
  )
  on conflict (checkout_key) do nothing
  returning * into v_order;

  if found then
    v_created := true;
  else
    select * into v_order from public.orders where checkout_key = p_key for update;
    if v_order.request_hash <> p_hash then
      raise exception 'checkout request hash mismatch for key %', p_key;
    end if;
  end if;

  return jsonb_build_object('order', to_jsonb(v_order), 'created', v_created);
end;
$$;

create or replace function public.claim_payment(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_claimed boolean;
begin
  update public.orders
     set payment_claimed_at = now(), updated_at = now()
   where id = p_id
     and snap_token is null
     and payment_claimed_at is null
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.settings enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders enable row level security;

alter table public.admin_users force row level security;
alter table public.products force row level security;
alter table public.settings force row level security;
alter table public.payment_methods force row level security;
alter table public.orders force row level security;

do $$
declare
  r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('admin_users','products','settings','payment_methods','orders') loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

create policy "products public active read" on public.products for select to anon, authenticated using (is_active = true);
create policy "products admin all" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings public read" on public.settings for select to anon, authenticated using (id = 1);
create policy "settings admin all" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "payment methods public active read" on public.payment_methods for select to anon, authenticated using (is_active = true);
create policy "payment methods admin all" on public.payment_methods for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orders admin read" on public.orders for select to authenticated using (public.is_admin());
create policy "orders admin update" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin users self read" on public.admin_users for select to authenticated using (user_id = auth.uid());

-- Table-level REVOKE does not remove pre-existing column grants.
do $$
declare r record;
begin
  for r in select table_name, column_name from information_schema.columns
    where table_schema = 'public' and table_name in ('products','settings','payment_methods','orders','admin_users')
  loop
    execute format('revoke all (%I) on public.%I from public, anon, authenticated', r.column_name, r.table_name);
  end loop;
end $$;
revoke all on public.products, public.settings, public.payment_methods, public.orders, public.admin_users from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.claim_checkout(uuid,text,jsonb) from public, anon, authenticated;
revoke all on function public.claim_payment(uuid) from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_checkout(uuid,text,jsonb) to service_role;
grant execute on function public.claim_payment(uuid) to service_role;

grant select (id,title,price,description,category,image_url,images,variants,created_at,updated_at) on public.products to anon, authenticated;
grant select (id,store_name,banner_url,categories,admin_phone,midtrans_client_key,midtrans_environment,created_at,updated_at) on public.settings to anon, authenticated;
grant select (id,name,type,account_number,account_holder,qris_url,is_active,created_at,updated_at) on public.payment_methods to anon, authenticated;
grant insert, update, delete on public.products, public.settings, public.payment_methods to authenticated;
grant select (is_active) on public.products to authenticated;
grant select (id,customer_name,customer_address,customer_phone,items,total_price,payment_method,status,created_at) on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
grant all on public.products, public.settings, public.payment_methods, public.orders, public.admin_users to service_role;
grant select on public.admin_users to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images public read" on storage.objects;
drop policy if exists "Product images admin insert" on storage.objects;
drop policy if exists "Product images admin update" on storage.objects;
drop policy if exists "Product images admin delete" on storage.objects;

create policy "Product images public read" on storage.objects for select to anon, authenticated using (bucket_id = 'products');
create policy "Product images admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
create policy "Product images admin update" on storage.objects for update to authenticated using (bucket_id = 'products' and public.is_admin()) with check (bucket_id = 'products' and public.is_admin());
create policy "Product images admin delete" on storage.objects for delete to authenticated using (bucket_id = 'products' and public.is_admin());

comment on table public.admin_users is 'Admin allow-list. Bootstrap example: insert into public.admin_users (user_id) values (''00000000-0000-0000-0000-000000000000'');';
comment on column public.settings.midtrans_server_key is 'Historical secret storage only. No anon/authenticated column grant; keep server-side access through service role.';
comment on function public.claim_checkout(uuid,text,jsonb) is 'Service-role only idempotent checkout claim. Returns existing order only when request_hash matches.';
comment on function public.claim_payment(uuid) is 'Service-role only atomic payment provider claim; backend may clear payment_claimed_at on provider failure.';

commit;
