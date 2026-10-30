import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { alFinal, get, limpiar, nombre, post, put } from "../ayudantes/api.mjs";

after(limpiar);

// dex alto y distinto por corrida para no chocar con la Pokédex real.
const BASE_DEX = 90000 + (Date.now() % 9000);
let dexSiguiente = 0;
const nuevoDex = () => Number((BASE_DEX + 0.01 * ++dexSiguiente).toFixed(2));

const especiePorId = async (id) => (await get(`/api/especies/${id}`)).body;

async function crearEspecie(extra = {}) {
  const datos = {
    dex: nuevoDex(), nombre: nombre("Especie"), tipo_i: 17, tipo_ii: null, hp: 10, iniciativa: 2, puntos_evolucion: 1,
    ataque_inicial_id: null, preevolucion: null, evolucion: null, etapa: "Etapa I", sprite_url: null, grito_url: null,
    generacion: 9, prob_aparicion: 0.25, prob_shiny: 0.01, categorias: [], tipos_ataque: [17], ...extra,
  };
  const r = await post("/api/especies", datos);
  if (r.status === 201) {
    alFinal(async () => {
      const e = await especiePorId(r.body.id);
      if (e?.activo) await put(`/api/especies/${e.id}`, { ...e, activo: false });
    });
  }
  return { r, datos };
}

describe("Especies (RF-PKM-001..004)", () => {
  it("se crea y se consulta con dex y probabilidades como números", async () => {
    const { r, datos } = await crearEspecie();
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const e = await especiePorId(r.body.id);
    assert.equal(typeof e.dex, "number");
    assert.equal(e.dex, datos.dex);
    assert.equal(e.prob_aparicion, 0.25);
    assert.equal(e.prob_shiny, 0.01);
    assert.deepEqual(e.tipos_ataque, [17]);
    assert.equal(e.activo, true);
  });

  it("regresión dex_invalido: Activar/Desactivar reenviando el GET funciona", async () => {
    const { r } = await crearEspecie();
    const e = await especiePorId(r.body.id);
    const off = await put(`/api/especies/${e.id}`, { ...e, activo: false });
    assert.equal(off.status, 200, JSON.stringify(off.body));
    const e2 = await especiePorId(e.id);
    assert.equal(e2.activo, false);
    const on = await put(`/api/especies/${e.id}`, { ...e2, activo: true });
    assert.equal(on.status, 200);
  });

  it("el listado devuelve números también (Pokédex)", async () => {
    const { datos } = await crearEspecie();
    const [e] = (await get(`/api/especies?q=${encodeURIComponent(datos.nombre)}`)).body;
    assert.equal(typeof e.dex, "number");
    assert.equal(typeof e.prob_aparicion, "number");
  });

  it("validaciones", async () => {
    const { datos } = await crearEspecie();
    const casos = [
      [{ tipo_ii: 17 }, 400, "tipo_invalido"],
      [{ tipo_i: 19 }, 400, "tipo_invalido"],
      [{ tipos_ataque: [1, 2, 3, 4, 5] }, 400, "parametros_invalidos"],
      [{ sprite_url: "ftp://x" }, 400, "url_invalida"],
      [{ prob_aparicion: 1.5 }, 400, "parametros_invalidos"],
      [{ generacion: 100 }, 400, "parametros_invalidos"],
      [{ dex: 0 }, 400, "dex_invalido"],
      [{ dex: datos.dex }, 409, "duplicado"],
      [{ nombre: datos.nombre.toLowerCase() }, 409, "duplicado"],
    ];
    for (const [extra, status, causa] of casos) {
      const { r } = await crearEspecie(extra);
      assert.equal(r.status, status, JSON.stringify(extra));
      assert.equal(r.body.causa, causa, JSON.stringify(extra));
    }
  });

  it("RF-PKM-003: filtros por tipo, categoría, generación y estado", async () => {
    const cat = await post("/api/categorias-especie", { nombre: nombre("Cat esp") });
    alFinal(async () => {
      const c = (await get("/api/categorias-especie")).body.find((x) => x.id === cat.body.id);
      if (c?.activo) await put(`/api/categorias-especie/${c.id}`, { nombre: c.nombre, activo: false, version: c.version });
    });
    const { r, datos } = await crearEspecie({ tipo_i: 12, tipo_ii: 17, categorias: [cat.body.id], generacion: 3 });
    const q = `q=${encodeURIComponent(datos.nombre)}`;
    const nombres = async (qs) => (await get(`/api/especies?${q}&${qs}`)).body.map((e) => e.id);
    assert.deepEqual(await nombres("tipo=17"), [r.body.id], "tipo II también filtra");
    assert.deepEqual(await nombres("tipo=12"), [r.body.id]);
    assert.deepEqual(await nombres("tipo=1"), []);
    assert.deepEqual(await nombres(`categoria=${cat.body.id}`), [r.body.id]);
    assert.deepEqual(await nombres("generacion=3"), [r.body.id]);
    assert.deepEqual(await nombres("generacion=4"), []);
    assert.deepEqual(await nombres("estado=activo"), [r.body.id]);
    assert.deepEqual(await nombres("estado=inactivo"), []);

    const c = (await get("/api/categorias-especie")).body.find((x) => x.id === cat.body.id);
    assert.equal(c.usos, 1);
    const bloqueo = await put(`/api/categorias-especie/${c.id}`, { nombre: c.nombre, activo: false, version: c.version });
    assert.equal(bloqueo.status, 409);
    assert.equal(bloqueo.body.causa, "categoria_en_uso");
  });

  it("no se desactiva un ataque que es ataque inicial de una especie activa", async () => {
    const n = nombre("Ataque inicial");
    const atq = await post("/api/ataques", { nombre: n, tipo_id: 17, descripcion: "", danio: 1, estados_objetivo: [], estados_auto: [] });
    assert.equal(atq.status, 201);
    alFinal(async () => {
      const a = (await get(`/api/ataques?q=${encodeURIComponent(n)}`)).body[0];
      if (a?.activo) await put(`/api/ataques/${a.id}`, { ...a, activo: false });
    });
    await crearEspecie({ ataque_inicial_id: atq.body.id });
    const a = (await get(`/api/ataques?q=${encodeURIComponent(n)}`)).body[0];
    const r = await put(`/api/ataques/${a.id}`, { ...a, activo: false });
    assert.equal(r.status, 409);
    assert.equal(r.body.causa, "ataque_en_uso");
  });

  it("concurrencia optimista y 404", async () => {
    const { r } = await crearEspecie();
    const e = await especiePorId(r.body.id);
    assert.equal((await put(`/api/especies/${e.id}`, { ...e, hp: 20 })).status, 200);
    const viejo = await put(`/api/especies/${e.id}`, { ...e, hp: 30 });
    assert.equal(viejo.status, 409);
    assert.equal(viejo.body.causa, "conflicto_version");
    assert.equal((await get("/api/especies/00000000-0000-0000-0000-000000000000")).status, 404);
  });
});
