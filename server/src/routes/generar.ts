import { Router } from "express";
import { cargarContextoSnapshot, VERSION_SNAPSHOT } from "../dominio/contexto.js";
import { respuestaParametrosInvalidos, validarConfig } from "../dominio/config.js";
import { generarEnWorker } from "../generador/ejecutar.js";
import { log } from "../logger.js";

export const generarRouter = Router();

generarRouter.post("/generar", async (req, res, next) => {
  try {
    const validacion = validarConfig(req.body ?? {});
    if ("errores" in validacion) {
      res.status(400).json(respuestaParametrosInvalidos(validacion.errores));
      return;
    }
    const { config } = validacion;

    const inicio = process.hrtime.bigint();
    const ctxSnap = await cargarContextoSnapshot();
    if (config.microbiomasElegidos) {
      const activas = new Set(ctxSnap.microbiomas.filter((m) => m.activo).map((m) => m.id));
      if (config.microbiomasElegidos.some((id) => !activas.has(id))) {
        res.status(400).json({
          error: "parametros_invalidos",
          causa: "Hay definiciones de microbioma elegidas que no existen o están inactivas.",
          accion: "Actualizá la selección de microbiomas.",
        });
        return;
      }
    }
    const { resultado, semilla } = await generarEnWorker(config, ctxSnap);
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
        biomas: ctxSnap.biomas.map(({ id, nombre, color, icono }) => ({ id, nombre, color, icono })),
        tiposGimnasio: ctxSnap.tiposGimnasio.map(({ id, nombre }) => ({ id, nombre })),
      },
      contextoSnapshot: ctxSnap,
      versionSnapshot: VERSION_SNAPSHOT,
      versionAlgoritmo: ctxSnap.versionAlgoritmo,
    });
  } catch (e) {
    next(e);
  }
});
