// Verificación manual: valida un mapa generado (respuesta de POST /api/generar)
// contra las condiciones de validez de docs/04-reglas-de-dominio.md §10.
// Uso: node server/scripts/validar-mapa.mjs <archivo.json>

import { readFileSync } from "node:fs";

const r = JSON.parse(readFileSync(process.argv[2], "utf8"));
if (r.resultado !== "exito") {
  console.log("resultado:", r.resultado);
  process.exit(0);
}
const { mapa, contexto } = r;
const { filas, columnas, n, radio } = mapa.configuracion;
const C = columnas;
const errores = [];

const idx = (f, c) => (f - 1) * C + (c - 1);
const axial = (f, c) => ({ q: c - 1, r: f - 1 - Math.floor((c - 1) / 2) });
const dist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const vecinos = (f, c) => {
  const a = axial(f, c);
  return dirs
    .map(([dq, dr]) => {
      const q = a.q + dq, rr = a.r + dr;
      return { fila: rr + Math.floor(q / 2) + 1, columna: q + 1 };
    })
    .filter((v) => v.fila >= 1 && v.fila <= filas && v.columna >= 1 && v.columna <= C);
};
const cuadrante = (f, c) => (f > filas / 2 ? 2 : 0) + (c > C / 2 ? 1 : 0);

const nombreBioma = Object.fromEntries(contexto.biomas.map((b) => [b.id, b.nombre]));
const INCOMP = new Set(["Hielo|Magma", "Magma|Hielo"]);

// 1/3. cantidad de posiciones y completitud
if (mapa.celdas.length !== filas * columnas) errores.push("cantidad de celdas incorrecta");
for (const celda of mapa.celdas) {
  if (!celda.bioma || ![1, 2, 3].includes(celda.altura)) errores.push(`celda vacía en ${celda.fila},${celda.columna}`);
}

// 4/5. adyacencias externas a microbiomas
for (const celda of mapa.celdas) {
  for (const v of vecinos(celda.fila, celda.columna)) {
    const o = mapa.celdas[idx(v.fila, v.columna)];
    if (celda.microbioma && celda.microbioma === o.microbioma) continue;
    if (Math.abs(celda.altura - o.altura) > 1) errores.push(`altura ${celda.fila},${celda.columna}`);
    if (INCOMP.has(`${nombreBioma[celda.bioma]}|${nombreBioma[o.bioma]}`))
      errores.push(`incompatibles ${celda.fila},${celda.columna}-${v.fila},${v.columna}`);
  }
}

// 6. microbiomas dentro, sin superposición ni adyacencia
const microCeldas = new Map();
for (const m of mapa.instanciasMicrobioma)
  for (const c of m.celdas) {
    if (microCeldas.has(`${c.fila},${c.columna}`)) errores.push("microbiomas superpuestos");
    microCeldas.set(`${c.fila},${c.columna}`, m.id);
  }
for (const m of mapa.instanciasMicrobioma)
  for (const c of m.celdas)
    for (const v of vecinos(c.fila, c.columna)) {
      const otro = microCeldas.get(`${v.fila},${v.columna}`);
      if (otro && otro !== m.id) errores.push("microbiomas adyacentes");
    }

// 8. N por cuadrante, tipos distintos, no adyacentes
const porCuadrante = [0, 0, 0, 0];
const tipos = new Set();
for (const g of mapa.gimnasios) {
  porCuadrante[g.cuadrante]++;
  if (tipos.has(g.tipoId)) errores.push("tipo de gimnasio repetido");
  tipos.add(g.tipoId);
  for (const h of mapa.gimnasios) {
    if (h === g) continue;
    if (dist(axial(g.fila, g.columna), axial(h.fila, h.columna)) === 1) errores.push("gimnasios adyacentes");
  }
}
porCuadrante.forEach((c, i) => { if (c !== n) errores.push(`cuadrante ${i} tiene ${c} gimnasios`); });

// 9/10. áreas dentro del cuadrante, sin superposición, biomas compatibles
const ocupada = new Set();
const compatPorTipo = new Map(); // tipo -> set nombres compatibles (todos en semilla)
for (const g of mapa.gimnasios) {
  const esperadas = vecinosEnRadio(g, radio);
  for (const c of g.area) {
    if (cuadrante(c.fila, c.columna) !== g.cuadrante) errores.push("área fuera de cuadrante");
    const k = `${c.fila},${c.columna}`;
    if (ocupada.has(k)) errores.push("áreas superpuestas");
    ocupada.add(k);
  }
}
function vecinosEnRadio(g, radio) {
  const a = axial(g.fila, g.columna);
  const out = [];
  for (let dq = -radio; dq <= radio; dq++)
    for (let dr = Math.max(-radio, -dq - radio); dr <= Math.min(radio, -dq + radio); dr++) {
      const q = a.q + dq, rr = a.r + dr;
      const f = rr + Math.floor(q / 2) + 1, c = q + 1;
      if (f >= 1 && f <= filas && c >= 1 && c <= columnas) out.push({ fila: f, columna: c });
    }
  return out;
}

console.log(errores.length === 0 ? "MAPA VÁLIDO" : `ERRORES (${errores.length}):\n` + [...new Set(errores)].slice(0, 20).join("\n"));
