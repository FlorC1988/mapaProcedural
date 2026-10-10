import { Router } from "express";
import {
  cargarContextoSnapshot,
  snapshotAContexto,
  VERSION_SNAPSHOT,
} from "../dominio/contexto.js";
import { generar } from "../generador/generador.js";
import { log } from "../logger.js";

export const generarRouter = Router();

// Rangos aprobados (RF-GEN-008). El servidor es la autoridad (RF-VAL-002).
const REGLAS: Record<string, { min: number; max: number; par?: boolean }> = {
  filas: { min: 8, max: 30, par: true },
  columnas: { min: 8, max: 30, par: true },
  microbiomas: { min: 0, max: 10 },
  n: { min: 1, max: 4 },
  radio: { min: 0, max: 2 },
};

generarRouter.post("/generar", async (req, res, next) => {
  try {
    const cuerpo = req.body ?? {};
    const errores: Record<string, string> = {};
    for (const [campo, r] of Object.entries(REGLAS)) {
      const v = cuerpo[campo];
      if (!Number.isInteger(v) || v < r.min || v > r.max || (r.par && v % 2 !== 0)) {
        errores[campo] = `Debe ser un entero ${r.par ? "par " : ""}entre ${r.min} y ${r.max}.`;
      }
    }
    if (cuerpo.semilla !== undefined && typeof cuerpo.semilla !== "string") {
      errores.semilla = "Debe ser texto.";
    }
    const elegidos = cuerpo.microbiomasElegidos;
    if (
      elegidos !== undefined &&
      (!Array.isArray(elegidos) || elegidos.some((id) => typeof id !== "string"))
    ) {
      errores.microbiomasElegidos = "Debe ser una lista de identificadores.";
    }
    if (
      Array.isArray(elegidos) &&
      Number.isInteger(cuerpo.microbiomas) &&
      cuerpo.microbiomas > 0 &&
      elegidos.length === 0
    ) {
      errores.microbiomasElegidos = "Elegí al menos una definición para colocar microbiomas.";
    }
    if (Object.keys(errores).length > 0) {
      res.status(400).json({
        error: "parametros_invalidos",
        causa: "Hay parámetros fuera de rango.",
        accion: "Corregí los campos marcados.",
        campos: errores,
      });
      return;
    }

    const inicio = process.hrtime.bigint();
    const ctxSnap = await cargarContextoSnapshot();
    const ctx = snapshotAContexto(ctxSnap);
    if (Array.isArray(elegidos)) {
      const activas = new Set(ctx.microbiomas.filter((m) => m.activo).map((m) => m.id));
      const desconocidas = (elegidos as string[]).filter((id) => !activas.has(id));
      if (desconocidas.length > 0) {
        res.status(400).json({
          error: "parametros_invalidos",
          causa: "Hay definiciones de microbioma elegidas que no existen o están inactivas.",
          accion: "Actualizá la selección de microbiomas.",
        });
        return;
      }
    }
    const { resultado, semilla } = generar(
      {
        filas: cuerpo.filas,
        columnas: cuerpo.columnas,
        microbiomas: cuerpo.microbiomas,
        microbiomasElegidos: Array.isArray(elegidos) ? elegidos : undefined,
        n: cuerpo.n,
        radio: cuerpo.radio,
        semilla: cuerpo.semilla,
      },
      ctx
    );
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    log("info", "generacion", {
      resultado: resultado.tipo,
      nodos: resultado.nodos,
      ms: Math.round(ms),
    });

    res.json({
      resultado: resultado.tipo,
      semilla,
      mapa: resultado.tipo === "exito" ? resultado.mapa : null,
      contexto: {
        biomas: ctx.biomas.map(({ id, nombre, color, icono }) => ({ id, nombre, color, icono })),
        tiposGimnasio: ctx.tiposGimnasio.map(({ id, nombre }) => ({ id, nombre })),
      },
      contextoSnapshot: ctxSnap,
      versionSnapshot: VERSION_SNAPSHOT,
    });
  } catch (e) {
    next(e);
  }
});
