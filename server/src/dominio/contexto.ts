import { pool } from "../db.js";
import type { MicroDef } from "./tipos.js";
import { VERSION_ALGORITMO } from "../generador/generador.js";
import type { ContextoSnapshot } from "./snapshot.js";

export { VERSION_SNAPSHOT, snapshotAContexto, type ContextoSnapshot } from "./snapshot.js";

export async function cargarContextoSnapshot(): Promise<ContextoSnapshot> {
  // Orden estable obligatorio: el PRNG mezcla estas listas, así que el orden
  // de entrada forma parte del contexto reproducible (DEC-042).
  const [biomas, incomp, tipos, compat, micros] = await Promise.all([
    pool.query(`select id, nombre::text as nombre, color, icono, activo from biomas order by id`),
    pool.query(`select bioma_a, bioma_b from incompatibilidades order by bioma_a, bioma_b`),
    pool.query(`select id, nombre from tipos_gimnasio order by id`),
    pool.query(`select tipo_id, bioma_id from tipo_gimnasio_biomas order by tipo_id, bioma_id`),
    pool.query(`select id, nombre::text as nombre, activo, celdas from microbiomas order by id`),
  ]);

  const compatPorTipo = new Map<number, string[]>();
  for (const r of compat.rows) {
    const l = compatPorTipo.get(r.tipo_id) ?? [];
    l.push(r.bioma_id);
    compatPorTipo.set(r.tipo_id, l);
  }

  return {
    biomas: biomas.rows,
    incompatibilidades: incomp.rows.map((r) => ({ a: r.bioma_a, b: r.bioma_b })),
    tiposGimnasio: tipos.rows.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      biomasCompatibles: compatPorTipo.get(t.id) ?? [],
    })),
    microbiomas: micros.rows.map(
      (m): MicroDef => ({
        id: m.id,
        nombre: m.nombre,
        activo: m.activo,
        celdas: m.celdas,
      })
    ),
    versionAlgoritmo: VERSION_ALGORITMO,
  };
}
