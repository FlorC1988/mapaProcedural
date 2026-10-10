// Geometría hexagonal (misma regla que el servidor, DEC-013).

export interface Axial {
  q: number;
  r: number;
}

export const DIRECCIONES: readonly Axial[] = [
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

export function axialAVisible(q: number, r: number): { fila: number; columna: number } {
  return { columna: q + 1, fila: r + Math.floor(q / 2) + 1 };
}
