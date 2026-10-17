import type { ConfigGeneracion } from "./tipos.js";

// Rangos aprobados (RF-GEN-008). El servidor es la autoridad (RF-VAL-002).
const REGLAS: Record<string, { min: number; max: number; par?: boolean }> = {
  filas: { min: 8, max: 30, par: true },
  columnas: { min: 8, max: 30, par: true },
  microbiomas: { min: 0, max: 10 },
  n: { min: 1, max: 4 },
  radio: { min: 0, max: 2 },
};

export type ConfigEntrada = Omit<ConfigGeneracion, "semilla"> & { semilla?: string };

/** Valida una configuración de generación; devuelve errores por campo o la configuración tipada. */
export function validarConfig(
  cuerpo: Record<string, unknown>
): { errores: Record<string, string> } | { config: ConfigEntrada } {
  const errores: Record<string, string> = {};
  for (const [campo, r] of Object.entries(REGLAS)) {
    const v = cuerpo[campo];
    if (!Number.isInteger(v) || (v as number) < r.min || (v as number) > r.max || (r.par && (v as number) % 2 !== 0)) {
      errores[campo] = `Debe ser un entero ${r.par ? "par " : ""}entre ${r.min} y ${r.max}.`;
    }
  }
  if (cuerpo.semilla !== undefined && typeof cuerpo.semilla !== "string") {
    errores.semilla = "Debe ser texto.";
  }
  const elegidos = cuerpo.microbiomasElegidos;
  if (elegidos !== undefined && (!Array.isArray(elegidos) || elegidos.some((id) => typeof id !== "string"))) {
    errores.microbiomasElegidos = "Debe ser una lista de identificadores.";
  } else if (
    Array.isArray(elegidos) &&
    Number.isInteger(cuerpo.microbiomas) &&
    (cuerpo.microbiomas as number) > 0 &&
    elegidos.length === 0
  ) {
    errores.microbiomasElegidos = "Elegí al menos una definición para colocar microbiomas.";
  }
  if (Object.keys(errores).length > 0) return { errores };
  return {
    config: {
      filas: cuerpo.filas as number,
      columnas: cuerpo.columnas as number,
      microbiomas: cuerpo.microbiomas as number,
      microbiomasElegidos: elegidos as string[] | undefined,
      n: cuerpo.n as number,
      radio: cuerpo.radio as number,
      semilla: cuerpo.semilla as string | undefined,
    },
  };
}

export function respuestaParametrosInvalidos(errores: Record<string, string>) {
  return {
    error: "parametros_invalidos",
    causa: "Hay parámetros fuera de rango.",
    accion: "Corregí los campos marcados.",
    campos: errores,
  };
}
