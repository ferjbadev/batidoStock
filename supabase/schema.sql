-- Esquema de Karito Stock.
-- Ejecutar una sola vez en Supabase: panel del proyecto > SQL Editor > New query > pegar y Run.

create table if not exists public.inventario (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  producto text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0),
  total numeric(12, 2) generated always as (cantidad * precio_unitario) stored,
  created_at timestamptz not null default now()
);

create index if not exists ventas_created_at_idx on public.ventas (created_at desc);
create index if not exists inventario_created_at_idx on public.inventario (created_at desc);

-- La app no tiene login, así que la anon key necesita leer y escribir.
alter table public.inventario enable row level security;
alter table public.ventas enable row level security;

drop policy if exists "acceso abierto inventario" on public.inventario;
create policy "acceso abierto inventario" on public.inventario
  for all to anon using (true) with check (true);

drop policy if exists "acceso abierto ventas" on public.ventas;
create policy "acceso abierto ventas" on public.ventas
  for all to anon using (true) with check (true);
