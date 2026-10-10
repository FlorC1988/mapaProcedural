// PRNG determinista: toda elección aleatoria de la generación usa este
// generador sembrado (RD-REG-005/006, DEC-042).
// mulberry32 + FNV-1a para hash de semillas textuales.

export function hashSemilla(semilla: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function crearPRNG(semilla: string): () => number {
  let a = hashSemilla(semilla);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffle Fisher–Yates con el PRNG sembrado. */
export function mezclar<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Genera una semilla cuando el usuario no introduce una (RF-GEN-009). */
export function generarSemillaAleatoria(): string {
  return Math.floor(Math.random() * 0xffffffff).toString(36);
}
