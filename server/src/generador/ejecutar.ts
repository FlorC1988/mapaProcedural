import { Worker } from "node:worker_threads";
import type { ConfigEntrada } from "../dominio/config.js";
import type { ContextoSnapshot } from "../dominio/snapshot.js";
import type { ResultadoGeneracion } from "../dominio/tipos.js";
import { PRESUPUESTO_NODOS } from "./generador.js";

// En desarrollo (tsx) los módulos son .ts y el worker necesita el loader de tsx.
const esTs = import.meta.url.endsWith(".ts");
const URL_WORKER = new URL(esTs ? "./worker.ts" : "./worker.js", import.meta.url);

/** Ejecuta el generador en un worker thread (uno por petición). */
export function generarEnWorker(
  config: ConfigEntrada,
  contexto: ContextoSnapshot,
  presupuesto: number = PRESUPUESTO_NODOS
): Promise<{ resultado: ResultadoGeneracion; semilla: string }> {
  return new Promise((resolve, reject) => {
    const w = new Worker(URL_WORKER, {
      workerData: { config, contexto, presupuesto },
      execArgv: esTs ? ["--import", "tsx"] : [],
    });
    w.once("message", resolve);
    w.once("error", reject);
    w.once("exit", (codigo) => {
      if (codigo !== 0) reject(new Error(`El worker de generación terminó con código ${codigo}.`));
    });
  });
}
