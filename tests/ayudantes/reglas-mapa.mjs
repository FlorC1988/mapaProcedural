// Condiciones de validez de un mapa generado (docs/04-reglas-de-dominio.md §10,
// docs/11 CA-GEN-001..013). Recibe la respuesta de POST /api/generar y
// devuelve la lista de violaciones (vacía si el mapa es válido).
// Compartido por la suite de pruebas y por server/scripts/validar-mapa.mjs.

const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const axial = (f, c) => ({ q: c - 1, r: f - 1 - Math.floor((c - 1) / 2) });
const dist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;

export function validarMapa(respuesta) {
  const { mapa } = respuesta;
  const ctx = respuesta.contextoSnapshot ?? respuesta.contexto;
  const { filas, columnas, n, radio } = mapa.configuracion;
  const errores = [];
  const idx = (f, c) => (f - 1) * columnas + (c - 1);
  const dentro = (f, c) => f >= 1 && f <= filas && c >= 1 && c <= columnas;
  const vecinos = (f, c) => {
    const a = axial(f, c);
    return DIRS.map(([dq, dr]) => {
      const q = a.q + dq, r = a.r + dr;
      return { fila: r + Math.floor(q / 2) + 1, columna: q + 1 };
    }).filter((v) => dentro(v.fila, v.columna));
  };
  const enRadio = (f, c, rad) => {
    const a = axial(f, c);
    const out = [];
    for (let dq = -rad; dq <= rad; dq++)
      for (let dr = Math.max(-rad, -dq - rad); dr <= Math.min(rad, -dq + rad); dr++) {
        const q = a.q + dq, r = a.r + dr;
        const v = { fila: r + Math.floor(q / 2) + 1, columna: q + 1 };
        if (dentro(v.fila, v.columna)) out.push(v);
      }
    return out;
  };
  const cuadrante = (f, c) => (f > filas / 2 ? 2 : 0) + (c > columnas / 2 ? 1 : 0);

  const incompatibles = new Set(
    (ctx.incompatibilidades ?? []).flatMap(({ a, b }) => [`${a}|${b}`, `${b}|${a}`])
  );
  const activos = new Set(ctx.biomas.filter((b) => b.activo !== false).map((b) => b.id));
  const compatPorTipo = new Map(
    (ctx.tiposGimnasio ?? []).map((t) => [t.id, new Set(t.biomasCompatibles ?? [])])
  );

  // CA-GEN-001 / CA-GEO-001: grilla completa, índice coherente
  if (mapa.celdas.length !== filas * columnas) errores.push("cantidad de celdas incorrecta");
  mapa.celdas.forEach((c, i) => {
    if (idx(c.fila, c.columna) !== i) errores.push(`orden de celdas incorrecto en ${c.fila},${c.columna}`);
    if (!c.bioma || ![1, 2, 3].includes(c.altura)) errores.push(`celda vacía en ${c.fila},${c.columna}`);
    // CA-GEN-013: solo biomas activos
    if (!activos.has(c.bioma)) errores.push(`bioma inactivo en ${c.fila},${c.columna}`);
  });

  // CA-GEN-002 / 003: altura e incompatibilidades fuera de la excepción interna
  for (const c of mapa.celdas) {
    for (const v of vecinos(c.fila, c.columna)) {
      const o = mapa.celdas[idx(v.fila, v.columna)];
      if (c.microbioma && c.microbioma === o.microbioma) continue;
      if (Math.abs(c.altura - o.altura) > 1) errores.push(`altura ${c.fila},${c.columna}`);
      if (incompatibles.has(`${c.bioma}|${o.bioma}`))
        errores.push(`incompatibles ${c.fila},${c.columna}-${v.fila},${v.columna}`);
    }
  }

  // CA-GEN-004 / 005: microbiomas completos, sin superposición ni adyacencia
  const microDe = new Map();
  for (const m of mapa.instanciasMicrobioma) {
    if (m.celdas.length !== m.definicion.length) errores.push(`microbioma ${m.id} incompleto`);
    for (const c of m.celdas) {
      const k = `${c.fila},${c.columna}`;
      if (microDe.has(k)) errores.push("microbiomas superpuestos");
      microDe.set(k, m.id);
      if (mapa.celdas[idx(c.fila, c.columna)].microbioma !== m.id) errores.push("pertenencia de microbioma inconsistente");
    }
    // Alturas de la definición sin rotación ni reflexión
    const a = axial(m.ancla.fila, m.ancla.columna);
    for (const d of m.definicion) {
      const q = a.q + d.dq, r = a.r + d.dr;
      const f = r + Math.floor(q / 2) + 1, col = q + 1;
      const celda = dentro(f, col) ? mapa.celdas[idx(f, col)] : null;
      if (!celda) errores.push("microbioma fuera del tablero");
      else if (celda.altura !== d.altura) errores.push(`altura de microbioma alterada en ${f},${col}`);
    }
  }
  for (const m of mapa.instanciasMicrobioma)
    for (const c of m.celdas)
      for (const v of vecinos(c.fila, c.columna)) {
        const otro = microDe.get(`${v.fila},${v.columna}`);
        if (otro && otro !== m.id) errores.push("microbiomas adyacentes");
      }

  // CA-GEN-007 / 009: N por cuadrante, tipos distintos, no adyacentes
  const porCuadrante = [0, 0, 0, 0];
  const tipos = new Set();
  for (const g of mapa.gimnasios) {
    porCuadrante[g.cuadrante]++;
    if (cuadrante(g.fila, g.columna) !== g.cuadrante) errores.push("gimnasio en cuadrante equivocado");
    if (tipos.has(g.tipoId)) errores.push("tipo de gimnasio repetido");
    tipos.add(g.tipoId);
    if (mapa.celdas[idx(g.fila, g.columna)].gimnasio !== g.id) errores.push("celda de gimnasio inconsistente");
    for (const h of mapa.gimnasios)
      if (h !== g && dist(axial(g.fila, g.columna), axial(h.fila, h.columna)) === 1) errores.push("gimnasios adyacentes");
  }
  porCuadrante.forEach((c, i) => {
    if (c !== n) errores.push(`cuadrante ${i} tiene ${c} gimnasios (esperado ${n})`);
  });

  // CA-GEN-009 / 010 / 017: áreas = radio exacto, en su cuadrante, sin superposición, biomas compatibles
  const ocupada = new Set();
  for (const g of mapa.gimnasios) {
    const esperadas = enRadio(g.fila, g.columna, radio).map((v) => `${v.fila},${v.columna}`).sort();
    const reales = g.area.map((c) => `${c.fila},${c.columna}`).sort();
    if (esperadas.join(";") !== reales.join(";")) errores.push(`área del gimnasio ${g.id} no coincide con el radio`);
    const compat = compatPorTipo.get(g.tipoId);
    for (const c of g.area) {
      if (cuadrante(c.fila, c.columna) !== g.cuadrante) errores.push("área fuera de cuadrante");
      const k = `${c.fila},${c.columna}`;
      if (ocupada.has(k)) errores.push("áreas superpuestas");
      ocupada.add(k);
      if (compat && !compat.has(mapa.celdas[idx(c.fila, c.columna)].bioma)) errores.push(`bioma incompatible con el tipo en ${k}`);
    }
  }

  return [...new Set(errores)];
}
