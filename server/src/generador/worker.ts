// Ejecuta una generación fuera del hilo principal para no bloquear la API.
import { parentPort, workerData } from "node:worker_threads";
import { snapshotAContexto } from "../dominio/snapshot.js";
import { generar } from "./generador.js";

const { config, contexto, presupuesto } = workerData;
parentPort!.postMessage(generar(config, snapshotAContexto(contexto), presupuesto));
