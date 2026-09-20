-- Alertas de stock bajo por WhatsApp (CallMeBot).
--
-- ANTES de ejecutar esto:
--   1. Activar las extensiones pg_cron y pg_net:
--      Supabase > Database > Extensions > buscar "pg_cron" y "pg_net" > enable.
--   2. Tener la apikey de CallMeBot (ver instrucciones al final del archivo).
--
-- Se puede volver a ejecutar sin problema: todo es idempotente.

-- Marca de tiempo del último aviso enviado por ingrediente, para no repetir
-- el mensaje antes de 48 horas.
alter table public.inventario
  add column if not exists ultima_alerta timestamptz;

-- Secretos y ajustes. RLS activo y SIN políticas ni grants: el rol anon (la app
-- en el navegador) no puede leer esta tabla. Solo el cron, que corre como
-- superusuario, la ve.
create table if not exists public.configuracion (
  clave text primary key,
  valor text not null
);

alter table public.configuracion enable row level security;
revoke all on public.configuracion from anon;

-- Revisa el inventario y, si hay ingredientes en las últimas, manda un solo
-- mensaje de WhatsApp con la lista. Devuelve cuántos ingredientes avisó.
create or replace function public.enviar_alertas_stock()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_telefono text;
  v_apikey text;
  v_umbral integer;
  v_faltantes text[];
  v_ids uuid[];
  v_mensaje text;
  v_lista text;
begin
  select valor into v_telefono from public.configuracion where clave = 'whatsapp_telefono';
  select valor into v_apikey from public.configuracion where clave = 'callmebot_apikey';
  select coalesce(valor::integer, 1) into v_umbral from public.configuracion where clave = 'umbral_stock';
  v_umbral := coalesce(v_umbral, 1);

  if v_telefono is null or v_apikey is null then
    raise notice 'Falta configurar whatsapp_telefono o callmebot_apikey en public.configuracion';
    return 0;
  end if;

  select array_agg(nombre order by nombre), array_agg(id order by nombre)
    into v_faltantes, v_ids
  from public.inventario
  where stock <= v_umbral
    and (ultima_alerta is null or ultima_alerta < now() - interval '48 hours');

  if v_faltantes is null then
    return 0;
  end if;

  -- "fresa", "fresa y mango", "fresa, mango y leche"
  if array_length(v_faltantes, 1) = 1 then
    v_lista := v_faltantes[1];
  else
    v_lista := array_to_string(v_faltantes[1:array_length(v_faltantes, 1) - 1], ', ')
      || ' y ' || v_faltantes[array_length(v_faltantes, 1)];
  end if;

  v_mensaje := 'hola cosita bella soy el programa de tu novio, te escribo para recordarte que no tienes '
    || v_lista || ' y que compres nojoda';

  -- pg_net codifica los params, así que el mensaje puede llevar tildes y comas.
  perform net.http_get(
    url := 'https://api.callmebot.com/whatsapp.php',
    params := jsonb_build_object(
      'phone', v_telefono,
      'apikey', v_apikey,
      'text', v_mensaje
    )
  );

  update public.inventario
     set ultima_alerta = now()
   where id = any(v_ids);

  return array_length(v_faltantes, 1);
end;
$$;

-- Que nadie pueda disparar los mensajes desde el navegador.
revoke all on function public.enviar_alertas_stock() from public;
revoke all on function public.enviar_alertas_stock() from anon;

-- Revisa cada hora. El filtro de 48 horas por ingrediente es el que controla
-- la frecuencia real de los mensajes.
select cron.unschedule('alertas-stock-bajo')
where exists (select 1 from cron.job where jobname = 'alertas-stock-bajo');

select cron.schedule(
  'alertas-stock-bajo',
  '0 * * * *',
  $$select public.enviar_alertas_stock()$$
);

-- ---------------------------------------------------------------------------
-- CONFIGURACIÓN (ejecutar aparte, con la apikey real)
--
-- Para obtener la apikey, ELLA debe hacerlo desde SU teléfono:
--   1. Entrar a https://www.callmebot.com/blog/free-api-whatsapp-messages/
--      y agregar a contactos el número del bot que aparece ahí.
--   2. Enviarle por WhatsApp: I allow callmebot to send me messages
--   3. El bot responde con la apikey.
--
-- insert into public.configuracion (clave, valor) values
--   ('whatsapp_telefono', '584149643990'),
--   ('callmebot_apikey', 'LA_APIKEY_QUE_LE_LLEGO'),
--   ('umbral_stock', '1')
-- on conflict (clave) do update set valor = excluded.valor;
--
-- Para probar sin esperar el cron:
--   select public.enviar_alertas_stock();
--
-- Para ver si el cron está corriendo:
--   select * from cron.job_run_details order by start_time desc limit 10;
-- ---------------------------------------------------------------------------
