// Operaciones del editor manual (RF-EDI-*, DEC-049..053).
// Todas son funciones puras que devuelven un mapa nuevo; la edición es libre
// y no aplica restricciones de generación.

import { axialAVisible, visibleAAxial } from "../dominio/hex";
import type { CeldaMapa, MapaGenerado, DefinicionMicrobioma } from "../api";

type Mapa = Pick<
  MapaGenerado,
  "configuracion" | "celdas" | "gimnasios" | "instanciasMicrobioma"
>;

export class ErrorEdicion extends Error {}

function clonar(mapa: Mapa): Mapa {
  return {
    configuracion: { ...mapa.configuracion },
    celdas: mapa.celdas.map((c) => ({ ...c })),
    gimnasios: mapa.gimnasios.map((g) => ({ ...g, area: g.area.map((a) => ({ ...a })) })),
    instanciasMicrobioma: mapa.instanciasMicrobioma.map((m) => ({
      ...m,
      ancla: { ...m.ancla },
      celdas: m.celdas.map((c) => ({ ...c })),
      definicion: m.definicion.map((c) => ({ ...c })),
    })),
  };
}

const idx = (mapa: Mapa, fila: number, columna: number) =>
  (fila - 1) * mapa.configuracion.columnas + (columna - 1);

function celda(mapa: Mapa, fila: number, columna: number): CeldaMapa {
  const c = mapa.celdas[idx(mapa, fila, columna)];
  if (!c) throw new ErrorEdicion("La posición está fuera del tablero.");
  return c;
}

/** RF-EDI-004: desvincula la instancia completa conservando los valores. */
function desvincularInstancia(mapa: Mapa, instId: string): void {
  const inst = mapa.instanciasMicrobioma.find((m) => m.id === instId);
  if (!inst) return;
  for (const pos of inst.celdas) {
    celda(mapa, pos.fila, pos.columna).microbioma = null;
  }
  mapa.instanciasMicrobioma = mapa.instanciasMicrobioma.filter((m) => m.id !== instId);
}

function desvincularSiMicro(mapa: Mapa, fila: number, columna: number): void {
  const c = celda(mapa, fila, columna);
  if (c.microbioma) desvincularInstancia(mapa, c.microbioma);
}

export function cambiarBioma(mapaIn: Mapa, fila: number, columna: number, bioma: string): Mapa {
  const mapa = clonar(mapaIn);
  desvincularSiMicro(mapa, fila, columna);
  celda(mapa, fila, columna).bioma = bioma;
  return mapa;
}

export function cambiarAltura(mapaIn: Mapa, fila: number, columna: number, altura: 1 | 2 | 3): Mapa {
  const mapa = clonar(mapaIn);
  desvincularSiMicro(mapa, fila, columna);
  celda(mapa, fila, columna).altura = altura;
  return mapa;
}

let contadorManual = 0;
const idManual = (prefijo: string) => `${prefijo}-manual-${Date.now()}-${contadorManual++}`;

// ---------------------------------------------------------------------------
// Gimnasios (RD-GIM-016/017): la edición no reaplica influencia; agregar, mover
// o cambiar tipo deja el área vacía.
// ---------------------------------------------------------------------------

export function agregarGimnasio(mapaIn: Mapa, fila: number, columna: number, tipoId: number): Mapa {
  const mapa = clonar(mapaIn);
  const c = celda(mapa, fila, columna);
  if (c.gimnasio) throw new ErrorEdicion("La celda ya tiene un gimnasio.");
  desvincularSiMicro(mapa, fila, columna);
  const id = idManual("gym");
  mapa.gimnasios.push({ id, tipoId, fila, columna, cuadrante: -1, area: [] });
  celda(mapa, fila, columna).gimnasio = id;
  return mapa;
}

export function quitarGimnasio(mapaIn: Mapa, gymId: string): Mapa {
  const mapa = clonar(mapaIn);
  const g = mapa.gimnasios.find((x) => x.id === gymId);
  if (!g) return mapa;
  desvincularSiMicro(mapa, g.fila, g.columna);
  celda(mapa, g.fila, g.columna).gimnasio = null;
  mapa.gimnasios = mapa.gimnasios.filter((x) => x.id !== gymId);
  return mapa;
}

export function moverGimnasio(mapaIn: Mapa, gymId: string, fila: number, columna: number): Mapa {
  const mapa = clonar(mapaIn);
  const g = mapa.gimnasios.find((x) => x.id === gymId);
  if (!g) return mapa;
  const destino = celda(mapa, fila, columna);
  if (destino.gimnasio) throw new ErrorEdicion("La celda destino ya tiene un gimnasio.");
  desvincularSiMicro(mapa, g.fila, g.columna);
  desvincularSiMicro(mapa, fila, columna);
  celda(mapa, g.fila, g.columna).gimnasio = null;
  g.fila = fila;
  g.columna = columna;
  g.area = [];
  celda(mapa, fila, columna).gimnasio = g.id;
  return mapa;
}

export function cambiarTipoGimnasio(mapaIn: Mapa, gymId: string, tipoId: number): Mapa {
  const mapa = clonar(mapaIn);
  const g = mapa.gimnasios.find((x) => x.id === gymId);
  if (!g) return mapa;
  g.tipoId = tipoId;
  g.area = [];
  return mapa;
}

// ---------------------------------------------------------------------------
// Microbiomas (RF-EDI-010/011, RD-MIC-010/011)
// ---------------------------------------------------------------------------

/** Celdas absolutas de una definición anclada; lanza si no cabe completa. */
export function celdasEstampado(
  mapa: Mapa,
  defCeldas: { dq: number; dr: number }[],
  fila: number,
  columna: number
): number[] {
  const { filas, columnas } = mapa.configuracion;
  const a = visibleAAxial(fila, columna);
  return defCeldas.map((c) => {
    const v = axialAVisible(a.q + c.dq, a.r + c.dr);
    if (v.fila < 1 || v.fila > filas || v.columna < 1 || v.columna > columnas) {
      throw new ErrorEdicion("La definición no cabe completa desde esa ancla.");
    }
    return idx(mapa, v.fila, v.columna);
  });
}

export function estamparMicrobioma(
  mapaIn: Mapa,
  def: Pick<DefinicionMicrobioma, "id" | "nombre" | "celdas">,
  fila: number,
  columna: number
): Mapa {
  const mapa = clonar(mapaIn);
  const indices = celdasEstampado(mapa, def.celdas, fila, columna);
  // Desvincular instancias intersectadas antes de sobrescribir.
  const afectadas = new Set(indices.map((i) => mapa.celdas[i].microbioma).filter(Boolean) as string[]);
  for (const instId of afectadas) desvincularInstancia(mapa, instId);
  const id = idManual("micro");
  indices.forEach((i, j) => {
    const c = mapa.celdas[i];
    c.microbioma = id;
    c.bioma = def.celdas[j].bioma;
    c.altura = def.celdas[j].altura as 1 | 2 | 3;
  });
  mapa.instanciasMicrobioma.push({
    id,
    definicionId: def.id,
    nombre: def.nombre,
    ancla: { fila, columna },
    celdas: indices.map((i) => mapa.celdas[i]).map((c) => ({ fila: c.fila, columna: c.columna })),
    definicion: def.celdas.map((c) => ({ ...c })),
  });
  return mapa;
}

export function moverMicrobioma(mapaIn: Mapa, instId: string, fila: number, columna: number): Mapa {
  const inst = mapaIn.instanciasMicrobioma.find((m) => m.id === instId);
  if (!inst) return mapaIn;
  // Desvincular el origen conservando valores, luego estampar desde la nueva ancla.
  const mapa = clonar(mapaIn);
  desvincularInstancia(mapa, instId);
  return estamparMicrobioma(mapa, { id: inst.definicionId, nombre: inst.nombre, celdas: inst.definicion }, fila, columna);
}

export function desvincularMicrobioma(mapaIn: Mapa, instId: string): Mapa {
  const mapa = clonar(mapaIn);
  desvincularInstancia(mapa, instId);
  return mapa;
}

// ---------------------------------------------------------------------------
// Expansión por bordes (RF-EDI-012, RD-TAB-012, DEC-052)
// ---------------------------------------------------------------------------

export interface Bordes {
  arriba: number;
  abajo: number;
  izquierda: number;
  derecha: number;
}

export function expandir(
  mapaIn: Mapa,
  bordes: Bordes,
  bioma: string,
  altura: 1 | 2 | 3
): Mapa {
  const { filas, columnas } = mapaIn.configuracion;
  const vertical = bordes.arriba + bordes.abajo;
  const horizontal = bordes.izquierda + bordes.derecha;
  for (const [nombre, v] of Object.entries(bordes)) {
    if (!Number.isInteger(v) || v < 0) throw new ErrorEdicion(`El borde ${nombre} debe ser un entero no negativo.`);
  }
  if (vertical % 2 !== 0 || horizontal % 2 !== 0) {
    throw new ErrorEdicion("Las sumas vertical y horizontal deben ser pares.");
  }
  // DEC-092: un desplazamiento impar de columnas invierte la paridad de todas
  // ellas y altera la vecindad hexagonal del contenido existente.
  if (bordes.izquierda % 2 !== 0) {
    throw new ErrorEdicion("Para conservar la geometría, la expansión por la izquierda debe ser par.");
  }
  const nuevasFilas = filas + vertical;
  const nuevasColumnas = columnas + horizontal;
  if (nuevasFilas < 8 || nuevasFilas > 30 || nuevasColumnas < 8 || nuevasColumnas > 30) {
    throw new ErrorEdicion("Las dimensiones resultantes deben ser pares entre 8 y 30.");
  }
  if (nuevasFilas === filas && nuevasColumnas === columnas) return mapaIn;

  const mapa = clonar(mapaIn);
  mapa.configuracion = { ...mapa.configuracion, filas: nuevasFilas, columnas: nuevasColumnas };

  const df = bordes.arriba;
  const dc = bordes.izquierda;
  for (const c of mapa.celdas) {
    c.fila += df;
    c.columna += dc;
  }
  for (const g of mapa.gimnasios) {
    g.fila += df;
    g.columna += dc;
    g.area = g.area.map((a) => ({ fila: a.fila + df, columna: a.columna + dc }));
  }
  for (const m of mapa.instanciasMicrobioma) {
    m.ancla = { fila: m.ancla.fila + df, columna: m.ancla.columna + dc };
    m.celdas = m.celdas.map((c) => ({ fila: c.fila + df, columna: c.columna + dc }));
  }

  const ocupadas = new Set(mapa.celdas.map((c) => `${c.fila},${c.columna}`));
  for (let f = 1; f <= nuevasFilas; f++) {
    for (let c = 1; c <= nuevasColumnas; c++) {
      if (!ocupadas.has(`${f},${c}`)) {
        mapa.celdas.push({ fila: f, columna: c, bioma, altura, gimnasio: null, microbioma: null });
      }
    }
  }
  mapa.celdas.sort((a, b) => a.fila - b.fila || a.columna - b.columna);
  return mapa;
}
