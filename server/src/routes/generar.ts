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
    const { resultado, semilla } = generar(
      {
        filas: cuerpo.filas,
        columnas: cuerpo.columnas,
        microbiomas: cuerpo.microbiomas,
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
