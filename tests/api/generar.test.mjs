import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { alFinal, biomasActivos, CONFIG_CHICA, get, limpiar, nombre, post, put } from "../ayudantes/api.mjs";
import { validarMapa } from "../ayudantes/reglas-mapa.mjs";

after(limpiar);

const generar = (config) => post("/api/generar", config);

async function crearMicro(celdas) {
  const r = await post("/api/microbiomas", { nombre: nombre("Micro gen"), celdas });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  alFinal(async () => {
    const d = (await get("/api/microbiomas")).body.find((m) => m.id === r.body.id);
    if (d?.activo) await put(`/api/microbiomas/${d.id}`, { nombre: d.nombre, activo: false, celdas: d.celdas, version: d.version });
  });
  return r.body.id;
}

let B;
before(async () => {
  B = (await biomasActivos())[0].id;
});

describe("Generación de mapas", () => {
  it("CA-GEN-001..013: un mapa chico generado cumple todas las reglas", async () => {
    const r = await generar({ ...CONFIG_CHICA, semilla: "suite-chica" });
    assert.equal(r.status, 200);
    assert.equal(r.body.resultado, "exito");
    assert.equal(r.body.mapa.celdas.length, 64, "CA-GEO-001");
    assert.equal(r.body.mapa.gimnasios.length, 4, "CA-GEN-007: 4 × N");
    assert.deepEqual(validarMapa(r.body), []);
  });

  it("valores predeterminados 16×16, N=2, radio 1 generan un mapa válido", async () => {
    const r = await generar({ filas: 16, columnas: 16, microbiomas: 0, microbiomasElegidos: [], n: 2, radio: 1, semilla: "suite-def" });
    assert.equal(r.body.resultado, "exito");
    assert.equal(r.body.mapa.gimnasios.length, 8);
    assert.deepEqual(validarMapa(r.body), []);
  });

  it("CA-GEN-004/005/006: genera con un microbioma elegido y lo coloca completo", async () => {
    const id = await crearMicro([
      { dq: 0, dr: 0, bioma: B, altura: 2 },
      { dq: 1, dr: 0, bioma: B, altura: 2 },
      { dq: 0, dr: 1, bioma: B, altura: 2 },
    ]);
    const r = await generar({ filas: 16, columnas: 16, microbiomas: 2, microbiomasElegidos: [id], n: 1, radio: 1, semilla: "suite-micro" });
    assert.equal(r.body.resultado, "exito");
    assert.equal(r.body.mapa.instanciasMicrobioma.length, 2);
    assert.ok(r.body.mapa.instanciasMicrobioma.every((m) => m.definicionId === id));
    assert.deepEqual(validarMapa(r.body), []);
  });

  it("CA-GEN-017: con radio 0 cada área es solo la celda del gimnasio", async () => {
    const r = await generar({ ...CONFIG_CHICA, radio: 0, semilla: "suite-r0" });
    assert.equal(r.body.resultado, "exito");
    for (const g of r.body.mapa.gimnasios) assert.deepEqual(g.area, [{ fila: g.fila, columna: g.columna }]);
    assert.deepEqual(validarMapa(r.body), []);
  });

  it("CA-GEN-020: misma semilla y contexto producen exactamente el mismo mapa", async () => {
    const config = { ...CONFIG_CHICA, filas: 10, columnas: 10, semilla: "suite-repro" };
    const a = await generar(config);
    const b = await generar(config);
    assert.deepEqual(a.body.mapa, b.body.mapa);
    const c = await generar({ ...config, semilla: "suite-repro-otra" });
    assert.notDeepEqual(a.body.mapa.celdas, c.body.mapa.celdas);
  });

  it("CA-GEN-019: sin semilla, el sistema genera una y la conserva en el mapa", async () => {
    const r = await generar(CONFIG_CHICA);
    assert.equal(typeof r.body.semilla, "string");
    assert.ok(r.body.semilla.length > 0);
    assert.equal(r.body.mapa.configuracion.semilla, r.body.semilla);
  });

  it("CA-GEN-016 / CA-GEN-008: parámetros fuera de rango o N > 4 se rechazan sin buscar", async () => {
    for (const extra of [{ filas: 9 }, { columnas: 32 }, { n: 5 }, { radio: 3 }, { microbiomas: 11 }]) {
      const r = await generar({ ...CONFIG_CHICA, ...extra });
      assert.equal(r.status, 400, JSON.stringify(extra));
      assert.equal(r.body.error, "parametros_invalidos");
      assert.ok(Object.keys(r.body.campos).length > 0);
    }
  });

  it("rechaza definiciones elegidas inexistentes", async () => {
    const r = await generar({ ...CONFIG_CHICA, microbiomas: 1, microbiomasElegidos: ["00000000-0000-0000-0000-000000000000"] });
    assert.equal(r.status, 400);
  });

  it("CA-GEN-018/024: configuración válida pero imposible falla sin mapa parcial", { timeout: 120_000 }, async () => {
    // Fila de 12 celdas: no cabe en un tablero de 8 columnas.
    const fila = Array.from({ length: 12 }, (_, i) => ({ dq: i, dr: -Math.floor(i / 2), bioma: B, altura: 1 }));
    const id = await crearMicro(fila);
    const r = await generar({ ...CONFIG_CHICA, microbiomas: 1, microbiomasElegidos: [id], semilla: "suite-imposible" });
    assert.equal(r.status, 200);
    assert.equal(r.body.resultado, "sin_solucion");
    assert.equal(r.body.mapa, null);
  });
});
