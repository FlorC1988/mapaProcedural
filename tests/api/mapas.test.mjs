import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { alFinal, CONFIG_CHICA, del, get, limpiar, nombre, post, put, RUN } from "../ayudantes/api.mjs";

after(limpiar);

let gen;
const snapshot = (g = gen) => ({
  versionSnapshot: g.versionSnapshot,
  versionAlgoritmo: g.versionAlgoritmo,
  configuracion: g.mapa.configuracion,
  celdas: g.mapa.celdas,
  gimnasios: g.mapa.gimnasios,
  instanciasMicrobioma: g.mapa.instanciasMicrobioma,
  contexto: g.contextoSnapshot,
});

async function crearMapa(n = nombre("Mapa")) {
  const r = await post("/api/mapas", { nombre: n, snapshot: snapshot() });
  if (r.status === 201) alFinal(() => del(`/api/mapas/${r.body.id}`));
  return r;
}

before(async () => {
  gen = (await post("/api/generar", { ...CONFIG_CHICA, semilla: "suite-mapas" })).body;
  assert.equal(gen.resultado, "exito");
});

describe("Mapas guardados", () => {
  it("guardar crea identidad, versión 1 y nombre recortado", async () => {
    const n = nombre("Nuevo");
    const r = await crearMapa(`  ${n}  `);
    assert.equal(r.status, 201);
    assert.equal(r.body.nombre, n);
    assert.equal(r.body.version, 1);
    assert.ok(r.body.id && r.body.creadoEn && r.body.modificadoEn);
  });

  it("CA-MAP-002: nombre único sin distinguir mayúsculas y longitud 1..100", async () => {
    const n = nombre("Único");
    assert.equal((await crearMapa(n)).status, 201);
    const dup = await crearMapa(n.toUpperCase());
    assert.equal(dup.status, 409);
    assert.equal(dup.body.error, "nombre_duplicado");
    assert.equal((await crearMapa("   ")).status, 400);
    assert.equal((await crearMapa("x".repeat(101))).status, 400);
  });

  it("rechaza snapshot inválido", async () => {
    const r = await post("/api/mapas", { nombre: nombre("Inválido"), snapshot: { celdas: [] } });
    assert.equal(r.status, 400);
    assert.equal(r.body.error, "snapshot_invalido");
  });

  it("CA-MAP-001: al abrir se conserva la configuración y el contenido", async () => {
    const { body } = await crearMapa();
    const abierto = await get(`/api/mapas/${body.id}`);
    assert.equal(abierto.status, 200);
    assert.deepEqual(abierto.body.snapshot.configuracion, gen.mapa.configuracion);
    assert.deepEqual(abierto.body.snapshot.celdas, gen.mapa.celdas);
    assert.deepEqual(abierto.body.snapshot.gimnasios, gen.mapa.gimnasios);
  });

  it("listado con búsqueda parcial y orden", async () => {
    const a = await crearMapa(nombre("Lista A"));
    const b = await crearMapa(nombre("Lista B"));
    const q = encodeURIComponent(RUN.toLowerCase());
    const asc = (await get(`/api/mapas?buscar=${q}&orden=nombre&dir=asc`)).body.map((m) => m.id);
    assert.ok(asc.includes(a.body.id) && asc.includes(b.body.id));
    const desc = (await get(`/api/mapas?buscar=${q}&orden=nombre&dir=desc`)).body.map((m) => m.id);
    assert.deepEqual(desc, [...asc].reverse());
    const ninguno = (await get(`/api/mapas?buscar=${encodeURIComponent(RUN + " inexistente")}`)).body;
    assert.equal(ninguno.length, 0);
  });

  it("guardar sobre la identidad usa concurrencia optimista", async () => {
    const { body } = await crearMapa();
    const ok = await put(`/api/mapas/${body.id}`, { version: 1, snapshot: snapshot() });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.version, 2);
    const viejo = await put(`/api/mapas/${body.id}`, { version: 1, snapshot: snapshot() });
    assert.equal(viejo.status, 409);
    assert.equal(viejo.body.error, "conflicto_version");
    const malo = await put(`/api/mapas/${body.id}`, { version: 2, snapshot: {} });
    assert.equal(malo.status, 400);
  });

  it("Guardar como / Duplicar crea otra identidad con el mismo contenido", async () => {
    const a = await crearMapa();
    const b = await crearMapa(nombre("Copia"));
    assert.notEqual(a.body.id, b.body.id);
    const sb = (await get(`/api/mapas/${b.body.id}`)).body.snapshot;
    assert.deepEqual(sb.celdas, gen.mapa.celdas);
  });

  it("RD-REG-007: regenerar usa el contexto histórico y reproduce el mapa con la misma semilla", async () => {
    const { body } = await crearMapa();
    const r = await post(`/api/mapas/${body.id}/regenerar`);
    assert.equal(r.status, 200);
    assert.equal(r.body.resultado, "exito");
    assert.deepEqual(r.body.mapa.celdas, gen.mapa.celdas);
    assert.ok(r.body.contextoSnapshot);
  });

  it("eliminar es definitivo", async () => {
    const r = await post("/api/mapas", { nombre: nombre("Borrar"), snapshot: snapshot() });
    assert.equal((await del(`/api/mapas/${r.body.id}`)).status, 204);
    assert.equal((await get(`/api/mapas/${r.body.id}`)).status, 404);
    assert.equal((await del(`/api/mapas/${r.body.id}`)).status, 404);
    assert.equal((await post(`/api/mapas/${r.body.id}/regenerar`)).status, 404);
  });
});
