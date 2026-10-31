-- Ataques iniciales múltiples por especie (DEC-107).
-- Reemplaza especies.ataque_inicial_id (1:1 opcional) por una relación N:M con
-- probabilidad como peso relativo. Los datos existentes se migran con p = 1.

create table public.especie_ataques_iniciales (
  especie_id uuid not null references public.especies (id) on delete cascade,
  ataque_id uuid not null references public.ataques (id),
  probabilidad numeric(6, 5) not null,
  primary key (especie_id, ataque_id),
  constraint especie_ataques_iniciales_prob_rango check (probabilidad > 0 and probabilidad <= 1)
);

insert into public.especie_ataques_iniciales (especie_id, ataque_id, probabilidad)
select id, ataque_inicial_id, 1
from public.especies
where ataque_inicial_id is not null;

alter table public.especies drop column ataque_inicial_id;

create index especie_ataques_iniciales_ataque_idx on public.especie_ataques_iniciales (ataque_id);

alter table public.especie_ataques_iniciales enable row level security;

create policy especie_ataques_iniciales_servicio on public.especie_ataques_iniciales
  for all to service_role using (true) with check (true);
