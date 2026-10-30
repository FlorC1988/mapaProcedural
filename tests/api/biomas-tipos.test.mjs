import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { alFinal, biomasActivos, crearBiomaPrueba, get, limpiar, nombre, post, put } from "../ayudantes/api.mjs";

after(limpiar);

const TIPOS = [
  "Acero", "Agua", "Bicho", "Dragón", "Eléctrico", "Fantasma", "Fuego", "Hada", "Hielo",
  "Lucha", "Normal", "Planta", "Psíquico", "Roca", "Siniestro", "Tierra", "Veneno", "Volador",
];

const bioma = async (id) => (await get("/api/biomas")).body.find((b) => b.id === id);

describe("Catálogo de biomas", () => {
  it("CA-BIO-001: existen Pradera, Agua, Roca, Magma e Hielo", async () => {
    const { body } = await get("/api/biomas");
    const nombres = body.map((b) => b.nombre);
    for (const n of ["Pradera", "Agua", "Roca", "Magma", "Hielo"]) assert.ok(nombres.includes(n), `falta ${n}`);
  });

  it("CA-BIO-002: nombre único sin distinguir mayúsculas (alta y renombre)", async () => {
    const a = await crearBiomaPrueba();
    const nombreA = (await bioma(a)).nombre;
    const dup = await post("/api/biomas", { nombre: nombreA.toUpperCase(), color: "#000000", icono: "x", incompatibles_con: [] });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.causa, "nombre_duplicado");

    const b = await crearBiomaPrueba();
    const datosB = await bioma(b);
    const ren = await put(`/api/biomas/${b}`, { ...datosB, nombre: nombreA.toLowerCase() });
    assert.equal(ren.status, 409);
  });

  it("rechaza nombre vacío, >100 caracteres o sin icono", async () => {
    for (const cuerpo of [
      { nombre: "  ", color: "#000000", icono: "x" },
      { nombre: "x".repeat(101), color: "#000000", icono: "x" },
      { nombre: nombre("sin icono"), color: "#000000", icono: "" },
    ]) {
      assert.equal((await post("/api/biomas", cuerpo)).status, 400);
    }
  });

  it("CA-BIO-003: la incompatibilidad es simétrica", async () => {
    const a = await crearBiomaPrueba();
    const b = await crearBiomaPrueba({ incompatibles_con: [a] });
    assert.deepEqual((await bioma(b)).incompatibles_con, [a]);
    assert.deepEqual((await bioma(a)).incompatibles_con, [b], "la relación debe verse desde ambos lados");
  });

  it("CA-BIO-004: rechaza incompatibilidad consigo mismo", async () => {
    const a = await crearBiomaPrueba();
    const r = await put(`/api/biomas/${a}`, { ...(await bioma(a)), incompatibles_con: [a] });
    assert.equal(r.status, 400);
    assert.equal(r.body.causa, "incompatibilidad_consigo_mismo");
  });

  it("CA-BIO-006: no se desactiva un bioma compatible con un tipo de gimnasio", async () => {
    const a = await crearBiomaPrueba();
    const tipo = (await get("/api/tipos-gimnasio")).body.find((t) => t.id === 1);
    const original = [...tipo.biomas_compatibles];
    alFinal(() => put("/api/tipos-gimnasio/1", { biomas_compatibles: original }));
    assert.equal((await put("/api/tipos-gimnasio/1", { biomas_compatibles: [...original, a] })).status, 200);

    const r = await put(`/api/biomas/${a}`, { ...(await bioma(a)), activo: false });
    assert.equal(r.status, 409);
    assert.equal(r.body.causa, "bioma_en_uso");
    assert.equal((await bioma(a)).activo, true, "no debe cambiar");
  });

  it("CA-BIO-006: no se desactiva un bioma usado por un microbioma activo", async () => {
    const a = await crearBiomaPrueba();
    const m = await post("/api/microbiomas", { nombre: nombre("Micro"), celdas: [{ dq: 0, dr: 0, bioma: a, altura: 1 }] });
    assert.equal(m.status, 201);
    alFinal(async () => {
      const def = (await get("/api/microbiomas")).body.find((x) => x.id === m.body.id);
      await put(`/api/microbiomas/${def.id}`, { nombre: def.nombre, activo: false, celdas: def.celdas, version: def.version });
    });
    const r = await put(`/api/biomas/${a}`, { ...(await bioma(a)), activo: false });
    assert.equal(r.status, 409);
    assert.equal(r.body.causa, "bioma_en_uso");
  });

  it("CA-BIO-005: un bioma sin dependencias se desactiva y sigue listado", async () => {
    const a = await crearBiomaPrueba();
    assert.equal((await put(`/api/biomas/${a}`, { ...(await bioma(a)), activo: false })).status, 200);
    const b = await bioma(a);
    assert.ok(b, "permanece en el catálogo");
    assert.equal(b.activo, false);
  });
});

describe("Catálogo de tipos de gimnasio", () => {
  it("CA-GIM-001: exactamente los 18 tipos aprobados", async () => {
    const { body } = await get("/api/tipos-gimnasio");
    assert.equal(body.length, 18);
    assert.deepEqual(body.map((t) => t.nombre).sort(), [...TIPOS].sort());
  });

  it("cada tipo conserva al menos un bioma compatible activo", async () => {
    const activos = new Set((await biomasActivos()).map((b) => b.id));
    for (const t of (await get("/api/tipos-gimnasio")).body) {
      assert.ok(t.biomas_compatibles.some((b) => activos.has(b)), `${t.nombre} sin biomas activos`);
    }
  });

  it("CA-GIM-003: rechaza dejar un tipo sin biomas", async () => {
    const r = await put("/api/tipos-gimnasio/1", { biomas_compatibles: [] });
    assert.equal(r.status, 400);
  });

  it("rechaza compatibilidades con biomas inactivos y tipos inexistentes", async () => {
    const a = await crearBiomaPrueba();
    await put(`/api/biomas/${a}`, { ...(await bioma(a)), activo: false });
    const r = await put("/api/tipos-gimnasio/1", { biomas_compatibles: [a] });
    assert.equal(r.status, 400);
    assert.equal(r.body.causa, "bioma_inactivo");

    const activo = (await biomasActivos())[0].id;
    assert.equal((await put("/api/tipos-gimnasio/99", { biomas_compatibles: [activo] })).status, 404);
  });
});
