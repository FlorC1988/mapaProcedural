import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { alFinal, get, limpiar, nombre, post, put } from "../ayudantes/api.mjs";

after(limpiar);

const NULO = "00000000-0000-0000-0000-000000000000";

async function crearSimple(ruta, n = nombre("Item")) {
  const r = await post(ruta, { nombre: n });
  if (r.status === 201) {
    alFinal(async () => {
      const x = (await get(ruta)).body.find((i) => i.id === r.body.id);
      if (x?.activo) await put(`${ruta}/${x.id}`, { nombre: x.nombre, activo: false, version: x.version });
    });
  }
  return r;
}

const buscarAtaque = async (n) => (await get(`/api/ataques?q=${encodeURIComponent(n)}`)).body.find((a) => a.nombre === n);

async function crearAtaque(extra = {}) {
  const datos = { nombre: nombre("Ataque"), tipo_id: 12, descripcion: "prueba", danio: 3, estados_objetivo: [], estados_auto: [], ...extra };
  const r = await post("/api/ataques", datos);
  if (r.status === 201) {
    alFinal(async () => {
      const a = await buscarAtaque(datos.nombre);
      if (a?.activo) await put(`/api/ataques/${a.id}`, { ...a, activo: false });
    });
  }
  return { r, datos };
}

for (const [ruta, etiqueta, causaUso] of [
  ["/api/estados-alterados", "Estados alterados (RF-ATQ-003)", "estado_en_uso"],
  ["/api/categorias-especie", "Categorías de especie (DEC-104)", "categoria_en_uso"],
]) {
  describe(etiqueta, () => {
    it("alta, nombre único sin mayúsculas, edición y concurrencia", async () => {
      const n = nombre("Cat");
      const r = await crearSimple(ruta, n);
      assert.equal(r.status, 201);
      assert.equal((await crearSimple(ruta, n.toUpperCase())).status, 409);
      const x = (await get(ruta)).body.find((i) => i.id === r.body.id);
      assert.equal(x.activo, true);
      const ok = await put(`${ruta}/${x.id}`, { nombre: `${n} editado`, activo: true, version: x.version });
      assert.equal(ok.status, 200);
      const viejo = await put(`${ruta}/${x.id}`, { nombre: n, activo: true, version: x.version });
      assert.equal(viejo.status, 409);
      assert.equal((await put(`${ruta}/${NULO}`, { nombre: n, activo: true, version: 1 })).status, 404);
      assert.equal((await crearSimple(ruta, "")).status, 400);
    });

    if (causaUso === "categoria_en_uso") {
      it("lista la cantidad de usos", async () => {
        const r = await crearSimple(ruta);
        const x = (await get(ruta)).body.find((i) => i.id === r.body.id);
        assert.equal(x.usos, 0);
      });
    }
  });
}

describe("Ataques con múltiples estados (DEC-105)", () => {
  it("guarda varios estados por ámbito y los devuelve agrupados", async () => {
    const e1 = (await crearSimple("/api/estados-alterados")).body.id;
    const e2 = (await crearSimple("/api/estados-alterados")).body.id;
    const { r, datos } = await crearAtaque({ estados_objetivo: [e1, e2], estados_auto: [e1] });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const a = await buscarAtaque(datos.nombre);
    assert.deepEqual([...a.estados_objetivo].sort(), [e1, e2].sort());
    assert.deepEqual(a.estados_auto, [e1]);

    const editado = await put(`/api/ataques/${a.id}`, { ...a, estados_objetivo: [e2], estados_auto: [] });
    assert.equal(editado.status, 200);
    const a2 = await buscarAtaque(datos.nombre);
    assert.deepEqual(a2.estados_objetivo, [e2]);
    assert.deepEqual(a2.estados_auto, []);
    assert.equal((await put(`/api/ataques/${a.id}`, { ...a, activo: true })).status, 409, "versión desactualizada");
  });

  it("filtra por estado sobre objetivo/usuario y por 'ninguno'", async () => {
    const e1 = (await crearSimple("/api/estados-alterados")).body.id;
    const con = await crearAtaque({ estados_objetivo: [e1] });
    const sin = await crearAtaque();
    const ids = async (qs) => (await get(`/api/ataques?${qs}`)).body.map((a) => a.nombre);

    const porEstado = await ids(`estado_objetivo=${e1}`);
    assert.ok(porEstado.includes(con.datos.nombre) && !porEstado.includes(sin.datos.nombre));
    assert.equal((await ids(`estado_auto=${e1}`)).includes(con.datos.nombre), false, "el ámbito importa");
    const ninguno = await ids(`estado_objetivo=ninguno&q=${encodeURIComponent(sin.datos.nombre)}`);
    assert.deepEqual(ninguno, [sin.datos.nombre]);
    const ningunoCon = await ids(`estado_objetivo=ninguno&q=${encodeURIComponent(con.datos.nombre)}`);
    assert.deepEqual(ningunoCon, []);
  });

  it("no se desactiva un estado usado por un ataque activo; sí después de desactivar el ataque", async () => {
    const r = await crearSimple("/api/estados-alterados");
    const e = (await get("/api/estados-alterados")).body.find((x) => x.id === r.body.id);
    const { datos } = await crearAtaque({ estados_auto: [e.id] });
    const bloqueado = await put(`/api/estados-alterados/${e.id}`, { nombre: e.nombre, activo: false, version: e.version });
    assert.equal(bloqueado.status, 409);
    assert.equal(bloqueado.body.causa, "estado_en_uso");

    const a = await buscarAtaque(datos.nombre);
    assert.equal((await put(`/api/ataques/${a.id}`, { ...a, activo: false })).status, 200);
    const libre = await put(`/api/estados-alterados/${e.id}`, { nombre: e.nombre, activo: false, version: e.version });
    assert.equal(libre.status, 200);
  });

  it("validaciones: duplicado, tipo y daño fuera de rango, estados inválidos", async () => {
    const { datos } = await crearAtaque();
    assert.equal((await crearAtaque({ nombre: datos.nombre.toUpperCase() })).r.status, 409);
    assert.equal((await crearAtaque({ tipo_id: 19 })).r.status, 400);
    assert.equal((await crearAtaque({ danio: 100 })).r.status, 400);
    assert.equal((await crearAtaque({ estados_objetivo: ["no-es-uuid"] })).r.status, 400);
  });

  it("un estado inexistente se rechaza y el ataque NO queda creado (atomicidad)", async () => {
    const { r, datos } = await crearAtaque({ estados_objetivo: [NULO] });
    assert.equal(r.status, 400);
    assert.equal(r.body.causa, "referencia_invalida");
    const huerfano = await buscarAtaque(datos.nombre);
    if (huerfano) {
      // Si quedó creado, se desactiva para no dejarlo activo.
      await put(`/api/ataques/${huerfano.id}`, { ...huerfano, activo: false });
    }
    assert.equal(huerfano, undefined, "el alta debe ser atómica (RF-PKM-004)");
  });
});
