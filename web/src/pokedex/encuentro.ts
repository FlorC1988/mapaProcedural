import type { AtaqueInicialElegible, EspecieElegible } from "../api";

// Encuentro desde una celda (DEC-106): sorteo ponderado por prob_aparicion
// como rareza relativa entre las especies elegibles del bioma.
export function sortearEspecie(
  especies: EspecieElegible[],
  aleatorio: () => number = Math.random
): EspecieElegible | null {
  const total = especies.reduce((s, e) => s + e.prob_aparicion, 0);
  if (especies.length === 0 || total <= 0) return null;
  let r = aleatorio() * total;
  for (const e of especies) {
    r -= e.prob_aparicion;
    if (r < 0) return e;
  }
  return especies[especies.length - 1];
}

// Ataque inicial del encuentro (DEC-107): sorteo ponderado por el peso
// relativo `probabilidad` entre los hasta 4 iniciales de la especie.
export function sortearAtaqueInicial(
  iniciales: AtaqueInicialElegible[],
  aleatorio: () => number = Math.random
): AtaqueInicialElegible | null {
  const total = iniciales.reduce((s, a) => s + a.probabilidad, 0);
  if (iniciales.length === 0 || total <= 0) return null;
  let r = aleatorio() * total;
  for (const a of iniciales) {
    r -= a.probabilidad;
    if (r < 0) return a;
  }
  return iniciales[iniciales.length - 1];
}

export function tirarShiny(prob: number | null, aleatorio: () => number = Math.random): boolean {
  return prob != null && aleatorio() < prob;
}

// Sprite shiny de PokéAPI: .../sprites/pokemon/N.png -> .../sprites/pokemon/shiny/N.png
export function spriteShiny(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/^(.*\/sprites\/pokemon\/)([^/]+\.png)$/);
  return m ? `${m[1]}shiny/${m[2]}` : null;
}
