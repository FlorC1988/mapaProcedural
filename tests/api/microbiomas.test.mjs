import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { alFinal, biomasActivos, get, limpiar, nombre, post, put, RUN } from "../ayudantes/api.mjs";

after(limpiar);

let B;
before(async () => {
  B = (await biomasActivos())[0].id;
});

const celdas = () => [
  { dq: 0, dr: 0, bioma: B, altura: 1 },
  { dq: 1, dr: 0, bioma: B, altura: 3 },
];
const buscar = async (id) => (await get("/api/microbiomas")).body.find((m) => m.id === id);

async function crear(n = nombre("Micro"), c = celdas()) {
  const r = await post("/api/microbiomas", { nombre: n, celdas: c });
  if (r.status === 201) {
    alFinal(async () => {
      const d = await buscar(r.body.id);
      if (d?.activo) await put(`/api/microbiomas/${d.id}`, { nombre: d.nombre, activo: false, celdas: d.celdas, version: d.version });
    });
  }
  return r;
}

describe("Definiciones de microbioma", () => {
  it("CA-ADM-002/003: se crea activa con el nombre recortado", async () => {
    const n = nombre("Recorte");
    const r = await crear(`   ${n}   `);
    assert.equal(r.status, 201);
    const d = await buscar(r.body.id);
    assert.equal(d.nombre, n);
    assert.equal(d.activo, true);
    assert.equal(d.version, 1);
    assert.equal(d.celdas.length, 2);
  });

  it("CA-ADM-003: rechaza nombre duplicado sin distinguir mayúsculas", async () => {
    const n = nombre("Dup");
    assert.equal((await crear(n)).status, 201);
    const r = await crear(n.toLowerCase());
    assert.equal(r.status, 409);
    assert.equal(r.body.causa, "nombre_duplicado");
  });

  it("CA-ADM-004: rechaza estructuras inválidas con su causa", async () => {
    const casos = [
      [[{ dq: 1, dr: 0, bioma: B, altura: 1 }], "ancla_ausente"],
      [[{ dq: 0, dr: 0, bioma: B, altura: 1 }, { dq: 3, dr: 0, bioma: B, altura: 1 }], "forma_desconectada"],
      [[], "celdas_fuera_de_rango"],
      [[{ dq: 0, dr: 0, bioma: "00000000-0000-0000-0000-000000000000", altura: 1 }], "bioma_inactivo"],
    ];
    for (const [c, causa] of casos) {
      const r = await crear(nombre("Inválido"), c);
      assert.equal(r.status, 400);
      assert.equal(r.body.causa, causa);
    }
  });

  it("CA-ADM-009: concurrencia optimista al editar", async () => {
    const { body } = await crear();
    const d = await buscar(body.id);
    const ok = await put(`/api/microbiomas/${d.id}`, { nombre: d.nombre, activo: true, celdas: d.celdas, version: d.version });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.version, d.version + 1);
    const viejo = await put(`/api/microbiomas/${d.id}`, { nombre: d.nombre, activo: true, celdas: d.celdas, version: d.version });
    assert.equal(viejo.status, 409);
    assert.equal(viejo.body.causa, "conflicto_version");
    const inexistente = await put("/api/microbiomas/00000000-0000-0000-0000-000000000000", {
      nombre: d.nombre, activo: true, celdas: d.celdas, version: 1,
    });
    assert.equal(inexistente.status, 404);
  });

  it("CA-ADM-008: búsqueda parcial sin mayúsculas, filtro por estado y orden", async () => {
    const r1 = await crear(nombre("Lista"));
    const r2 = await crear(nombre("Lista"));
    const d2 = await buscar(r2.body.id);
    await put(`/api/microbiomas/${d2.id}`, { nombre: d2.nombre, activo: false, celdas: d2.celdas, version: d2.version });

    const q = encodeURIComponent(RUN.toLowerCase());
    const todos = (await get(`/api/microbiomas?q=${q}`)).body.map((m) => m.id);
    assert.ok(todos.includes(r1.body.id) && todos.includes(r2.body.id));
    const activos = (await get(`/api/microbiomas?q=${q}&estado=activo`)).body.map((m) => m.id);
    assert.ok(activos.includes(r1.body.id) && !activos.includes(r2.body.id));
    const inactivos = (await get(`/api/microbiomas?q=${q}&estado=inactivo`)).body.map((m) => m.id);
    assert.ok(inactivos.includes(r2.body.id) && !inactivos.includes(r1.body.id));

    const asc = (await get(`/api/microbiomas?q=${q}&orden=asc`)).body.map((m) => m.id);
    const desc = (await get(`/api/microbiomas?q=${q}&orden=desc`)).body.map((m) => m.id);
    assert.deepEqual(desc, [...asc].reverse());
  });
});
