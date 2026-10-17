import { Router } from "express";
import { pool } from "../db.js";

// Catálogos de la expansión Pokémon (docs/13-expansion-pokemon.md).
export const pokemon = Router();

const NOMBRE_RE = /^.{1,100}$/;
const URL_RE = /^$|^https?:\/\/\S+$/;

async function auditar(tipoEntidad: string, entidadId: string, tipoCambio: string) {
  await pool.query(
    `insert into auditoria_admin (tipo_entidad, entidad_id, tipo_cambio) values ($1, $2, $3)`,
    [tipoEntidad, entidadId, tipoCambio]
  );
}

function esViolacionUnica(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

const esTexto = (v: unknown): v is string => typeof v === "string";
const esTextoONulo = (v: unknown) => v === null || typeof v === "string";
const esNumONulo = (v: unknown) =>
  v === null || (typeof v === "number" && Number.isFinite(v));
const esIdTipo = (v: unknown) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 18;

// ---------------------------------------------------------------------------
// Estados alterados (RF-ATQ-003)
// ---------------------------------------------------------------------------

pokemon.get("/estados-alterados", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select id, nombre::text as nombre, activo, version from estados_alterados order by nombre`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

pokemon.post("/estados-alterados", async (req, res, next) => {
  try {
    const n = esTexto(req.body?.nombre) ? req.body.nombre.trim() : "";
    if (!NOMBRE_RE.test(n)) return res.status(400).json({ causa: "parametros_invalidos" });
    try {
      const { rows } = await pool.query(
        `insert into estados_alterados (nombre) values ($1) returning id`,
        [n]
      );
      await auditar("estado_alterado", rows[0].id, "creacion");
      res.status(201).json({ id: rows[0].id });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

pokemon.put("/estados-alterados/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, activo, version } = req.body ?? {};
    const n = esTexto(nombre) ? nombre.trim() : "";
    if (!NOMBRE_RE.test(n) || typeof activo !== "boolean" || !Number.isInteger(version)) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    if (activo === false) {
      const { rows: usos } = await pool.query(
        `select 1 from ataques where activo and (estado_objetivo_id = $1 or estado_auto_id = $1) limit 1`,
        [id]
      );
      if (usos.length > 0) {
        return res.status(409).json({ causa: "estado_en_uso", accion: "El estado está usado por un ataque activo." });
      }
    }
    try {
      const { rows } = await pool.query(
        `update estados_alterados set nombre = $1, activo = $2,
                version = version + 1, modificado_en = now()
         where id = $3 and version = $4 returning version`,
        [n, activo, id, version]
      );
      if (rows.length === 0) {
        const { rowCount } = await pool.query(`select 1 from estados_alterados where id = $1`, [id]);
        if (rowCount === 0) return res.status(404).json({ causa: "no_encontrado" });
        return res.status(409).json({ causa: "conflicto_version", accion: "El estado cambió desde que se abrió; recargá antes de guardar." });
      }
      await auditar("estado_alterado", id, "edicion");
      res.json({ version: rows[0].version });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Categorías de especie (DEC-104)
// ---------------------------------------------------------------------------

pokemon.get("/categorias-especie", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select c.id, c.nombre::text as nombre, c.activo, c.version,
              (select count(*)::int from especie_categorias ec where ec.categoria_id = c.id) as usos
       from categorias_especie c order by c.nombre`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

pokemon.post("/categorias-especie", async (req, res, next) => {
  try {
    const n = esTexto(req.body?.nombre) ? req.body.nombre.trim() : "";
    if (!NOMBRE_RE.test(n)) return res.status(400).json({ causa: "parametros_invalidos" });
    try {
      const { rows } = await pool.query(
        `insert into categorias_especie (nombre) values ($1) returning id`,
        [n]
      );
      await auditar("categoria_especie", rows[0].id, "creacion");
      res.status(201).json({ id: rows[0].id });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

pokemon.put("/categorias-especie/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, activo, version } = req.body ?? {};
    const n = esTexto(nombre) ? nombre.trim() : "";
    if (!NOMBRE_RE.test(n) || typeof activo !== "boolean" || !Number.isInteger(version)) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    if (activo === false) {
      const { rows: usos } = await pool.query(
        `select 1 from especie_categorias ec join especies e on e.id = ec.especie_id
         where ec.categoria_id = $1 and e.activo limit 1`,
        [id]
      );
      if (usos.length > 0) {
        return res.status(409).json({ causa: "categoria_en_uso", accion: "La categoría está usada por una especie activa." });
      }
    }
    try {
      const { rows } = await pool.query(
        `update categorias_especie set nombre = $1, activo = $2,
                version = version + 1, modificado_en = now()
         where id = $3 and version = $4 returning version`,
        [n, activo, id, version]
      );
      if (rows.length === 0) {
        const { rowCount } = await pool.query(`select 1 from categorias_especie where id = $1`, [id]);
        if (rowCount === 0) return res.status(404).json({ causa: "no_encontrado" });
        return res.status(409).json({ causa: "conflicto_version", accion: "La categoría cambió desde que se abrió; recargá antes de guardar." });
      }
      await auditar("categoria_especie", id, "edicion");
      res.json({ version: rows[0].version });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Ataques (RF-ATQ-001/002)
// ---------------------------------------------------------------------------

pokemon.get("/ataques", async (req, res, next) => {
  try {
    const { q, estado, tipo, orden } = req.query as Record<string, string | undefined>;
    const params: unknown[] = [];
    let where = "true";
    if (q) {
      params.push(`%${q}%`);
      where += ` and a.nombre ilike $${params.length}`;
    }
    if (estado === "activo" || estado === "inactivo") {
      params.push(estado === "activo");
      where += ` and a.activo = $${params.length}`;
    }
    if (tipo && Number.isInteger(Number(tipo))) {
      params.push(Number(tipo));
      where += ` and a.tipo_id = $${params.length}`;
    }
    const dir = orden === "desc" ? "desc" : "asc";
    const { rows } = await pool.query(
      `select a.id, a.nombre::text as nombre, a.tipo_id, a.descripcion, a.danio,
              a.estado_objetivo_id, a.estado_auto_id, a.activo, a.version,
              creado_en as "creadoEn", modificado_en as "modificadoEn"
       from ataques a where ${where} order by a.nombre ${dir}`,
      params
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

function validarAtaque(b: Record<string, unknown>): string | null {
  const n = esTexto(b.nombre) ? b.nombre.trim() : "";
  if (!NOMBRE_RE.test(n)) return "parametros_invalidos";
  if (!esIdTipo(b.tipo_id)) return "parametros_invalidos";
  if (!esTexto(b.descripcion)) return "parametros_invalidos";
  if (b.danio !== null && !(Number.isInteger(b.danio) && (b.danio as number) >= 0 && (b.danio as number) <= 99)) {
    return "parametros_invalidos";
  }
  if (!esTextoONulo(b.estado_objetivo_id) || !esTextoONulo(b.estado_auto_id)) return "parametros_invalidos";
  return null;
}

pokemon.post("/ataques", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const error = validarAtaque(b);
    if (error) return res.status(400).json({ causa: error });
    try {
      const { rows } = await pool.query(
        `insert into ataques (nombre, tipo_id, descripcion, danio, estado_objetivo_id, estado_auto_id)
         values ($1,$2,$3,$4,$5,$6) returning id`,
        [b.nombre.trim(), b.tipo_id, b.descripcion, b.danio ?? null, b.estado_objetivo_id ?? null, b.estado_auto_id ?? null]
      );
      await auditar("ataque", rows[0].id, "creacion");
      res.status(201).json({ id: rows[0].id });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23503") {
        return res.status(400).json({ causa: "referencia_invalida" });
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

pokemon.put("/ataques/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const b = req.body ?? {};
    const error = validarAtaque(b);
    if (error || typeof b.activo !== "boolean" || !Number.isInteger(b.version)) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    if (b.activo === false) {
      const { rows: usos } = await pool.query(
        `select 1 from especies where activo and ataque_inicial_id = $1 limit 1`,
        [id]
      );
      if (usos.length > 0) {
        return res.status(409).json({ causa: "ataque_en_uso", accion: "El ataque es ataque inicial de una especie activa." });
      }
    }
    try {
      const { rows } = await pool.query(
        `update ataques set nombre = $1, tipo_id = $2, descripcion = $3, danio = $4,
                estado_objetivo_id = $5, estado_auto_id = $6, activo = $7,
                version = version + 1, modificado_en = now()
         where id = $8 and version = $9 returning version`,
        [b.nombre.trim(), b.tipo_id, b.descripcion, b.danio ?? null,
         b.estado_objetivo_id ?? null, b.estado_auto_id ?? null, b.activo, id, b.version]
      );
      if (rows.length === 0) {
        const { rowCount } = await pool.query(`select 1 from ataques where id = $1`, [id]);
        if (rowCount === 0) return res.status(404).json({ causa: "no_encontrado" });
        return res.status(409).json({ causa: "conflicto_version", accion: "El ataque cambió desde que se abrió; recargá antes de guardar." });
      }
      await auditar("ataque", id, "edicion");
      res.json({ version: rows[0].version });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23503") {
        return res.status(400).json({ causa: "referencia_invalida" });
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Especies (RF-PKM-001/002/003)
// ---------------------------------------------------------------------------

const SELECT_ESPECIE = `
  select e.id, e.dex, e.nombre::text as nombre, e.tipo_i, e.tipo_ii,
         e.hp, e.iniciativa, e.puntos_evolucion, e.ataque_inicial_id,
         e.preevolucion, e.evolucion, e.etapa, e.sprite_url, e.grito_url,
         e.generacion, e.prob_aparicion, e.prob_shiny,
         e.activo, e.version, e.creado_en as "creadoEn", e.modificado_en as "modificadoEn",
         coalesce((select array_agg(ec.categoria_id) from especie_categorias ec
                   where ec.especie_id = e.id), '{}') as categorias,
         coalesce((select array_agg(et.tipo_id order by et.tipo_id) from especie_tipos_ataque et
                   where et.especie_id = e.id), '{}') as tipos_ataque
  from especies e`;

pokemon.get("/especies", async (req, res, next) => {
  try {
    const { q, estado, tipo, categoria, generacion, orden } = req.query as Record<string, string | undefined>;
    const params: unknown[] = [];
    let where = "true";
    if (q) {
      params.push(`%${q}%`);
      where += ` and e.nombre ilike $${params.length}`;
    }
    if (estado === "activo" || estado === "inactivo") {
      params.push(estado === "activo");
      where += ` and e.activo = $${params.length}`;
    }
    if (tipo && Number.isInteger(Number(tipo))) {
      params.push(Number(tipo));
      where += ` and (e.tipo_i = $${params.length} or e.tipo_ii = $${params.length})`;
    }
    if (categoria) {
      params.push(categoria);
      where += ` and exists (select 1 from especie_categorias ec where ec.especie_id = e.id and ec.categoria_id = $${params.length})`;
    }
    if (generacion && Number.isInteger(Number(generacion))) {
      params.push(Number(generacion));
      where += ` and e.generacion = $${params.length}`;
    }
    const col = orden === "nombre" ? "e.nombre asc" : "e.dex asc";
    const { rows } = await pool.query(`${SELECT_ESPECIE} where ${where} order by ${col}`, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

pokemon.get("/especies/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`${SELECT_ESPECIE} where e.id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ causa: "no_encontrado" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

function validarEspecie(b: Record<string, unknown>): string | null {
  const n = esTexto(b.nombre) ? b.nombre.trim() : "";
  if (!NOMBRE_RE.test(n)) return "parametros_invalidos";
  if (!(typeof b.dex === "number" && b.dex > 0 && b.dex < 100000)) return "dex_invalido";
  if (!esIdTipo(b.tipo_i)) return "tipo_invalido";
  if (b.tipo_ii !== null && !(esIdTipo(b.tipo_ii) && b.tipo_ii !== b.tipo_i)) return "tipo_invalido";
  for (const campo of ["hp", "iniciativa", "puntos_evolucion"]) {
    if (!esNumONulo(b[campo])) return "parametros_invalidos";
  }
  if (b.generacion !== null && !(Number.isInteger(b.generacion) && (b.generacion as number) >= 0 && (b.generacion as number) <= 99)) {
    return "parametros_invalidos";
  }
  for (const campo of ["prob_aparicion", "prob_shiny"]) {
    if (b[campo] !== null && !(esNumONulo(b[campo]) && (b[campo] as number) >= 0 && (b[campo] as number) <= 1)) {
      return "parametros_invalidos";
    }
  }
  for (const campo of ["preevolucion", "evolucion", "etapa"]) {
    if (!esTextoONulo(b[campo])) return "parametros_invalidos";
  }
  for (const campo of ["sprite_url", "grito_url"]) {
    if (!esTextoONulo(b[campo])) return "parametros_invalidos";
    if (typeof b[campo] === "string" && !URL_RE.test(b[campo] as string)) return "url_invalida";
  }
  if (!Array.isArray(b.categorias) || !b.categorias.every(esTexto)) return "parametros_invalidos";
  if (!Array.isArray(b.tipos_ataque) || (b.tipos_ataque as unknown[]).length > 4 ||
      !(b.tipos_ataque as unknown[]).every(esIdTipo)) return "parametros_invalidos";
  if (!esTextoONulo(b.ataque_inicial_id)) return "parametros_invalidos";
  return null;
}

pokemon.post("/especies", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const error = validarEspecie(b);
    if (error) return res.status(400).json({ causa: error });
    const cliente = await pool.connect();
    try {
      await cliente.query("begin");
      const { rows } = await cliente.query(
        `insert into especies (dex, nombre, tipo_i, tipo_ii, hp, iniciativa, puntos_evolucion,
                               ataque_inicial_id, preevolucion, evolucion, etapa, sprite_url, grito_url,
                               generacion, prob_aparicion, prob_shiny)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning id`,
        [b.dex, b.nombre.trim(), b.tipo_i, b.tipo_ii ?? null, b.hp ?? null, b.iniciativa ?? null,
         b.puntos_evolucion ?? null, b.ataque_inicial_id ?? null, b.preevolucion ?? null,
         b.evolucion ?? null, b.etapa ?? null, b.sprite_url || null, b.grito_url || null,
         b.generacion ?? null, b.prob_aparicion ?? null, b.prob_shiny ?? null]
      );
      const id = rows[0].id as string;
      for (const c of new Set(b.categorias as string[])) {
        await cliente.query(
          `insert into especie_categorias (especie_id, categoria_id) values ($1,$2)`, [id, c]);
      }
      for (const t of new Set(b.tipos_ataque as number[])) {
        await cliente.query(
          `insert into especie_tipos_ataque (especie_id, tipo_id) values ($1,$2)`, [id, t]);
      }
      await cliente.query("commit");
      await auditar("especie", id, "creacion");
      res.status(201).json({ id });
    } catch (e) {
      await cliente.query("rollback");
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "duplicado" });
      if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23503") {
        return res.status(400).json({ causa: "referencia_invalida" });
      }
      throw e;
    } finally {
      cliente.release();
    }
  } catch (e) {
    next(e);
  }
});

pokemon.put("/especies/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const b = req.body ?? {};
    const error = validarEspecie(b);
    if (error || typeof b.activo !== "boolean" || !Number.isInteger(b.version)) {
      return res.status(400).json({ causa: error ?? "parametros_invalidos" });
    }
    const cliente = await pool.connect();
    try {
      await cliente.query("begin");
      const { rows } = await cliente.query(
        `update especies set dex = $1, nombre = $2, tipo_i = $3, tipo_ii = $4, hp = $5,
                iniciativa = $6, puntos_evolucion = $7, ataque_inicial_id = $8,
                preevolucion = $9, evolucion = $10, etapa = $11, sprite_url = $12, grito_url = $13,
                generacion = $14, prob_aparicion = $15, prob_shiny = $16, activo = $17,
                version = version + 1, modificado_en = now()
         where id = $18 and version = $19 returning version`,
        [b.dex, b.nombre.trim(), b.tipo_i, b.tipo_ii ?? null, b.hp ?? null, b.iniciativa ?? null,
         b.puntos_evolucion ?? null, b.ataque_inicial_id ?? null, b.preevolucion ?? null,
         b.evolucion ?? null, b.etapa ?? null, b.sprite_url || null, b.grito_url || null,
         b.generacion ?? null, b.prob_aparicion ?? null, b.prob_shiny ?? null, b.activo, id, b.version]
      );
      if (rows.length === 0) {
        await cliente.query("rollback");
        const { rowCount } = await pool.query(`select 1 from especies where id = $1`, [id]);
        if (rowCount === 0) return res.status(404).json({ causa: "no_encontrado" });
        return res.status(409).json({ causa: "conflicto_version", accion: "La especie cambió desde que se abrió; recargá antes de guardar." });
      }
      await cliente.query(`delete from especie_categorias where especie_id = $1`, [id]);
      for (const c of new Set(b.categorias as string[])) {
        await cliente.query(
          `insert into especie_categorias (especie_id, categoria_id) values ($1,$2)`, [id, c]);
      }
      await cliente.query(`delete from especie_tipos_ataque where especie_id = $1`, [id]);
      for (const t of new Set(b.tipos_ataque as number[])) {
        await cliente.query(
          `insert into especie_tipos_ataque (especie_id, tipo_id) values ($1,$2)`, [id, t]);
      }
      await cliente.query("commit");
      await auditar("especie", id, "edicion");
      res.json({ version: rows[0].version });
    } catch (e) {
      await cliente.query("rollback");
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "duplicado" });
      if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23503") {
        return res.status(400).json({ causa: "referencia_invalida" });
      }
      throw e;
    } finally {
      cliente.release();
    }
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Aparición por bioma (RF-ENC-001, DEC-098)
// ---------------------------------------------------------------------------

pokemon.get("/apariciones", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select bioma_id, tipo_id, incluye_tipo_ii as "incluyeTipoII"
       from aparicion_bioma order by bioma_id, tipo_id`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

pokemon.put("/apariciones/:biomaId", async (req, res, next) => {
  try {
    const { biomaId } = req.params;
    const { tipos } = req.body ?? {};
    // tipos: [{ tipo_id, incluyeTipoII }]
    if (!Array.isArray(tipos) ||
        !tipos.every((t: { tipo_id?: unknown; incluyeTipoII?: unknown }) =>
          esIdTipo(t?.tipo_id) && typeof t?.incluyeTipoII === "boolean")) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    const { rowCount: existe } = await pool.query(`select 1 from biomas where id = $1`, [biomaId]);
    if (existe === 0) return res.status(404).json({ causa: "no_encontrado" });

    const cliente = await pool.connect();
    try {
      await cliente.query("begin");
      await cliente.query(`delete from aparicion_bioma where bioma_id = $1`, [biomaId]);
      const vistos = new Set<number>();
      for (const t of tipos as { tipo_id: number; incluyeTipoII: boolean }[]) {
        if (vistos.has(t.tipo_id)) continue;
        vistos.add(t.tipo_id);
        await cliente.query(
          `insert into aparicion_bioma (bioma_id, tipo_id, incluye_tipo_ii) values ($1,$2,$3)`,
          [biomaId, t.tipo_id, t.incluyeTipoII]
        );
      }
      await cliente.query("commit");
      await auditar("aparicion_bioma", biomaId, "edicion");
      res.json({ ok: true });
    } catch (e) {
      await cliente.query("rollback");
      throw e;
    } finally {
      cliente.release();
    }
  } catch (e) {
    next(e);
  }
});
