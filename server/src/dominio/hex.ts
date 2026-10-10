// Geometría aprobada (DEC-013, DEC-086): flat-top, columnas visibles pares
// desplazadas medio hexágono hacia abajo, coordenadas axiales internas (q, r)
// y coordenadas visibles (fila, columna) desde 1.

export interface Axial {
  q: number;
  r: number;
}

export interface Visible {
  fila: number;
  columna: number;
}

export const DIRECCIONES_AXIALES: readonly Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function visibleAAxial(fila: number, columna: number): Axial {
  const q = columna - 1;
  return { q, r: fila - 1 - Math.floor(q / 2) };
}

export function axialAVisible(q: number, r: number): Visible {
  return { columna: q + 1, fila: r + Math.floor(q / 2) + 1 };
}

export function distanciaAxial(a: Axial, b: Axial): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
}

/** Índice de celda lineal de un tablero de filas×columnas a coordenada visible. */
export function indiceAVisible(i: number, columnas: number): Visible {
  return { fila: Math.floor(i / columnas) + 1, columna: (i % columnas) + 1 };
}

export function visibleAIndice(fila: number, columna: number, columnas: number): number {
  return (fila - 1) * columnas + (columna - 1);
}

/** Cuadrante 0..3 según coordenadas visibles (05-modelo-de-datos §6). */
export function cuadranteDe(fila: number, columna: number, filas: number, columnas: number): number {
  const inferior = fila > filas / 2;
  const derecho = columna > columnas / 2;
  return (inferior ? 2 : 0) + (derecho ? 1 : 0);
}

/** Vecinos por lado (distancia axial 1) dentro del tablero, como índices lineales. */
export function vecinosDe(i: number, filas: number, columnas: number): number[] {
  const { fila, columna } = indiceAVisible(i, columnas);
  const a = visibleAAxial(fila, columna);
  const out: number[] = [];
  for (const d of DIRECCIONES_AXIALES) {
    const v = axialAVisible(a.q + d.q, a.r + d.r);
    if (v.fila >= 1 && v.fila <= filas && v.columna >= 1 && v.columna <= columnas) {
      out.push(visibleAIndice(v.fila, v.columna, columnas));
    }
  }
  return out;
}

/** Todas las celdas a distancia axial ≤ radio de i, dentro del tablero. Incluye i. */
export function celdasEnRadio(i: number, radio: number, filas: number, columnas: number): number[] {
  const { fila, columna } = indiceAVisible(i, columnas);
  const a = visibleAAxial(fila, columna);
  const out: number[] = [];
  for (let dq = -radio; dq <= radio; dq++) {
    for (let dr = Math.max(-radio, -dq - radio); dr <= Math.min(radio, -dq + radio); dr++) {
      const v = axialAVisible(a.q + dq, a.r + dr);
      if (v.fila >= 1 && v.fila <= filas && v.columna >= 1 && v.columna <= columnas) {
        out.push(visibleAIndice(v.fila, v.columna, columnas));
      }
    }
  }
  return out;
}
