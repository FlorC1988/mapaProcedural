import { DIRECCIONES_AXIALES } from "./hex.js";

export interface CeldaDefinicion {
  dq: number;
  dr: number;
  bioma: string;
  altura: 1 | 2 | 3;
}

// Valida la estructura de una definición de microbioma (RD-MIC-012, RD-MIC-013).
// Devuelve el código de error o null si es válida.
export function validarDefinicion(
  celdas: unknown,
  biomasActivos: Set<string>
): string | null {
  if (!Array.isArray(celdas)) return "celdas_invalidas";
  if (celdas.length < 1 || celdas.length > 900) return "celdas_fuera_de_rango";

  const vistas = new Set<string>();
  let anclas = 0;
  for (const c of celdas) {
    if (
      typeof c !== "object" ||
      c === null ||
      !Number.isInteger((c as CeldaDefinicion).dq) ||
      !Number.isInteger((c as CeldaDefinicion).dr) ||
      typeof (c as CeldaDefinicion).bioma !== "string" ||
      ![1, 2, 3].includes((c as CeldaDefinicion).altura)
    ) {
      return "celdas_invalidas";
    }
    const celda = c as CeldaDefinicion;
    const clave = `${celda.dq},${celda.dr}`;
    if (vistas.has(clave)) return "coordenadas_duplicadas";
    vistas.add(clave);
    if (celda.dq === 0 && celda.dr === 0) anclas++;
    if (!biomasActivos.has(celda.bioma)) return "bioma_inactivo";
  }
  if (anclas !== 1) return "ancla_ausente";

  // Conectividad por lados (BFS desde el ancla).
  const pendientes = ["0,0"];
  const alcanzadas = new Set<string>(pendientes);
  while (pendientes.length > 0) {
    const [q, r] = pendientes.pop()!.split(",").map(Number);
    for (const d of DIRECCIONES_AXIALES) {
      const k = `${q + d.q},${r + d.r}`;
      if (vistas.has(k) && !alcanzadas.has(k)) {
        alcanzadas.add(k);
        pendientes.push(k);
      }
    }
  }
  if (alcanzadas.size !== celdas.length) return "forma_desconectada";

  // Extensión máxima equivalente a 30×30 posiciones visibles, para ambas
  // paridades posibles de la columna del ancla (RD-MIC-012).
  for (const paridad of [0, 1]) {
    let minCol = Infinity, maxCol = -Infinity, minFil = Infinity, maxFil = -Infinity;
    for (const c of celdas as CeldaDefinicion[]) {
      const col = c.dq;
      const fil = c.dr + Math.floor((paridad + c.dq) / 2);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
      minFil = Math.min(minFil, fil);
      maxFil = Math.max(maxFil, fil);
    }
    if (maxCol - minCol >= 30 || maxFil - minFil >= 30) return "extension_excedida";
  }

  return null;
}
