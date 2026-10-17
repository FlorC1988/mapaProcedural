import express from "express";
import { pool } from "./db.js";
import { log } from "./logger.js";
import { catalogos } from "./routes/catalogos.js";
import { generarRouter } from "./routes/generar.js";
import { mapas } from "./routes/mapas.js";
import { pokemon } from "./routes/pokemon.js";

const app = express();
app.use(express.json({ limit: "5mb" }));

app.use((req, res, next) => {
  const inicio = process.hrtime.bigint();
  res.on("finish", () => {
    log("info", "http", {
      metodo: req.method,
      ruta: req.path,
      estado: res.statusCode,
      ms: Number(process.hrtime.bigint() - inicio) / 1e6,
    });
  });
  next();
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ estado: "ok" });
  } catch {
    res.status(503).json({ estado: "sin_base_de_datos" });
  }
});

app.use("/api", catalogos);
app.use("/api", generarRouter);
app.use("/api", mapas);
app.use("/api", pokemon);

// Fallos de operación: aviso persistente con causa y acción (RF-VIS-008).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log("error", "error_interno", { detalle: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    error: "error_interno",
    causa: "Ocurrió un error interno en el servidor.",
    accion: "Reintentá la operación. Si persiste, revisá los logs del servidor.",
  });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => log("info", "servidor_iniciado", { port }));
