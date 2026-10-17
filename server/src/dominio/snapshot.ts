import type { ContextoGeneracion, MicroDef } from "./tipos.js";

export const VERSION_SNAPSHOT = 1;

function par(a: string, b: string): string {
  return `${a}|${b}`;
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
