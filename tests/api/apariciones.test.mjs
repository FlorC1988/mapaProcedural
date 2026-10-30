import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { alFinal, crearBiomaPrueba, get, limpiar, nombre, post, put } from "../ayudantes/api.mjs";

after(limpiar);

const BASE_DEX = 95000 + (Date.now() % 4000);
let n = 0;
const VENENO = 17, PLANTA = 12;

async function especie(extra) {
  const datos = {
    dex: Number((BASE_DEX + 0.01 * ++n).toFixed(2)), nombre: nombre("Esp aparición"), tipo_i: VENENO, tipo_ii: null,
    hp: null, iniciativa: null, puntos_evolucion: null, ataque_inicial_id: null, preevolucion: null, evolucion: null,
    etapa: null, sprite_url: null, grito_url: null, generacion: null, prob_aparicion: 0.5, prob_shiny: null,
    categorias: [], tipos_ataque: [], ...extra,
  };
  const r = await post("/api/especies", datos);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  alFinal(async () => {
    const e = (await get(`/api/especies/${r.body.id}`)).body;
    if (e?.activo) await put(`/api/especies/${e.id}`, { ...e, activo: false });
  });
  return r.body.id;
}

let B, soloI, comoII, sinProb, inactiva;
before(async () => {
  B = await crearBiomaPrueba();
  soloI = await especie({});
  comoII = await especie({ tipo_i: PLANTA, tipo_ii: VENENO });
  sinProb = await especie({ prob_aparicion: null });
  inactiva = await especie({});
  const e = (await get(`/api/especies/${inactiva}`)).body;
  await put(`/api/especies/${e.id}`, { ...e, activo: false });
});

const elegibles = async () => (await get(`/api/apariciones/elegibles?bioma=${B}`)).body;

describe("Aparición por bioma (RF-ENC-001) y elegibles (DEC-106)", () => {
  it("un bioma sin tipos habilitados no tiene elegibles", async () => {
    assert.deepEqual(await elegibles(), { tiposHabilitados: 0, especies: [] });
  });

  it("solo Type I: entra la especie Veneno, no la Planta/Veneno", async () => {
    assert.equal((await put(`/api/apariciones/${B}`, { tipos: [{ tipo_id: VENENO, incluyeTipoII: false }] })).status, 200);
    const filas = (await get("/api/apariciones")).body.filter((a) => a.bioma_id === B);
    assert.deepEqual(filas, [{ bioma_id: B, tipo_id: VENENO, incluyeTipoII: false }]);

    const r = await elegibles();
    assert.equal(r.tiposHabilitados, 1);
    const ids = r.especies.map((e) => e.id);
    assert.ok(ids.includes(soloI));
    assert.ok(!ids.includes(comoII), "Type II no cuenta sin incluyeTipoII");
    assert.ok(!ids.includes(sinProb), "sin probabilidad no participa");
    assert.ok(!ids.includes(inactiva), "inactiva no participa");
    const e = r.especies.find((x) => x.id === soloI);
    assert.equal(typeof e.dex, "number");
    assert.equal(e.prob_aparicion, 0.5);
  });

  it("con incluyeTipoII también entra la especie Planta/Veneno", async () => {
    await put(`/api/apariciones/${B}`, { tipos: [{ tipo_id: VENENO, incluyeTipoII: true }] });
    const ids = (await elegibles()).especies.map((e) => e.id);
    assert.ok(ids.includes(soloI) && ids.includes(comoII));
  });

  it("habilitar Planta (solo Type I) incluye la Planta/Veneno aunque Veneno no cuente el II", async () => {
    await put(`/api/apariciones/${B}`, { tipos: [{ tipo_id: VENENO, incluyeTipoII: false }, { tipo_id: PLANTA, incluyeTipoII: false }] });
    const r = await elegibles();
    assert.equal(r.tiposHabilitados, 2);
    assert.ok(r.especies.map((e) => e.id).includes(comoII));
  });

  it("vaciar la aparición deja el bioma sin elegibles", async () => {
    await put(`/api/apariciones/${B}`, { tipos: [] });
    assert.deepEqual(await elegibles(), { tiposHabilitados: 0, especies: [] });
  });

  it("errores: parámetros inválidos y bioma inexistente", async () => {
    assert.equal((await get("/api/apariciones/elegibles?bioma=xyz")).status, 400);
    assert.equal((await get("/api/apariciones/elegibles")).status, 400);
    assert.equal((await get("/api/apariciones/elegibles?bioma=00000000-0000-0000-0000-000000000000")).status, 404);
    assert.equal((await put(`/api/apariciones/${B}`, { tipos: [{ tipo_id: 19, incluyeTipoII: false }] })).status, 400);
    assert.equal((await put("/api/apariciones/00000000-0000-0000-0000-000000000000", { tipos: [] })).status, 404);
  });
});
