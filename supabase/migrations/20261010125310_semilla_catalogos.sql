-- Datos semilla aprobados:
--   biomas: Pradera, Agua, Roca, Magma, Hielo (todos activos) — DEC-026
--   incompatibilidad inicial: Hielo–Magma — DEC-028
--   18 tipos fijos de gimnasio, todos compatibles con los 5 biomas — DEC-032/033

insert into public.biomas (nombre, color, icono) values
  ('Agua',    '#3b82f6', 'agua'),
  ('Hielo',   '#a5f3fc', 'hielo'),
  ('Magma',   '#ef4444', 'magma'),
  ('Pradera', '#22c55e', 'pradera'),
  ('Roca',    '#78716c', 'roca');

insert into public.incompatibilidades (bioma_a, bioma_b)
select least(a.id, b.id), greatest(a.id, b.id)
from public.biomas a, public.biomas b
where a.nombre = 'Hielo' and b.nombre = 'Magma';

insert into public.tipos_gimnasio (id, nombre) values
  (1,  'Acero'),
  (2,  'Agua'),
  (3,  'Bicho'),
  (4,  'Dragón'),
  (5,  'Eléctrico'),
  (6,  'Fantasma'),
  (7,  'Fuego'),
  (8,  'Hada'),
  (9,  'Hielo'),
  (10, 'Lucha'),
  (11, 'Normal'),
  (12, 'Planta'),
  (13, 'Psíquico'),
  (14, 'Roca'),
  (15, 'Siniestro'),
  (16, 'Tierra'),
  (17, 'Veneno'),
  (18, 'Volador');

insert into public.tipo_gimnasio_biomas (tipo_id, bioma_id)
select t.id, b.id
from public.tipos_gimnasio t
cross join public.biomas b;
