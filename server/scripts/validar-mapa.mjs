// Verificación manual: valida un mapa generado (respuesta de POST /api/generar)
// contra las condiciones de validez de docs/04-reglas-de-dominio.md §10.
// Uso: node server/scripts/validar-mapa.mjs <archivo.json>
// Las reglas viven en tests/ayudantes/reglas-mapa.mjs (compartidas con la suite).

import { readFileSync } from "node:fs";
import { validarMapa } from "../../tests/ayudantes/reglas-mapa.mjs";

const r = JSON.parse(readFileSync(process.argv[2], "utf8"));
if (r.resultado !== "exito") {
  console.log("resultado:", r.resultado);
  process.exit(0);
}
const errores = validarMapa(r);
console.log(errores.length === 0 ? "MAPA VÁLIDO" : `ERRORES (${errores.length}):\n` + errores.slice(0, 20).join("\n"));
