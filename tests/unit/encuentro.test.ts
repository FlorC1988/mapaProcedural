import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sortearEspecie, spriteShiny, tirarShiny } from "../../web/src/pokedex/encuentro.ts";
import { contrasteTexto, formatearDex, formatearPorcentaje } from "../../web/src/pokedex/tipos.ts";
import type { EspecieElegible } from "../../web/src/api.ts";

const esp = (nombre: string, prob_aparicion: number): EspecieElegible => ({
  id: nombre, dex: 1, nombre, tipo_i: 1, tipo_ii: null, sprite_url: null, grito_url: null, prob_aparicion, prob_shiny: null,
});

describe("Encuentro (DEC-106)", () => {
  it("lista vacía o pesos nulos no producen especie", () => {
    assert.equal(sortearEspecie([]), null);
    assert.equal(sortearEspecie([esp("A", 0)]), null);
  });

  it("una sola candidata siempre sale, sin importar su probabilidad", () => {
    for (let i = 0; i < 100; i++) assert.equal(sortearEspecie([esp("A", 0.01)])!.nombre, "A");
  });

  it("el peso es relativo: 0,1/0,3 reparte 25/75", () => {
    const es = [esp("A", 0.1), esp("B", 0.3)];
    const c = { A: 0, B: 0 } as Record<string, number>;
    for (let i = 0; i < 40000; i++) c[sortearEspecie(es)!.nombre]++;
    assert.ok(Math.abs(c.A / 40000 - 0.25) < 0.02, `A=${c.A}`);
  });

  it("es determinista con un aleatorio inyectado y cubre los bordes", () => {
    const es = [esp("A", 1), esp("B", 1)];
    assert.equal(sortearEspecie(es, () => 0)!.nombre, "A");
    assert.equal(sortearEspecie(es, () => 0.49)!.nombre, "A");
    assert.equal(sortearEspecie(es, () => 0.5)!.nombre, "B");
    assert.equal(sortearEspecie(es, () => 0.999999)!.nombre, "B");
  });

  it("shiny: nulo nunca, absoluto en otro caso", () => {
    assert.equal(tirarShiny(null, () => 0), false);
    assert.equal(tirarShiny(0, () => 0), false);
    assert.equal(tirarShiny(0.5, () => 0.4), true);
    assert.equal(tirarShiny(0.5, () => 0.5), false);
    assert.equal(tirarShiny(1, () => 0.999), true);
  });

  it("URL de sprite shiny de PokéAPI", () => {
    assert.equal(
      spriteShiny("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"),
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png"
    );
    assert.equal(spriteShiny("https://ejemplo.com/a.gif"), null);
    assert.equal(spriteShiny(null), null);
  });
});

describe("Formatos de Pokédex", () => {
  it("formatearDex: enteros con 4 dígitos", () => {
    assert.equal(formatearDex(1), "#0001");
    assert.equal(formatearDex(551), "#0551");
    assert.equal(formatearDex(1025), "#1025");
  });

  it("formatearDex: formas decimales según el comentario del código (3.1 → #0003.1)", () => {
    assert.equal(formatearDex(3.1), "#0003.1");
    assert.equal(formatearDex(6.25), "#0006.25");
  });

  it("formatearPorcentaje", () => {
    assert.equal(formatearPorcentaje(null), "—");
    assert.equal(formatearPorcentaje(0.05), "5.0 %");
    assert.equal(formatearPorcentaje(1), "100.0 %");
  });

  it("contrasteTexto elige texto oscuro sobre fondos claros y claro sobre oscuros", () => {
    assert.equal(contrasteTexto("#ffffff"), "#18181b");
    assert.equal(contrasteTexto("#000000"), "#ffffff");
  });
});
