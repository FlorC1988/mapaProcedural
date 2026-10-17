// Colores oficiales de los 18 tipos elementales, indexados por id de tipos_gimnasio.
export const COLOR_TIPO: Record<number, string> = {
  1: "#b7b7ce", // Acero
  2: "#6390f0", // Agua
  3: "#a6b91a", // Bicho
  4: "#6f35fc", // Dragón
  5: "#f7d02c", // Eléctrico
  6: "#735797", // Fantasma
  7: "#ee8130", // Fuego
  8: "#d685ad", // Hada
  9: "#96d9d6", // Hielo
  10: "#c22e28", // Lucha
  11: "#a8a77a", // Normal
  12: "#7ac74c", // Planta
  13: "#f95587", // Psíquico
  14: "#b6a136", // Roca
  15: "#705746", // Siniestro
  16: "#e2bf65", // Tierra
  17: "#a33ea1", // Veneno
  18: "#a98ff3", // Volador
};

// Color de texto (claro u oscuro) que mejor contrasta con el fondo dado.
export function contrasteTexto(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? "#18181b" : "#ffffff";
}

// Formato de número de dex estilo Pokédex: 1 -> "#0001", 3.1 -> "#0003.1".
export function formatearDex(dex: number): string {
  const entero = Math.floor(dex);
  const decimal = Math.round((dex - entero) * 100);
  const base = `#${String(entero).padStart(4, "0")}`;
  return decimal === 0 ? base : `${base}.${decimal}`;
}

// Porcentaje con un decimal a partir de una probabilidad 0..1.
export function formatearPorcentaje(p: number | null): string {
  return p == null ? "—" : `${(p * 100).toFixed(1)} %`;
}
