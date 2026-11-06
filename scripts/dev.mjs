// Lanzador de desarrollo: levanta backend (tsx watch) y frontend (Vite),
// muestra la salida combinada en consola y la anexa a logs/dev.log con
// timestamp y prefijo por proceso. Al morir un hijo registra código y señal.
// Uso: npm run dev

import { appendFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_LOGS = join(RAIZ, "logs");
const ARCHIVO_LOG = join(DIR_LOGS, "dev.log");
mkdirSync(DIR_LOGS, { recursive: true });

const marca = () => new Date().toISOString();

function registrar(fuente, texto) {
  for (const linea of texto.split(/\r?\n/)) {
    if (linea === "") continue;
    const salida = `[${marca()}] [${fuente}] ${linea}`;
    console.log(salida);
    try {
      appendFileSync(ARCHIVO_LOG, salida + "\n");
    } catch {
      // Si el log no se puede escribir no se interrumpe la app.
    }
  }
}

registrar("dev", `===== sesión iniciada (pid ${process.pid}) =====`);

const hijos = [];
let muriendo = false;

function lanzar(nombre, args) {
  const hijo = spawn("cmd.exe", ["/c", "npm", "-w", nombre, "run", "dev"], {
    cwd: RAIZ,
    env: process.env,
  });
  hijo.stdout.on("data", (d) => registrar(nombre, String(d)));
  hijo.stderr.on("data", (d) => registrar(nombre, String(d)));
  hijo.on("error", (e) => registrar("dev", `no se pudo lanzar [${nombre}]: ${e.message}`));
  hijo.on("exit", (codigo, senal) => {
    registrar(nombre, `proceso terminado: código=${codigo ?? "?"} señal=${senal ?? "ninguna"}`);
    if (!muriendo) {
      muriendo = true;
      registrar("dev", `un proceso terminó; cerrando el resto`);
      for (const h of hijos) if (!h.killed) h.kill();
    }
  });
  hijos.push(hijo);
}

lanzar("server", []);
lanzar("web", []);

process.on("exit", () => {
  try {
    appendFileSync(ARCHIVO_LOG, `[${marca()}] [dev] ===== sesión terminada =====\n`);
  } catch {
    // El archivo no se puede escribir durante el cierre; nada más que hacer.
  }
});
