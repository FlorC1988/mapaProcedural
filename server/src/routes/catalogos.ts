import { Router } from "express";
import { pool } from "../db.js";
import { validarDefinicion } from "../dominio/microbioma.js";

export const catalogos = Router();

const NOMBRE_RE = /^.{1,100}$/;

async function auditar(tipoEntidad: string, entidadId: string, tipoCambio: string) {
  await pool.query(
    `insert into auditoria_admin (tipo_entidad, entidad_id, tipo_cambio) values ($1, $2, $3)`,
    [tipoEntidad, entidadId, tipoCambio]
  );
}

function esViolacionUnica(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

async function biomasActivos(): Promise<Set<string>> {
  const { rows } = await pool.query(`select id from biomas where activo`);
  return new Set(rows.map((r: { id: string }) => r.id));
}

catalogos.get("/biomas", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select b.id, b.nombre::text as nombre, b.color, b.icono, b.activo, b.version,
              coalesce((
                select array_agg(otro.bioma order by bn.nombre)
                from (
                  select case when i.bioma_a = b.id then i.bioma_b else i.bioma_a end as bioma
                  from incompatibilidades i
                  where i.bioma_a = b.id or i.bioma_b = b.id
                ) otro
                join biomas bn on bn.id = otro.bioma
              ), '{}') as incompatibles_con
       from biomas b
       order by b.nombre`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

catalogos.get("/tipos-gimnasio", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select t.id, t.nombre,
              coalesce((
                select array_agg(tgb.bioma_id order by b.nombre)
                from tipo_gimnasio_biomas tgb
                join biomas b on b.id = tgb.bioma_id
                where tgb.tipo_id = t.id
              ), '{}') as biomas_compatibles
       from tipos_gimnasio t
       order by t.id`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

catalogos.get("/microbiomas", async (req, res, next) => {
  try {
    const { q, estado, orden } = req.query as { q?: string; estado?: string; orden?: string };
    const params: unknown[] = [];
    let where = "true";
    if (q) {
      params.push(`%${q}%`);
      where += ` and nombre ilike $${params.length}`;
    }
    if (estado === "activo" || estado === "inactivo") {
      params.push(estado === "activo");
      where += ` and activo = $${params.length}`;
    }
    const dir = orden === "desc" ? "desc" : "asc";
    const { rows } = await pool.query(
      `select id, nombre::text as nombre, activo, version, celdas,
              creado_en as "creadoEn", modificado_en as "modificadoEn"
       from microbiomas where ${where} order by nombre ${dir}`,
      params
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// --- Biomas -----------------------------------------------------------------

catalogos.post("/biomas", async (req, res, next) => {
  try {
    const { nombre, color, icono, incompatibles_con } = req.body ?? {};
    const n = typeof nombre === "string" ? nombre.trim() : "";
    if (!NOMBRE_RE.test(n) || typeof color !== "string" || typeof icono !== "string" || !icono) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    const incomp = Array.isArray(incompatibles_con) ? incompatibles_con : [];
    if (!incomp.every((x: unknown) => typeof x === "string")) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    const cliente = await pool.connect();
    try {
      await cliente.query("begin");
      const { rows } = await cliente.query(
        `insert into biomas (nombre, color, icono) values ($1, $2, $3) returning id`,
        [n, color, icono]
      );
      const id = rows[0].id as string;
      for (const otro of new Set(incomp) as Set<string>) {
        if (otro === id) continue;
        const [a, b] = [id, otro].sort();
        await cliente.query(
          `insert into incompatibilidades (bioma_a, bioma_b) values ($1, $2) on conflict do nothing`,
          [a, b]
        );
      }
      await cliente.query("commit");
      await auditar("bioma", id, "creacion");
      res.status(201).json({ id });
    } catch (e) {
      await cliente.query("rollback");
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      throw e;
    } finally {
      cliente.release();
    }
  } catch (e) {
    next(e);
  }
});

catalogos.put("/biomas/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, color, icono, activo, incompatibles_con } = req.body ?? {};
    const n = typeof nombre === "string" ? nombre.trim() : "";
    if (!NOMBRE_RE.test(n) || typeof color !== "string" || typeof icono !== "string" || !icono ||
        typeof activo !== "boolean" || !Array.isArray(incompatibles_con)) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    if (incompatibles_con.includes(id)) {
      return res.status(400).json({ causa: "incompatibilidad_consigo_mismo" });
    }

    if (activo === false) {
      // RF-ADM-008: bloquear desactivación si lo usa un microbioma activo o una
      // compatibilidad de tipo de gimnasio.
      const { rows: usosMic } = await pool.query(
        `select 1 from microbiomas m
         where m.activo and exists (
           select 1 from jsonb_array_elements(m.celdas) c where c->>'bioma' = $1::text
         ) limit 1`,
        [id]
      );
      if (usosMic.length > 0) {
        return res.status(409).json({ causa: "bioma_en_uso", accion: "El bioma está usado por un microbioma activo." });
      }
      const { rows: usosTipo } = await pool.query(
        `select 1 from tipo_gimnasio_biomas where bioma_id = $1 limit 1`,
        [id]
      );
      if (usosTipo.length > 0) {
        return res.status(409).json({ causa: "bioma_en_uso", accion: "El bioma es compatible con algún tipo de gimnasio." });
      }
    }

    const cliente = await pool.connect();
    try {
      await cliente.query("begin");
      const { rowCount } = await cliente.query(
        `update biomas set nombre = $1, color = $2, icono = $3, activo = $4,
                version = version + 1, modificado_en = now()
         where id = $5`,
        [n, color, icono, activo, id]
      );
      if (rowCount === 0) {
        await cliente.query("rollback");
        return res.status(404).json({ causa: "no_encontrado" });
      }
      // Reemplaza las incompatibilidades del bioma (simétricas por almacenamiento ordenado).
      await cliente.query(
        `delete from incompatibilidades where bioma_a = $1 or bioma_b = $1`,
        [id]
      );
      for (const otro of new Set(incompatibles_con) as Set<string>) {
        const [a, b] = [id, otro].sort();
        await cliente.query(
          `insert into incompatibilidades (bioma_a, bioma_b) values ($1, $2)`,
          [a, b]
        );
      }
      await cliente.query("commit");
      await auditar("bioma", id, "edicion");
      res.json({ ok: true });
    } catch (e) {
      await cliente.query("rollback");
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23503") {
        return res.status(400).json({ causa: "parametros_invalidos" });
      }
      throw e;
    } finally {
      cliente.release();
    }
  } catch (e) {
    next(e);
  }
});

// --- Tipos de gimnasio -------------------------------------------------------

catalogos.put("/tipos-gimnasio/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { biomas_compatibles } = req.body ?? {};
    if (!Number.isInteger(id) || !Array.isArray(biomas_compatibles) || biomas_compatibles.length === 0) {
      return res.status(400).json({ causa: "parametros_invalidos", accion: "Un tipo debe conservar al menos un bioma compatible." });
    }
    const activos = await biomasActivos();
    if (!biomas_compatibles.every((b: unknown) => typeof b === "string" && activos.has(b))) {
      return res.status(400).json({ causa: "bioma_inactivo", accion: "Solo se admiten biomas activos." });
    }
    const { rowCount: existe } = await pool.query(`select 1 from tipos_gimnasio where id = $1`, [id]);
    if (existe === 0) return res.status(404).json({ causa: "no_encontrado" });

    const cliente = await pool.connect();
    try {
      await cliente.query("begin");
      await cliente.query(`delete from tipo_gimnasio_biomas where tipo_id = $1`, [id]);
      for (const b of new Set(biomas_compatibles) as Set<string>) {
        await cliente.query(
          `insert into tipo_gimnasio_biomas (tipo_id, bioma_id) values ($1, $2)`,
          [id, b]
        );
      }
      await cliente.query("commit");
      await auditar("tipo_gimnasio", String(id), "compatibilidades");
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

// --- Microbiomas -------------------------------------------------------------

catalogos.post("/microbiomas", async (req, res, next) => {
  try {
    const { nombre, celdas } = req.body ?? {};
    const n = typeof nombre === "string" ? nombre.trim() : "";
    if (!NOMBRE_RE.test(n)) return res.status(400).json({ causa: "parametros_invalidos" });
    const error = validarDefinicion(celdas, await biomasActivos());
    if (error) return res.status(400).json({ causa: error });
    try {
      const { rows } = await pool.query(
        `insert into microbiomas (nombre, celdas) values ($1, $2) returning id`,
        [n, JSON.stringify(celdas)]
      );
      await auditar("microbioma", rows[0].id, "creacion");
      res.status(201).json({ id: rows[0].id });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

catalogos.put("/microbiomas/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, activo, celdas, version } = req.body ?? {};
    const n = typeof nombre === "string" ? nombre.trim() : "";
    if (!NOMBRE_RE.test(n) || typeof activo !== "boolean" || !Number.isInteger(version)) {
      return res.status(400).json({ causa: "parametros_invalidos" });
    }
    const error = validarDefinicion(celdas, await biomasActivos());
    if (error) return res.status(400).json({ causa: error });
    try {
      const { rows } = await pool.query(
        `update microbiomas set nombre = $1, activo = $2, celdas = $3,
                version = version + 1, modificado_en = now()
         where id = $4 and version = $5
         returning version`,
        [n, activo, JSON.stringify(celdas), id, version]
      );
      if (rows.length === 0) {
        const { rowCount } = await pool.query(`select 1 from microbiomas where id = $1`, [id]);
        if (rowCount === 0) return res.status(404).json({ causa: "no_encontrado" });
        return res.status(409).json({ causa: "conflicto_version", accion: "La definición cambió desde que se abrió; recargá antes de guardar." });
      }
      await auditar("microbioma", id, "edicion");
      res.json({ version: rows[0].version });
    } catch (e) {
      if (esViolacionUnica(e)) return res.status(409).json({ causa: "nombre_duplicado" });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});
