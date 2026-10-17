-- Catálogos de la expansión Pokémon (Fase 7).
-- Autoridad: docs/13-expansion-pokemon.md, decisiones DEC-093 a DEC-104.

-- ---------------------------------------------------------------------------
-- Estados alterados: catálogo normativo referenciado por ataques (DEC-097)
-- ---------------------------------------------------------------------------
create table public.estados_alterados (
  id uuid primary key default gen_random_uuid(),
  nombre citext not null unique,
  activo boolean not null default true,
  version integer not null default 1,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),
  constraint estados_alterados_nombre_longitud check (char_length(nombre::text) between 1 and 100)
);

-- ---------------------------------------------------------------------------
-- Ataques (RF-ATQ-001/002). El tipo referencia el catálogo único de tipos
-- elementales, compartido con tipos_gimnasio (DEC-094).
-- El daño admite nulo porque la fuente contiene valores no numéricos ("?").
-- ---------------------------------------------------------------------------
create table public.ataques (
  id uuid primary key default gen_random_uuid(),
  nombre citext not null unique,
  tipo_id smallint not null references public.tipos_gimnasio (id),
  descripcion text not null default '',
  danio smallint,
  estado_objetivo_id uuid references public.estados_alterados (id),
  estado_auto_id uuid references public.estados_alterados (id),
  activo boolean not null default true,
  version integer not null default 1,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),
  constraint ataques_nombre_longitud check (char_length(nombre::text) between 1 and 100),
  constraint ataques_danio_rango check (danio is null or danio between 0 and 99)
);

-- ---------------------------------------------------------------------------
-- Categorías de especie, catálogo normalizado multivalor (DEC-104)
-- ---------------------------------------------------------------------------
create table public.categorias_especie (
  id uuid primary key default gen_random_uuid(),
  nombre citext not null unique,
  activo boolean not null default true,
  version integer not null default 1,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),
  constraint categorias_especie_nombre_longitud check (char_length(nombre::text) between 1 and 100)
);

-- ---------------------------------------------------------------------------
-- Especies (RF-PKM-002, DEC-095, DEC-104)
-- dex: admite decimales para formas (3.1); tipos referencian tipos_gimnasio.
-- ---------------------------------------------------------------------------
create table public.especies (
  id uuid primary key default gen_random_uuid(),
  dex numeric(8, 2) not null unique,
  nombre citext not null unique,
  tipo_i smallint not null references public.tipos_gimnasio (id),
  tipo_ii smallint references public.tipos_gimnasio (id),
  hp smallint,
  iniciativa smallint,
  puntos_evolucion smallint,
  ataque_inicial_id uuid references public.ataques (id),
  preevolucion text,
  evolucion text,
  etapa text,
  sprite_url text,
  grito_url text,
  generacion smallint,
  prob_aparicion numeric(6, 5),
  prob_shiny numeric(6, 5),
  activo boolean not null default true,
  version integer not null default 1,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),
  constraint especies_nombre_longitud check (char_length(nombre::text) between 1 and 100),
  constraint especies_tipos_distintos check (tipo_ii is null or tipo_i <> tipo_ii),
  constraint especies_generacion_rango check (generacion is null or generacion between 0 and 99),
  constraint especies_prob_aparicion_rango check (prob_aparicion is null or prob_aparicion between 0 and 1),
  constraint especies_prob_shiny_rango check (prob_shiny is null or prob_shiny between 0 and 1)
);

create table public.especie_categorias (
  especie_id uuid not null references public.especies (id),
  categoria_id uuid not null references public.categorias_especie (id),
  primary key (especie_id, categoria_id)
);

-- Tipos elementales de ataques que la especie puede usar (TIPO COMP 1..4)
create table public.especie_tipos_ataque (
  especie_id uuid not null references public.especies (id),
  tipo_id smallint not null references public.tipos_gimnasio (id),
  primary key (especie_id, tipo_id)
);

-- ---------------------------------------------------------------------------
-- Aparición por bioma, por tipo elemental con flag de tipo II (DEC-098)
-- ---------------------------------------------------------------------------
create table public.aparicion_bioma (
  bioma_id uuid not null references public.biomas (id),
  tipo_id smallint not null references public.tipos_gimnasio (id),
  incluye_tipo_ii boolean not null default false,
  creado_en timestamptz not null default now(),
  primary key (bioma_id, tipo_id)
);

create index especies_activo_idx on public.especies (activo);
create index especie_categorias_categoria_idx on public.especie_categorias (categoria_id);

-- ---------------------------------------------------------------------------
-- RLS: solo el rol de servicio del backend (DEC-081)
-- ---------------------------------------------------------------------------
alter table public.estados_alterados enable row level security;
alter table public.ataques enable row level security;
alter table public.categorias_especie enable row level security;
alter table public.especies enable row level security;
alter table public.especie_categorias enable row level security;
alter table public.especie_tipos_ataque enable row level security;
alter table public.aparicion_bioma enable row level security;

create policy estados_alterados_servicio on public.estados_alterados
  for all to service_role using (true) with check (true);
create policy ataques_servicio on public.ataques
  for all to service_role using (true) with check (true);
create policy categorias_especie_servicio on public.categorias_especie
  for all to service_role using (true) with check (true);
create policy especies_servicio on public.especies
  for all to service_role using (true) with check (true);
create policy especie_categorias_servicio on public.especie_categorias
  for all to service_role using (true) with check (true);
create policy especie_tipos_ataque_servicio on public.especie_tipos_ataque
  for all to service_role using (true) with check (true);
create policy aparicion_bioma_servicio on public.aparicion_bioma
  for all to service_role using (true) with check (true);
