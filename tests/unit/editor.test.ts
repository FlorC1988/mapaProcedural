import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  agregarGimnasio,
  cambiarAltura,
  cambiarBioma,
  cambiarTipoGimnasio,
  desvincularMicrobioma,
  ErrorEdicion,
  estamparMicrobioma,
  expandir,
  moverGimnasio,
  moverMicrobioma,
  quitarGimnasio,
} from "../../web/src/editor/operaciones.ts";
import type { MapaGenerado } from "../../web/src/api.ts";

type Mapa = Pick<MapaGenerado, "configuracion" | "celdas" | "gimnasios" | "instanciasMicrobioma">;

// Mapa 8×8 de "P" con una instancia de microbioma de 2 celdas en (2,2)-(2,3)
// y un gimnasio en (6,6) con radio 1 asociado.
function mapaBase(): Mapa {
  const celdas = [];
  for (let f = 1; f <= 8; f++)
    for (let c = 1; c <= 8; c++)
      celdas.push({ fila: f, columna: c, bioma: "P", altura: 1 as const, gimnasio: null as string | null, microbioma: null as string | null });
  const at = (f: number, c: number) => celdas[(f - 1) * 8 + (c - 1)];
  at(2, 2).microbioma = "m1";
  at(2, 3).microbioma = "m1";
  at(2, 2).bioma = "H";
  at(2, 3).bioma = "H";
  at(2, 3).altura = 3;
  at(6, 6).gimnasio = "g1";
  return {
    configuracion: { filas: 8, columnas: 8, microbiomas: 1, n: 1, radio: 1, semilla: "s" },
    celdas,
    gimnasios: [{ id: "g1", tipoId: 7, fila: 6, columna: 6, cuadrante: 3, area: [{ fila: 6, columna: 6 }, { fila: 5, columna: 6 }] }],
    instanciasMicrobioma: [
      {
        id: "m1",
        definicionId: "def1",
        nombre: "Micro",
        ancla: { fila: 2, columna: 2 },
        celdas: [{ fila: 2, columna: 2 }, { fila: 2, columna: 3 }],
        // (2,2) axial (1,1); (2,3) axial (2,0) → dq=1, dr=-1
        definicion: [{ dq: 0, dr: 0, bioma: "H", altura: 1 }, { dq: 1, dr: -1, bioma: "H", altura: 3 }],
      },
    ],
  };
}
const at = (m: Mapa, f: number, c: number) => m.celdas[(f - 1) * m.configuracion.columnas + (c - 1)];
const firma = (m: Mapa) => JSON.stringify(m);

describe("Editor: inmutabilidad", () => {
  it("las operaciones no mutan el mapa de entrada", () => {
    const m = mapaBase();
    const antes = firma(m);
    cambiarBioma(m, 2, 2, "R");
    cambiarAltura(m, 1, 1, 3);
    agregarGimnasio(m, 1, 1, 3);
    moverGimnasio(m, "g1", 1, 1);
    estamparMicrobioma(m, { id: "d", nombre: "x", celdas: [{ dq: 0, dr: 0, bioma: "R", altura: 2 }] }, 4, 4);
    expandir(m, { arriba: 2, abajo: 0, izquierda: 0, derecha: 0 }, "P", 1);
    assert.equal(firma(m), antes);
  });
});

describe("CA-EDI-002: desvinculación de microbioma", () => {
  it("editar una celda desvincula toda la instancia conservando los valores", () => {
    const m = cambiarBioma(mapaBase(), 2, 2, "R");
    assert.equal(at(m, 2, 2).bioma, "R");
    assert.equal(at(m, 2, 2).microbioma, null);
    assert.equal(at(m, 2, 3).microbioma, null, "la otra celda también se desvincula");
    assert.equal(at(m, 2, 3).bioma, "H");
    assert.equal(at(m, 2, 3).altura, 3);
    assert.equal(m.instanciasMicrobioma.length, 0);
  });

  it("cambiar altura también desvincula", () => {
    const m = cambiarAltura(mapaBase(), 2, 3, 2);
    assert.equal(at(m, 2, 3).altura, 2);
    assert.equal(m.instanciasMicrobioma.length, 0);
  });

  it("editar fuera de un microbioma no lo afecta", () => {
    const m = cambiarBioma(mapaBase(), 8, 8, "R");
    assert.equal(m.instanciasMicrobioma.length, 1);
  });
});

describe("CA-EDI-007: gimnasios sin influencia", () => {
  it("agregar no cambia biomas y deja el área vacía", () => {
    const base = mapaBase();
    const m = agregarGimnasio(base, 1, 1, 3);
    const nuevo = m.gimnasios.find((g) => g.fila === 1 && g.columna === 1)!;
    assert.deepEqual(nuevo.area, []);
    assert.equal(at(m, 1, 1).gimnasio, nuevo.id);
    assert.deepEqual(m.celdas.map((c) => c.bioma), base.celdas.map((c) => c.bioma));
  });

  it("no permite dos gimnasios en la misma celda", () => {
    assert.throws(() => agregarGimnasio(mapaBase(), 6, 6, 3), ErrorEdicion);
    const m = agregarGimnasio(mapaBase(), 1, 1, 3);
    assert.throws(() => moverGimnasio(m, "g1", 1, 1), ErrorEdicion);
  });

  it("mover vacía el área y actualiza ambas celdas", () => {
    const m = moverGimnasio(mapaBase(), "g1", 7, 7);
    assert.equal(at(m, 6, 6).gimnasio, null);
    assert.equal(at(m, 7, 7).gimnasio, "g1");
    assert.deepEqual(m.gimnasios[0].area, []);
  });

  it("cambiar tipo vacía el área; quitar conserva bioma y altura", () => {
    const m = cambiarTipoGimnasio(mapaBase(), "g1", 9);
    assert.equal(m.gimnasios[0].tipoId, 9);
    assert.deepEqual(m.gimnasios[0].area, []);
    const q = quitarGimnasio(mapaBase(), "g1");
    assert.equal(q.gimnasios.length, 0);
    assert.equal(at(q, 6, 6).gimnasio, null);
    assert.equal(at(q, 6, 6).bioma, "P");
  });

  it("agregar o mover sobre un microbioma desvincula la instancia", () => {
    assert.equal(agregarGimnasio(mapaBase(), 2, 2, 3).instanciasMicrobioma.length, 0);
    assert.equal(moverGimnasio(mapaBase(), "g1", 2, 3).instanciasMicrobioma.length, 0);
  });
});

describe("CA-EDI-008/009: microbiomas", () => {
  const def = { id: "d2", nombre: "Nuevo", celdas: [{ dq: 0, dr: 0, bioma: "R", altura: 2 as const }, { dq: 0, dr: 1, bioma: "A", altura: 3 as const }] };

  it("estampar reemplaza bioma y altura, conserva gimnasios y crea instancia", () => {
    const m = estamparMicrobioma(mapaBase(), def, 5, 6); // (5,6) y (6,6) — (6,6) tiene gimnasio
    assert.equal(at(m, 5, 6).bioma, "R");
    assert.equal(at(m, 5, 6).altura, 2);
    assert.equal(at(m, 6, 6).bioma, "A");
    assert.equal(at(m, 6, 6).gimnasio, "g1", "conserva el gimnasio");
    const inst = m.instanciasMicrobioma.find((i) => i.definicionId === "d2")!;
    assert.deepEqual(inst.celdas, [{ fila: 5, columna: 6 }, { fila: 6, columna: 6 }]);
  });

  it("estampar desvincula instancias intersectadas", () => {
    const m = estamparMicrobioma(mapaBase(), def, 2, 2);
    assert.equal(m.instanciasMicrobioma.length, 1);
    assert.equal(at(m, 2, 3).microbioma, null, "la celda restante de m1 queda desvinculada");
  });

  it("estampar fuera del tablero se rechaza", () => {
    assert.throws(() => estamparMicrobioma(mapaBase(), def, 8, 1), ErrorEdicion);
  });

  it("mover desvincula el origen (conserva valores) y estampa en el destino", () => {
    const m = moverMicrobioma(mapaBase(), "m1", 5, 2);
    assert.equal(at(m, 2, 2).microbioma, null);
    assert.equal(at(m, 2, 2).bioma, "H");
    assert.equal(m.instanciasMicrobioma.length, 1);
    const inst = m.instanciasMicrobioma[0];
    assert.deepEqual(inst.ancla, { fila: 5, columna: 2 });
    assert.equal(at(m, 5, 2).bioma, "H");
  });

  it("desvincular quita la instancia y conserva valores", () => {
    const m = desvincularMicrobioma(mapaBase(), "m1");
    assert.equal(m.instanciasMicrobioma.length, 0);
    assert.equal(at(m, 2, 3).altura, 3);
  });
});

describe("CA-EDI-010/011: expansión por bordes", () => {
  it("rechaza sumas impares, izquierda impar, negativos y dimensiones fuera de 8..30", () => {
    const m = mapaBase();
    assert.throws(() => expandir(m, { arriba: 1, abajo: 0, izquierda: 0, derecha: 0 }, "P", 1), ErrorEdicion);
    assert.throws(() => expandir(m, { arriba: 0, abajo: 0, izquierda: 1, derecha: 1 }, "P", 1), /izquierda/);
    assert.throws(() => expandir(m, { arriba: -2, abajo: 2, izquierda: 0, derecha: 0 }, "P", 1), ErrorEdicion);
    assert.throws(() => expandir(m, { arriba: 12, abajo: 12, izquierda: 0, derecha: 0 }, "P", 1), ErrorEdicion);
  });

  it("agregar arriba e izquierda desplaza coordenadas, contenidos y asociaciones", () => {
    const m = expandir(mapaBase(), { arriba: 2, abajo: 0, izquierda: 2, derecha: 0 }, "N", 2);
    assert.equal(m.configuracion.filas, 10);
    assert.equal(m.configuracion.columnas, 10);
    assert.equal(m.celdas.length, 100);
    assert.equal(at(m, 4, 4).bioma, "H");
    assert.equal(at(m, 4, 4).microbioma, "m1");
    assert.equal(at(m, 8, 8).gimnasio, "g1");
    assert.deepEqual(m.gimnasios[0].area[0], { fila: 8, columna: 8 });
    assert.deepEqual(m.instanciasMicrobioma[0].ancla, { fila: 4, columna: 4 });
    assert.equal(at(m, 1, 1).bioma, "N");
    assert.equal(at(m, 1, 1).altura, 2);
    m.celdas.forEach((c, i) => assert.equal((c.fila - 1) * 10 + (c.columna - 1), i, "celdas ordenadas"));
  });

  it("expansión nula devuelve el mismo mapa", () => {
    const m = mapaBase();
    assert.equal(expandir(m, { arriba: 0, abajo: 0, izquierda: 0, derecha: 0 }, "P", 1), m);
  });
});
