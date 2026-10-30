import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as srv from "../../server/src/dominio/hex.ts";
import * as web from "../../web/src/dominio/hex.ts";

describe("Geometría hexagonal (DEC-013)", () => {
  it("CA-GEO-005: visible→axial→visible es identidad en 30×30 (servidor y web)", () => {
    for (let f = 1; f <= 30; f++)
      for (let c = 1; c <= 30; c++) {
        const a = srv.visibleAAxial(f, c);
        assert.deepEqual(srv.axialAVisible(a.q, a.r), { fila: f, columna: c });
        const w = web.visibleAAxial(f, c);
        assert.deepEqual(w, a, "web y servidor deben coincidir");
        assert.deepEqual(web.axialAVisible(w.q, w.r), { fila: f, columna: c });
      }
  });

  it("CA-GEO-005: axial→visible→axial es identidad", () => {
    for (let q = 0; q < 30; q++)
      for (let r = -15; r < 30; r++) {
        const v = srv.axialAVisible(q, r);
        assert.deepEqual(srv.visibleAAxial(v.fila, v.columna), { q, r });
      }
  });

  it("las direcciones son iguales en servidor y web", () => {
    assert.deepEqual([...web.DIRECCIONES], [...srv.DIRECCIONES_AXIALES]);
  });

  it("DEC-086: distancia axial estándar", () => {
    const o = srv.visibleAAxial(5, 5);
    assert.equal(srv.distanciaAxial(o, o), 0);
    for (const d of srv.DIRECCIONES_AXIALES) {
      assert.equal(srv.distanciaAxial(o, { q: o.q + d.q, r: o.r + d.r }), 1);
      assert.equal(srv.distanciaAxial(o, { q: o.q + 2 * d.q, r: o.r + 2 * d.r }), 2);
    }
  });

  it("CA-GEO-003: columnas pares desplazadas abajo (vecinos de (1,1) y (1,2))", () => {
    const vec = (f: number, c: number) =>
      srv.vecinosDe(srv.visibleAIndice(f, c, 8), 8, 8).map((i) => srv.indiceAVisible(i, 8)).map((v) => `${v.fila},${v.columna}`).sort();
    // (1,1) impar: arriba del todo; vecinos (2,1) y (1,2)
    assert.deepEqual(vec(1, 1), ["1,2", "2,1"]);
    // (1,2) par (desplazada): vecinos (1,1),(2,1),(1,3),(2,3),(2,2)
    assert.deepEqual(vec(1, 2), ["1,1", "1,3", "2,1", "2,2", "2,3"]);
  });

  it("vecinos interiores siempre son 6 y simétricos", () => {
    const F = 10, C = 10;
    for (let i = 0; i < F * C; i++) {
      const vs = srv.vecinosDe(i, F, C);
      const { fila, columna } = srv.indiceAVisible(i, C);
      if (fila > 1 && fila < F && columna > 1 && columna < C) assert.equal(vs.length, 6);
      for (const v of vs) assert.ok(srv.vecinosDe(v, F, C).includes(i), "vecindad simétrica");
    }
  });

  it("CA-GEO-002: cada cuadrante tiene (F/2)×(C/2) posiciones", () => {
    for (const [F, C] of [[8, 8], [16, 10], [30, 30]]) {
      const cuenta = [0, 0, 0, 0];
      for (let f = 1; f <= F; f++) for (let c = 1; c <= C; c++) cuenta[srv.cuadranteDe(f, c, F, C)]++;
      assert.deepEqual(cuenta, Array(4).fill((F / 2) * (C / 2)));
    }
  });

  it("CA-GEN-017: radio 0 incluye solo la propia celda; radio 1 y 2 tienen 7 y 19 celdas en el interior", () => {
    const i = srv.visibleAIndice(10, 10, 20);
    assert.deepEqual(srv.celdasEnRadio(i, 0, 20, 20), [i]);
    assert.equal(srv.celdasEnRadio(i, 1, 20, 20).length, 7);
    assert.equal(srv.celdasEnRadio(i, 2, 20, 20).length, 19);
  });
});
