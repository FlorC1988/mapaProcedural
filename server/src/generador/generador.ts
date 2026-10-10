// Generador de mapas: backtracking global entre las fases aprobadas con
// selección MRV, propagación de restricciones, alternativas ordenadas por el
// PRNG sembrado y presupuesto determinista de nodos (RF-GEN-014/015, DEC-040/041).
//
// Secuencia aprobada (06-generacion-de-mapas §2):
//   1. grilla vacía → 2. seleccionar microbiomas → 3. colocarlos
//   → 4. mapa base → 5. gimnasios e influencias.

import {
  axialAVisible,
  celdasEnRadio,
  cuadranteDe,
  indiceAVisible,
  vecinosDe,
  visibleAAxial,
  visibleAIndice,
} from "../dominio/hex.js";
import type {
  ConfigGeneracion,
  ContextoGeneracion,
  InstanciaGimnasio,
  InstanciaMicrobioma,
  MapaGenerado,
  MicroDef,
  ResultadoGeneracion,
} from "../dominio/tipos.js";
import { crearPRNG, generarSemillaAleatoria, mezclar } from "./prng.js";

export const VERSION_ALGORITMO = 1;
// Presupuesto provisional de nodos; el valor definitivo se calibra con
// benchmarks según DEC-072.
export const PRESUPUESTO_NODOS = 500_000;

type Altura = 1 | 2 | 3;

class PresupuestoAgotado extends Error {}

interface Estado {
  filas: number;
  columnas: number;
  total: number;
  bioma: (string | null)[];
  altura: (0 | Altura)[];
  micro: number[]; // índice de instancia o -1
  gymAt: number[]; // índice de gimnasio o -1
  areaDe: number[]; // índice de gimnasio dueño del área o -1
  vecinos: number[][];
  incompatibles: Set<string>;
  nodos: number;
  presupuesto: number;
}

function crearEstado(
  filas: number,
  columnas: number,
  incompatibles: Set<string>,
  presupuesto: number
): Estado {
  const total = filas * columnas;
  const vecinos: number[][] = new Array(total);
  for (let i = 0; i < total; i++) vecinos[i] = vecinosDe(i, filas, columnas);
  return {
    filas,
    columnas,
    total,
    bioma: new Array(total).fill(null),
    altura: new Array(total).fill(0),
    micro: new Array(total).fill(-1),
    gymAt: new Array(total).fill(-1),
    areaDe: new Array(total).fill(-1),
    vecinos,
    incompatibles,
    nodos: 0,
    presupuesto,
  };
}

function consumirNodo(e: Estado): void {
  if (++e.nodos > e.presupuesto) throw new PresupuestoAgotado();
}

function par(a: string, b: string): string {
  return `${a}|${b}`;
}

function mismaInstancia(e: Estado, i: number, j: number): boolean {
  return e.micro[i] !== -1 && e.micro[i] === e.micro[j];
}

/** Comprueba bioma+altura contra vecinos ya asignados (RD-ALT-002, RD-BIO-006). */
function asignacionCompatible(e: Estado, i: number, b: string, z: Altura): boolean {
  for (const n of e.vecinos[i]) {
    const bn = e.bioma[n];
    if (bn === null) continue;
    if (mismaInstancia(e, i, n)) continue; // exención interna (RD-MIC-004)
    if (e.incompatibles.has(par(b, bn))) return false;
    if (Math.abs(z - e.altura[n]) > 1) return false;
  }
  return true;
}

/** Solo incompatibilidad de biomas (para influencia de gimnasios, RD-GIM-012). */
function biomaCompatible(e: Estado, i: number, b: string): boolean {
  for (const n of e.vecinos[i]) {
    const bn = e.bioma[n];
    if (bn === null) continue;
    if (mismaInstancia(e, i, n)) continue;
    if (e.incompatibles.has(par(b, bn))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Fase 2-3: selección y colocación de microbiomas
// ---------------------------------------------------------------------------

function seleccionarMicrobiomas(
  activos: MicroDef[],
  cantidad: number,
  rnd: () => number
): MicroDef[] {
  if (activos.length === 0) return [];
  const mezclados = mezclar(activos, rnd);
  if (cantidad <= mezclados.length) return mezclados.slice(0, cantidad);
  const sel = mezclados.slice();
  while (sel.length < cantidad) sel.push(mezclados[Math.floor(rnd() * mezclados.length)]);
  return sel;
}

/** Celdas absolutas de una definición anclada en la celda i (o null si se sale). */
function celdasDeInstancia(
  def: MicroDef,
  ancla: number,
  filas: number,
  columnas: number
): number[] | null {
  const { fila, columna } = indiceAVisible(ancla, columnas);
  const a = visibleAAxial(fila, columna);
  const out: number[] = [];
  for (const c of def.celdas) {
    const v = axialAVisible(a.q + c.dq, a.r + c.dr);
    if (v.fila < 1 || v.fila > filas || v.columna < 1 || v.columna > columnas) return null;
    out.push(visibleAIndice(v.fila, v.columna, columnas));
  }
  return out;
}

function* colocarMicrobiomas(
  e: Estado,
  defs: MicroDef[],
  instancias: InstanciaMicrobioma[],
  k: number,
  rnd: () => number
): Generator<void> {
  if (k === defs.length) {
    yield;
    return;
  }
  const def = defs[k];
  const anclas = mezclar(
    Array.from({ length: e.total }, (_, i) => i),
    rnd
  );
  for (const ancla of anclas) {
    const celdas = celdasDeInstancia(def, ancla, e.filas, e.columnas);
    if (celdas === null) continue;
    // Sin superposición ni adyacencia con otras instancias (RD-MIC-006/007).
    let valido = true;
    for (const i of celdas) {
      if (e.micro[i] !== -1) {
        valido = false;
        break;
      }
      for (const n of e.vecinos[i]) {
        if (e.micro[n] !== -1) {
          valido = false;
          break;
        }
      }
      if (!valido) break;
    }
    if (!valido) continue;

    consumirNodo(e);
    const idx = instancias.length;
    const { fila, columna } = indiceAVisible(ancla, e.columnas);
    instancias.push({
      id: `micro-${idx}`,
      definicionId: def.id,
      nombre: def.nombre,
      ancla: { fila, columna },
      celdas: celdas.map((i) => indiceAVisible(i, e.columnas)),
      definicion: def.celdas.map((c) => ({ ...c })),
    });
    def.celdas.forEach((c, j) => {
      const i = celdas[j];
      e.micro[i] = idx;
      e.bioma[i] = c.bioma;
      e.altura[i] = c.altura;
    });
    yield* colocarMicrobiomas(e, defs, instancias, k + 1, rnd);
    instancias.pop();
    for (const i of celdas) {
      e.micro[i] = -1;
      e.bioma[i] = null;
      e.altura[i] = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Fase 4: mapa base — CSP con MRV y forward checking
// ---------------------------------------------------------------------------

interface Valor {
  b: string;
  z: Altura;
}

function compatibleCon(e: Estado, i: number, vecino: number, b: string, z: Altura): boolean {
  if (mismaInstancia(e, i, vecino)) return true;
  const bn = e.bioma[vecino];
  if (bn === null) return true;
  return !e.incompatibles.has(par(b, bn)) && Math.abs(z - e.altura[vecino]) <= 1;
}

function* rellenarBase(
  e: Estado,
  dominios: Map<number, Valor[]>,
  rnd: () => number
): Generator<void> {
  // MRV: celda sin asignar con menos alternativas.
  let celda = -1;
  let mejor = Infinity;
  for (const [i, dom] of dominios) {
    if (dom.length === 0) return;
    if (dom.length < mejor) {
      mejor = dom.length;
      celda = i;
      if (mejor === 1) break;
    }
  }
  if (celda === -1) {
    yield; // todas las celdas asignadas
    return;
  }

  const alternativas = mezclar(dominios.get(celda)!, rnd);
  for (const v of alternativas) {
    consumirNodo(e);
    // Propagación: filtrar dominios de vecinos sin asignar.
    const respaldo: [number, Valor[]][] = [[celda, dominios.get(celda)!]];
    let ok = true;
    dominios.delete(celda);
    e.bioma[celda] = v.b;
    e.altura[celda] = v.z;
    for (const n of e.vecinos[celda]) {
      const dom = dominios.get(n);
      if (!dom) continue;
      respaldo.push([n, dom]);
      const filtrado = dom.filter((x) => compatibleCon(e, n, celda, x.b, x.z));
      if (filtrado.length === 0) {
        ok = false;
        break;
      }
      dominios.set(n, filtrado);
    }
    if (ok) yield* rellenarBase(e, dominios, rnd);
    // Deshacer: respaldo[0] contiene el dominio original de `celda`.
    for (const [i, dom] of respaldo) dominios.set(i, dom);
    e.bioma[celda] = null;
    e.altura[celda] = 0;
  }
}

// ---------------------------------------------------------------------------
// Fase 5: gimnasios e influencias
// ---------------------------------------------------------------------------

interface AsignacionGim {
  tipoId: number;
  cuadrante: number;
}

function* colocarGimnasios(
  e: Estado,
  asignaciones: AsignacionGim[],
  gimnasios: InstanciaGimnasio[],
  k: number,
  radio: number,
  rnd: () => number
): Generator<void> {
  if (k === asignaciones.length) {
    yield;
    return;
  }
  const { tipoId, cuadrante } = asignaciones[k];
  const candidatos = mezclar(
    Array.from({ length: e.total }, (_, i) => i).filter((i) => {
      const v = indiceAVisible(i, e.columnas);
      return cuadranteDe(v.fila, v.columna, e.filas, e.columnas) === cuadrante;
    }),
    rnd
  );
  for (const i of candidatos) {
    if (e.gymAt[i] !== -1) continue;
    // Área completa dentro del cuadrante y sin superposición (RD-GIM-009/010).
    const area = celdasEnRadio(i, radio, e.filas, e.columnas);
    let valido = true;
    for (const a of area) {
      const va = indiceAVisible(a, e.columnas);
      if (
        cuadranteDe(va.fila, va.columna, e.filas, e.columnas) !== cuadrante ||
        e.areaDe[a] !== -1
      ) {
        valido = false;
        break;
      }
    }
    if (!valido) continue;
    // No adyacente a otro gimnasio, incluso entre cuadrantes (RD-GIM-006).
    for (const n of e.vecinos[i]) {
      if (e.gymAt[n] !== -1) {
        valido = false;
        break;
      }
    }
    if (!valido) continue;

    consumirNodo(e);
    const idx = gimnasios.length;
    const { fila, columna } = indiceAVisible(i, e.columnas);
    gimnasios.push({
      id: `gym-${idx}`,
      tipoId,
      fila,
      columna,
      cuadrante,
      area: area.map((a) => indiceAVisible(a, e.columnas)),
    });
    e.gymAt[i] = idx;
    for (const a of area) e.areaDe[a] = idx;
    yield* colocarGimnasios(e, asignaciones, gimnasios, k + 1, radio, rnd);
    gimnasios.pop();
    e.gymAt[i] = -1;
    for (const a of area) e.areaDe[a] = -1;
  }
}

/** Asigna biomas compatibles a las celdas del área (RD-GIM-011/012). */
function* asignarInfluencia(
  e: Estado,
  pendientes: { celda: number; compatibles: string[] }[],
  dominio: Map<number, string[]>,
  rnd: () => number
): Generator<void> {
  if (pendientes.length === 0) {
    yield;
    return;
  }
  // MRV sobre las celdas de influencia pendientes.
  let pos = -1;
  let mejor = Infinity;
  for (let p = 0; p < pendientes.length; p++) {
    const dom = dominio.get(pendientes[p].celda)!;
    if (dom.length === 0) return;
    if (dom.length < mejor) {
      mejor = dom.length;
      pos = p;
    }
  }
  const celda = pendientes[pos].celda;
  const resto = pendientes.slice(0, pos).concat(pendientes.slice(pos + 1));
  for (const b of mezclar(dominio.get(celda)!, rnd)) {
    if (!biomaCompatible(e, celda, b)) continue;
    consumirNodo(e);
    const anterior = e.bioma[celda];
    e.bioma[celda] = b;
    yield* asignarInfluencia(e, resto, dominio, rnd);
    e.bioma[celda] = anterior;
  }
}

// ---------------------------------------------------------------------------
// Búsqueda global
// ---------------------------------------------------------------------------

function* buscar(
  e: Estado,
  ctx: ContextoGeneracion,
  config: ConfigGeneracion,
  rnd: () => number,
  instancias: InstanciaMicrobioma[],
  gimnasios: InstanciaGimnasio[]
): Generator<void> {
  const defs = seleccionarMicrobiomas(
    ctx.microbiomas.filter((m) => m.activo),
    config.microbiomas,
    rnd
  );
  if (defs.length < config.microbiomas) return; // no hay activos suficientes
  for (const _ of colocarMicrobiomas(e, defs, instancias, 0, rnd)) {
    // Inicializar dominios del mapa base con propagación inicial.
    const biomasActivos = ctx.biomas.filter((b) => b.activo).map((b) => b.id);
    const alturas: Altura[] = [1, 2, 3];
    const dominios = new Map<number, Valor[]>();
    let viable = true;
    for (let i = 0; i < e.total; i++) {
      if (e.bioma[i] !== null) continue;
      const dom: Valor[] = [];
      for (const b of biomasActivos)
        for (const z of alturas) if (asignacionCompatible(e, i, b, z)) dom.push({ b, z });
      if (dom.length === 0) {
        viable = false;
        break;
      }
      dominios.set(i, dom);
    }
    if (!viable) continue;

    for (const _b of rellenarBase(e, dominios, rnd)) {
      // Selección de 4×N tipos distintos distribuidos N por cuadrante.
      const tiposElegidos = mezclar(ctx.tiposGimnasio, rnd).slice(0, 4 * config.n);
      const asignaciones: AsignacionGim[] = [];
      for (let q = 0; q < 4; q++)
        for (let j = 0; j < config.n; j++)
          asignaciones.push({ tipoId: tiposElegidos[q * config.n + j].id, cuadrante: q });

      for (const _g of colocarGimnasios(e, asignaciones, gimnasios, 0, config.radio, rnd)) {
        // Influencia: dominio de cada celda = biomas compatibles del tipo.
        const pendientes: { celda: number; compatibles: string[] }[] = [];
        const dominio = new Map<number, string[]>();
        let ok = true;
        for (const g of gimnasios) {
          const tipo = ctx.tiposGimnasio.find((t) => t.id === g.tipoId)!;
          for (const v of g.area) {
            const celda = visibleAIndice(v.fila, v.columna, e.columnas);
            const dom = tipo.biomasCompatibles.filter((b) => biomaCompatible(e, celda, b));
            if (dom.length === 0) {
              ok = false;
              break;
            }
            pendientes.push({ celda, compatibles: tipo.biomasCompatibles });
            dominio.set(celda, dom);
          }
          if (!ok) break;
        }
        if (!ok) continue;
        for (const _i of asignarInfluencia(e, pendientes, dominio, rnd)) {
          yield; // solución completa encontrada
        }
      }
    }
  }
}

export function generar(
  configEntrada: Omit<ConfigGeneracion, "semilla"> & { semilla?: string },
  ctx: ContextoGeneracion,
  presupuesto: number = PRESUPUESTO_NODOS
): { resultado: ResultadoGeneracion; semilla: string } {
  const semilla = configEntrada.semilla?.trim() || generarSemillaAleatoria();
  const config: ConfigGeneracion = { ...configEntrada, semilla };
  const rnd = crearPRNG(semilla);
  const e = crearEstado(config.filas, config.columnas, ctx.incompatibles, presupuesto);
  const instancias: InstanciaMicrobioma[] = [];
  const gimnasios: InstanciaGimnasio[] = [];

  try {
    const it = buscar(e, ctx, config, rnd, instancias, gimnasios);
    const r = it.next();
    if (!r.done) {
      const celdas = e.bioma.map((b, i) => {
        const { fila, columna } = indiceAVisible(i, config.columnas);
        return {
          fila,
          columna,
          bioma: b!,
          altura: e.altura[i] as Altura,
          gimnasio: e.gymAt[i] !== -1 ? gimnasios[e.gymAt[i]].id : null,
          microbioma: e.micro[i] !== -1 ? instancias[e.micro[i]].id : null,
        };
      });
      const mapa: MapaGenerado = {
        configuracion: config,
        celdas,
        gimnasios: gimnasios.map((g) => ({ ...g })),
        instanciasMicrobioma: instancias.map((m) => ({ ...m })),
      };
      return { resultado: { tipo: "exito", mapa, nodos: e.nodos }, semilla };
    }
    return { resultado: { tipo: "sin_solucion", nodos: e.nodos }, semilla };
  } catch (err) {
    if (err instanceof PresupuestoAgotado) {
      return { resultado: { tipo: "presupuesto_agotado", nodos: e.nodos }, semilla };
    }
    throw err;
  }
}
