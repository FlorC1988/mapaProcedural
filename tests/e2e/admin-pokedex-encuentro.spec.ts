import { expect, test } from "@playwright/test";
import { celda, escapar, generarMapa, herramienta, selectorBioma } from "./comun";
import { alFinal, crearBiomaPrueba, get, limpiar, nombre, post, put } from "../ayudantes/api.mjs";

test.afterAll(limpiar);

async function crearEstado() {
  const n = nombre("Estado E2E");
  const r = await post("/api/estados-alterados", { nombre: n });
  alFinal(async () => {
    const e = (await get("/api/estados-alterados")).body.find((x) => x.id === r.body.id);
    if (e?.activo) await put(`/api/estados-alterados/${e.id}`, { nombre: e.nombre, activo: false, version: e.version });
  });
  return n;
}

async function crearEspecie(extra: Record<string, unknown> = {}) {
  const datos = {
    dex: Number((97000 + (Date.now() % 2000) + Math.random()).toFixed(2)), nombre: nombre("Especie E2E"),
    tipo_i: 17, tipo_ii: null, hp: null, iniciativa: null, puntos_evolucion: null, ataques_iniciales: [],
    preevolucion: null, evolucion: null, etapa: null, sprite_url: null, grito_url: null, generacion: null,
    prob_aparicion: 1, prob_shiny: null, categorias: [], tipos_ataque: [], ...extra,
  };
  const r = await post("/api/especies", datos);
  expect(r.status).toBe(201);
  alFinal(async () => {
    const e = (await get(`/api/especies/${r.body.id}`)).body;
    if (e?.activo) await put(`/api/especies/${e.id}`, { ...e, activo: false });
  });
  return datos.nombre as string;
}

test("DEC-105: crear un ataque con dos estados sobre el objetivo desde Administración", async ({ page }) => {
  const e1 = await crearEstado();
  const e2 = await crearEstado();
  const n = nombre("Ataque E2E");
  alFinal(async () => {
    const a = (await get(`/api/ataques?q=${encodeURIComponent(n)}`)).body[0];
    if (a?.activo) await put(`/api/ataques/${a.id}`, { ...a, activo: false });
  });

  await page.goto("/administracion");
  await page.getByRole("tab", { name: "Ataques" }).click();
  await page.getByRole("button", { name: "Nuevo ataque" }).click();
  const dialogo = page.getByRole("dialog", { name: "Nuevo ataque" });
  await dialogo.getByLabel("Nombre").fill(n);
  const objetivo = dialogo.getByRole("group", { name: "Estados sobre el objetivo" });
  await objetivo.getByLabel(e1).check();
  await objetivo.getByLabel(e2).check();
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(dialogo).toBeHidden();

  await page.getByRole("searchbox", { name: "Buscar ataque" }).fill(n);
  const fila = page.getByRole("row", { name: new RegExp(escapar(n)) });
  await expect(fila).toContainText(e1);
  await expect(fila).toContainText(e2);
});

test("Pokédex: buscar una especie y activarla/desactivarla desde la ficha (regresión dex_invalido)", async ({ page }) => {
  const n = await crearEspecie();
  await page.goto("/pokedex");
  await page.getByRole("searchbox", { name: "Buscar especie" }).fill(n);
  const opcion = page.getByRole("option", { name: new RegExp(escapar(n)) });
  await expect(opcion).toHaveCount(1);
  await opcion.click();
  await expect(page.locator(".pokedex-ficha .pokedex-nombre")).toHaveText(n);

  await page.locator(".pokedex-ficha").getByRole("button", { name: "Desactivar" }).click();
  await expect(page.locator(".pokedex-ficha .pokedex-estado")).toHaveText("Inactiva");
  await expect(page.locator(".pokedex .aviso-error")).toHaveCount(0);
  await page.locator(".pokedex-ficha").getByRole("button", { name: "Activar" }).click();
  await expect(page.locator(".pokedex-ficha .pokedex-estado")).toHaveText("Activa");
});

test("DEC-106/DEC-107: buscar pokémon en una celda del bioma configurado muestra una especie de ese tipo con su ataque inicial", async ({ page }) => {
  const nAtq = nombre("Atq encuentro");
  const atq = await post("/api/ataques", { nombre: nAtq, tipo_id: 17, descripcion: "", danio: 3, estados_objetivo: [], estados_auto: [] });
  expect(atq.status).toBe(201);
  alFinal(async () => {
    const a = (await get(`/api/ataques?q=${encodeURIComponent(nAtq)}`)).body[0];
    if (a?.activo) await put(`/api/ataques/${a.id}`, { ...a, activo: false });
  });

  const conTipos = await crearBiomaPrueba();
  const sinTipos = await crearBiomaPrueba();
  await crearEspecie({ tipos_ataque: [17], ataques_iniciales: [{ ataque_id: atq.body.id, probabilidad: 1 }] });
  expect((await put(`/api/apariciones/${conTipos}`, { tipos: [{ tipo_id: 17, incluyeTipoII: false }] })).status).toBe(200);
  const biomas = (await get("/api/biomas")).body;
  const nombreCon = biomas.find((b) => b.id === conTipos).nombre;
  const nombreSin = biomas.find((b) => b.id === sinTipos).nombre;

  // El mapa se genera con los biomas de prueba activos, así el editor los ofrece.
  await generarMapa(page, "e2e-encuentro", { filas: 8, columnas: 8 });
  await page.getByRole("button", { name: "Editar" }).click();
  await herramienta(page, "Cambiar bioma");
  await selectorBioma(page).selectOption({ label: nombreCon });
  await celda(page, 1, 1).click();
  await selectorBioma(page).selectOption({ label: nombreSin });
  await celda(page, 1, 3).click();
  // Fuera del modo edición, el click solo selecciona la celda.
  await page.getByRole("button", { name: "Terminar edición" }).click();

  await celda(page, 1, 1).click();
  const detalle = page.getByRole("complementary", { name: "Detalle de celda" });
  await expect(detalle).toContainText(nombreCon);
  await detalle.getByRole("button", { name: "Buscar pokémon" }).click();
  const modal = page.getByRole("dialog", { name: `Encuentro en ${nombreCon}` });
  await expect(modal.locator(".encuentro-nombre")).toBeVisible();
  await expect(modal.locator(".badge-tipo").first()).toHaveText(/veneno/i);
  await expect(modal.locator(".encuentro-ataque")).toContainText(nAtq);
  await expect(modal.locator(".encuentro-ataque")).toContainText("3 daño");
  await modal.getByRole("button", { name: "Buscar otro" }).click();
  await expect(modal.locator(".encuentro-nombre")).toBeVisible();
  await modal.getByRole("button", { name: "Cerrar" }).click();
  await expect(modal).toBeHidden();

  await celda(page, 1, 3).click();
  await detalle.getByRole("button", { name: "Buscar pokémon" }).click();
  const modalSin = page.getByRole("dialog", { name: `Encuentro en ${nombreSin}` });
  await expect(modalSin).toContainText("no tiene tipos habilitados");
});
