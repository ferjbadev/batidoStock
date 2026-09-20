-- Esquema de Karito Stock.
-- Se puede volver a ejecutar sin problema: todo es idempotente.
-- Supabase: panel del proyecto > SQL Editor > New query > pegar y Run.

create table if not exists public.inventario (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

-- Batidos que se venden. El precio es el sugerido, editable al registrar la venta.
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio numeric(10, 2) not null default 0 check (precio >= 0),
  created_at timestamptz not null default now()
);

-- Receta: cuánto gasta un batido de cada ingrediente.
create table if not exists public.recetas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  ingrediente_id uuid not null references public.inventario (id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  unique (producto_id, ingrediente_id)
);

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  producto text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0),
  total numeric(12, 2) generated always as (cantidad * precio_unitario) stored,
  created_at timestamptz not null default now()
);

-- Se guarda el nombre del producto en la venta además del id, para que el
-- historial siga siendo legible aunque después se borre el batido.
alter table public.ventas
  add column if not exists producto_id uuid references public.productos (id) on delete set null;

create index if not exists ventas_created_at_idx on public.ventas (created_at desc);
create index if not exists inventario_created_at_idx on public.inventario (created_at desc);
create index if not exists recetas_producto_idx on public.recetas (producto_id);

-- Registra la venta y descuenta el inventario en una sola transacción.
-- Si el stock no alcanza, la venta se registra igual, el stock queda en 0 y
-- se devuelve la lista de advertencias.
create or replace function public.registrar_venta(
  p_cantidad integer,
  p_producto_id uuid default null,
  p_producto_nombre text default null,
  p_precio_unitario numeric default null
)
returns jsonb
language plpgsql
as $$
declare
  v_producto public.productos;
  v_nombre text;
  v_precio numeric;
  v_venta public.ventas;
  v_advertencias jsonb := '[]'::jsonb;
  v_faltante integer;
  r record;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero';
  end if;

  if p_producto_id is not null then
    select * into v_producto from public.productos where id = p_producto_id;
    if not found then
      raise exception 'El producto ya no existe';
    end if;
    v_nombre := v_producto.nombre;
    v_precio := coalesce(p_precio_unitario, v_producto.precio);
  else
    v_nombre := nullif(trim(coalesce(p_producto_nombre, '')), '');
    if v_nombre is null then
      raise exception 'Hace falta el nombre del producto';
    end if;
    v_precio := coalesce(p_precio_unitario, 0);
  end if;

  insert into public.ventas (producto, producto_id, cantidad, precio_unitario)
  values (v_nombre, p_producto_id, p_cantidad, v_precio)
  returning * into v_venta;

  if p_producto_id is not null then
    for r in
      select i.id, i.nombre, i.stock, rc.cantidad * p_cantidad as necesario
      from public.recetas rc
      join public.inventario i on i.id = rc.ingrediente_id
      where rc.producto_id = p_producto_id
      order by i.id
      for update of i
    loop
      v_faltante := greatest(0, r.necesario - r.stock);

      update public.inventario
         set stock = greatest(0, stock - r.necesario)
       where id = r.id;

      if v_faltante > 0 then
        v_advertencias := v_advertencias || jsonb_build_object(
          'ingrediente', r.nombre,
          'faltante', v_faltante
        );
      end if;
    end loop;
  end if;

  return jsonb_build_object('venta', to_jsonb(v_venta), 'advertencias', v_advertencias);
end;
$$;

-- La app no tiene login, así que la publishable key (rol anon) necesita leer y escribir.
alter table public.inventario enable row level security;
alter table public.ventas enable row level security;
alter table public.productos enable row level security;
alter table public.recetas enable row level security;

drop policy if exists "acceso abierto inventario" on public.inventario;
create policy "acceso abierto inventario" on public.inventario
  for all to anon using (true) with check (true);

drop policy if exists "acceso abierto ventas" on public.ventas;
create policy "acceso abierto ventas" on public.ventas
  for all to anon using (true) with check (true);

drop policy if exists "acceso abierto productos" on public.productos;
create policy "acceso abierto productos" on public.productos
  for all to anon using (true) with check (true);

drop policy if exists "acceso abierto recetas" on public.recetas;
create policy "acceso abierto recetas" on public.recetas
  for all to anon using (true) with check (true);

grant select, insert, update, delete on public.inventario to anon;
grant select, insert, update, delete on public.ventas to anon;
grant select, insert, update, delete on public.productos to anon;
grant select, insert, update, delete on public.recetas to anon;
grant execute on function public.registrar_venta(integer, uuid, text, numeric) to anon;
