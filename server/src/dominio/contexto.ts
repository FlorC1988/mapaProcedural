import { pool } from "../db.js";
import type { ContextoGeneracion, MicroDef } from "./tipos.js";
import { VERSION_ALGORITMO } from "../generador/generador.js";

export const VERSION_SNAPSHOT = 1;

function par(a: string, b: string): string {
  return `${a}|${b}`;
}

export function paresIncompatibles(filas: { bioma_a: string; bioma_b: string }[]): Set<string> {
  const s = new Set<string>();
  for (const r of filas) {
    s.add(par(r.bioma_a, r.bioma_b));
    s.add(par(r.bioma_b, r.bioma_a));
  }
  return s;
}

/** Contexto serializable que se guarda en el snapshot histórico (DEC-047). */
export interface ContextoSnapshot {
  biomas: { id: string; nombre: string; color: string; icono: string; activo: boolean }[];
  incompatibilidades: { a: string; b: string }[];
  tiposGimnasio: { id: number; nombre: string; biomasCompatibles: string[] }[];
  microbiomas: MicroDef[];
  versionAlgoritmo: number;
}

export function snapshotAContexto(c: ContextoSnapshot): ContextoGeneracion {
  const incompatibles = new Set<string>();
  for (const p of c.incompatibilidades) {
    incompatibles.add(par(p.a, p.b));
    incompatibles.add(par(p.b, p.a));
  }
  return {
    biomas: c.biomas,
    incompatibles,
    tiposGimnasio: c.tiposGimnasio.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      biomasCompatibles: t.biomasCompatibles,
    })),
    microbiomas: c.microbiomas,
    versionAlgoritmo: c.versionAlgoritmo,
  };
}

/** Carga el contexto de generación desde los catálogos operativos. */
export async function cargarContexto(): Promise<ContextoGeneracion> {
  const ctx = await cargarContextoSnapshot();
  return snapshotAContexto(ctx);
}

export async function cargarContextoSnapshot(): Promise<ContextoSnapshot> {
  const [biomas, incomp, tipos, compat, micros] = await Promise.all([
    pool.query(`select id, nombre::text as nombre, color, icono, activo from biomas`),
    pool.query(`select bioma_a, bioma_b from incompatibilidades`),
    pool.query(`select id, nombre from tipos_gimnasio order by id`),
    pool.query(`select tipo_id, bioma_id from tipo_gimnasio_biomas`),
    pool.query(`select id, nombre::text as nombre, activo, celdas from microbiomas`),
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
