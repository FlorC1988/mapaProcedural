import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearPRNG, hashSemilla, mezclar, generarSemillaAleatoria } from "../../server/src/generador/prng.ts";
import { validarConfig } from "../../server/src/dominio/config.ts";
import { validarDefinicion } from "../../server/src/dominio/microbioma.ts";

describe("PRNG sembrado (DEC-042)", () => {
  it("misma semilla produce la misma secuencia; distinta semilla, otra", () => {
    const a = crearPRNG("abc"), b = crearPRNG("abc"), c = crearPRNG("abd");
    const sa = Array.from({ length: 50 }, a), sb = Array.from({ length: 50 }, b), sc = Array.from({ length: 50 }, c);
    assert.deepEqual(sa, sb);
    assert.notDeepEqual(sa, sc);
    assert.ok(sa.every((x) => x >= 0 && x < 1));
  });

  it("hash estable y mezcla determinista que conserva los elementos", () => {
    assert.equal(hashSemilla("x"), hashSemilla("x"));
    const base = [...Array(20).keys()];
    const m1 = mezclar(base, crearPRNG("s")), m2 = mezclar(base, crearPRNG("s"));
    assert.deepEqual(m1, m2);
    assert.deepEqual([...m1].sort((x, y) => x - y), base);
    assert.deepEqual(base, [...Array(20).keys()], "no muta la entrada");
  });

  it("CA-GEN-019: genera semillas no vacías", () => {
    assert.ok(generarSemillaAleatoria().length > 0);
  });
});

describe("Validación de configuración (DEC-036..039)", () => {
  const ok = { filas: 16, columnas: 16, microbiomas: 2, n: 2, radio: 1 };

  it("acepta los valores predeterminados y los extremos", () => {
    assert.ok("config" in validarConfig(ok));
    assert.ok("config" in validarConfig({ filas: 8, columnas: 30, microbiomas: 0, n: 1, radio: 0 }));
    assert.ok("config" in validarConfig({ filas: 30, columnas: 8, microbiomas: 10, n: 4, radio: 2, semilla: "s" }));
  });

  for (const [campo, valor] of [
    ["filas", 7], ["filas", 9], ["filas", 32], ["columnas", 15], ["microbiomas", 11], ["microbiomas", -1],
    ["n", 0], ["n", 5], ["radio", 3], ["radio", 1.5], ["filas", "16"],
  ] as const) {
    it(`CA-GEN-008/016: rechaza ${campo}=${JSON.stringify(valor)}`, () => {
      const r = validarConfig({ ...ok, [campo]: valor });
      assert.ok("errores" in r && campo in r.errores);
    });
  }

  it("rechaza semilla no textual y lista de microbiomas vacía con cantidad > 0", () => {
    const r1 = validarConfig({ ...ok, semilla: 5 });
    assert.ok("errores" in r1 && "semilla" in r1.errores);
    const r2 = validarConfig({ ...ok, microbiomasElegidos: [] });
    assert.ok("errores" in r2 && "microbiomasElegidos" in r2.errores);
    assert.ok("config" in validarConfig({ ...ok, microbiomas: 0, microbiomasElegidos: [] }));
  });
});

describe("Validación de definiciones de microbioma (CA-ADM-004/005)", () => {
  const B = "bioma-1";
  const activos = new Set([B]);
  const celda = (dq: number, dr: number, altura: 1 | 2 | 3 = 1, bioma = B) => ({ dq, dr, bioma, altura });

  it("acepta una forma conectada con ancla", () => {
    assert.equal(validarDefinicion([celda(0, 0), celda(1, 0), celda(0, 1, 3)], activos), null);
  });

  it("acepta alturas e internas sin restricción de diferencia", () => {
    assert.equal(validarDefinicion([celda(0, 0, 1), celda(1, 0, 3)], activos), null);
  });

  const casos: [string, unknown, string][] = [
    ["no es lista", "x", "celdas_invalidas"],
    ["vacía", [], "celdas_fuera_de_rango"],
    ["sin ancla", [celda(1, 0)], "ancla_ausente"],
    ["duplicada", [celda(0, 0), celda(0, 0)], "coordenadas_duplicadas"],
    ["desconectada", [celda(0, 0), celda(3, 0)], "forma_desconectada"],
    ["altura inválida", [{ dq: 0, dr: 0, bioma: B, altura: 4 }], "celdas_invalidas"],
    ["bioma inactivo", [celda(0, 0, 1, "otro")], "bioma_inactivo"],
    ["extensión > 30 columnas", Array.from({ length: 31 }, (_, i) => celda(i, -Math.floor(i / 2))), "extension_excedida"],
  ];
  for (const [desc, celdas, codigo] of casos) {
    it(`rechaza: ${desc}`, () => assert.equal(validarDefinicion(celdas, activos), codigo));
  }

  it("rechaza más de 900 celdas", () => {
    const muchas = Array.from({ length: 901 }, (_, i) => celda(i % 31, Math.floor(i / 31)));
    assert.equal(validarDefinicion(muchas, activos), "celdas_fuera_de_rango");
  });

  it("acepta una fila de 30 columnas (límite)", () => {
    const fila = Array.from({ length: 30 }, (_, i) => celda(i, -Math.floor(i / 2)));
    assert.equal(validarDefinicion(fila, activos), null);
  });
});
