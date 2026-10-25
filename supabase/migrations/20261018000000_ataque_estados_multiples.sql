-- Relación N:N entre ataques y estados alterados (DEC-105).
-- Reemplaza los campos 1:1 estado_objetivo_id y estado_auto_id de public.ataques.

-- ---------------------------------------------------------------------------
-- Tabla de unión
-- ---------------------------------------------------------------------------
create table public.ataque_estados (
  ataque_id uuid not null references public.ataques (id) on delete cascade,
  estado_id uuid not null references public.estados_alterados (id) on delete restrict,
  ambito text not null check (ambito in ('objetivo','usuario')),
  primary key (ataque_id, estado_id, ambito)
);

create index ataque_estados_ataque_idx on public.ataque_estados (ataque_id);
create index ataque_estados_estado_idx on public.ataque_estados (estado_id);

-- ---------------------------------------------------------------------------
-- Migración de datos existentes
-- ---------------------------------------------------------------------------
insert into public.ataque_estados (ataque_id, estado_id, ambito)
select id, estado_objetivo_id, 'objetivo'
from public.ataques
where estado_objetivo_id is not null;

insert into public.ataque_estados (ataque_id, estado_id, ambito)
select id, estado_auto_id, 'usuario'
from public.ataques
where estado_auto_id is not null;

-- ---------------------------------------------------------------------------
-- RLS: solo el rol de servicio del backend
-- ---------------------------------------------------------------------------
alter table public.ataque_estados enable row level security;

create policy ataque_estados_servicio on public.ataque_estados
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Eliminación de columnas obsoletas
-- ---------------------------------------------------------------------------
alter table public.ataques drop column estado_objetivo_id;
alter table public.ataques drop column estado_auto_id;
