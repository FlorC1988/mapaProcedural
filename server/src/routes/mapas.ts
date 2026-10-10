import { Router } from "express";
import { pool } from "../db.js";
import { log } from "../logger.js";
import { snapshotAContexto, VERSION_SNAPSHOT, type ContextoSnapshot } from "../dominio/contexto.js";
import { generar, PRESUPUESTO_NODOS } from "../generador/generador.js";

export const mapas = Router();

const ORDENES: Record<string, string> = {
  nombre: "nombre",
  creacion: "creado_en",
  modificacion: "modificado_en",
};

function nombreValido(n: unknown): n is string {
  return typeof n === "string" && n.trim().length >= 1 && n.trim().length <= 100;
}

// Listado con búsqueda parcial y orden (RF-MAP-009).
mapas.get("/mapas", async (req, res, next) => {
  try {
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
    const orden = ORDENES[req.query.orden as string] ?? "modificado_en";
    const dir = req.query.dir === "asc" ? "asc" : "desc";
    const { rows } = await pool.query(
      `select id, nombre::text as nombre, creado_en as "creadoEn",
              modificado_en as "modificadoEn", version
       from mapas
       where ($1 = '' or nombre ilike '%' || $1 || '%')
       order by ${orden} ${dir}, id`,
      [buscar]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

mapas.get("/mapas/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select id, nombre::text as nombre, creado_en as "creadoEn",
              modificado_en as "modificadoEn", version, snapshot
       from mapas where id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "no_encontrado", causa: "El mapa no existe.", accion: "Actualizá el listado." });
      return;
    }
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

function validarSnapshot(s: unknown): s is Record<string, unknown> {
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  const snap = s as Record<string, unknown>;
  const conf = snap.configuracion as Record<string, unknown> | undefined;
  return (
    !!conf &&
    Number.isInteger(conf.filas) &&
    Number.isInteger(conf.columnas) &&
    Array.isArray(snap.celdas) &&
    Array.isArray(snap.gimnasios) &&
    Array.isArray(snap.instanciasMicrobioma) &&
    !!snap.contexto &&
    typeof snap.contexto === "object"
  );
}

// Crear (Guardar nuevo, Guardar como, Duplicar) (RF-MAP-006/007).
mapas.post("/mapas", async (req, res, next) => {
  try {
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    if (!nombreValido(nombre)) {
      res.status(400).json({
        error: "nombre_invalido",
        causa: "El nombre debe tener entre 1 y 100 caracteres.",
        accion: "Corregí el nombre.",
      });
      return;
    }
    if (!validarSnapshot(req.body?.snapshot)) {
      res.status(400).json({ error: "snapshot_invalido", causa: "El contenido del mapa es inválido.", accion: "Regenerá el mapa." });
      return;
    }
    try {
      const { rows } = await pool.query(
        `insert into mapas (nombre, snapshot) values ($1, $2)
         returning id, nombre::text as nombre, creado_en as "creadoEn",
                   modificado_en as "modificadoEn", version`,
        [nombre, req.body.snapshot]
      );
      res.status(201).json(rows[0]);
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "23505") {
        res.status(409).json({
          error: "nombre_duplicado",
          causa: `Ya existe un mapa llamado "${nombre}".`,
          accion: "Elegí otro nombre.",
        });
        return;
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

// Guardar sobre identidad existente con concurrencia optimista (RF-MAP-010, DEC-048).
mapas.put("/mapas/:id", async (req, res, next) => {
  try {
    const version = req.body?.version;
    if (!Number.isInteger(version) || !validarSnapshot(req.body?.snapshot)) {
      res.status(400).json({ error: "solicitud_invalida", causa: "Faltan datos o son inválidos.", accion: "Recargá el mapa." });
      return;
    }
    // Actualización atómica: solo si la versión persistida coincide.
    const { rows } = await pool.query(
      `update mapas
       set snapshot = $2, modificado_en = now(), version = version + 1
       where id = $1 and version = $3
       returning id, nombre::text as nombre, creado_en as "creadoEn",
                 modificado_en as "modificadoEn", version`,
      [req.params.id, req.body.snapshot, version]
    );
    if (rows.length === 0) {
      const existe = await pool.query(`select 1 from mapas where id = $1`, [req.params.id]);
      if (existe.rows.length === 0) {
        res.status(404).json({ error: "no_encontrado", causa: "El mapa no existe.", accion: "Actualizá el listado." });
      } else {
        res.status(409).json({
          error: "conflicto_version",
          causa: "Otra persona modificó este mapa desde que lo abriste.",
          accion: "Recargá el mapa o usá Guardar como.",
        });
      }
      return;
    }
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// Eliminación definitiva (RF-MAP-008); la confirmación es responsabilidad del cliente.
mapas.delete("/mapas/:id", async (req, res, next) => {
  try {
    const r = await pool.query(`delete from mapas where id = $1`, [req.params.id]);
    if (r.rowCount === 0) {
      res.status(404).json({ error: "no_encontrado", causa: "El mapa no existe.", accion: "Actualizá el listado." });
      return;
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// Regenerar usando el contexto histórico del snapshot (RD-REG-007, DEC-047).
mapas.post("/mapas/:id/regenerar", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`select snapshot from mapas where id = $1`, [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: "no_encontrado", causa: "El mapa no existe.", accion: "Actualizá el listado." });
      return;
    }
    const snapshot = rows[0].snapshot as {
      configuracion: Record<string, number>;
      contexto: ContextoSnapshot;
    };
    const ctx = snapshotAContexto(snapshot.contexto);
    const conf = { ...snapshot.configuracion, ...(req.body?.configuracion ?? {}) } as {
      filas: number;
      columnas: number;
      microbiomas: number;
      n: number;
      radio: number;
      semilla?: string;
    };
    const inicio = process.hrtime.bigint();
    const { resultado, semilla } = generar(conf, ctx, PRESUPUESTO_NODOS);
    log("info", "regeneracion", {
      mapaId: req.params.id,
      resultado: resultado.tipo,
      nodos: resultado.nodos,
      ms: Math.round(Number(process.hrtime.bigint() - inicio) / 1e6),
    });
    res.json({
      resultado: resultado.tipo,
      semilla,
      mapa: resultado.tipo === "exito" ? resultado.mapa : null,
      contexto: {
        biomas: ctx.biomas.map(({ id, nombre, color, icono }) => ({ id, nombre, color, icono })),
        tiposGimnasio: ctx.tiposGimnasio.map(({ id, nombre }) => ({ id, nombre })),
      },
      versionSnapshot: VERSION_SNAPSHOT,
    });
  } catch (e) {
    next(e);
  }
});
