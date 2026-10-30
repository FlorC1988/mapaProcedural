import { expect, test } from "@playwright/test";
import { celda, escapar, generarMapa, herramienta, selectorBioma } from "./comun";
import { del, get, nombre } from "../ayudantes/api.mjs";

test.afterAll(async () => {
  // Por si una prueba falló a mitad: elimina los mapas de esta corrida.
  const { body } = await get(`/api/mapas?buscar=${encodeURIComponent("ZZ Prueba")}`);
  for (const m of body) if (m.nombre.startsWith("ZZ Prueba")) await del(`/api/mapas/${m.id}`);
});

const totalRecursos = (page) =>
  page.getByRole("table", { name: "Piezas por bioma y altura" }).locator("tbody tr");

test("CA-EDI-002/012/013: editar un bioma recalcula recursos y se puede deshacer y rehacer", async ({ page }) => {
  await generarMapa(page, "e2e-edicion");
  const objetivo = celda(page, 1, 1);
  const etiquetaInicial = await objetivo.getAttribute("aria-label");

  await page.getByRole("button", { name: "Editar" }).click();
  await herramienta(page, "Cambiar bioma");
  const select = selectorBioma(page);
  const opciones = await select.locator("option").allTextContents();
  const nuevo = opciones.find((o) => !etiquetaInicial!.includes(`: ${o},`))!;
  await select.selectOption({ label: nuevo });
  const filasAntes = await totalRecursos(page).allTextContents();
  const conNuevo = new RegExp(`: ${escapar(nuevo)}, Z`);

  await objetivo.click();
  await expect(objetivo).toHaveAttribute("aria-label", conNuevo);
  await expect.poll(() => totalRecursos(page).allTextContents()).not.toEqual(filasAntes);

  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(objetivo).toHaveAttribute("aria-label", etiquetaInicial!);
  await expect.poll(() => totalRecursos(page).allTextContents()).toEqual(filasAntes);

  await page.getByRole("button", { name: "Rehacer" }).click();
  await expect(objetivo).toHaveAttribute("aria-label", conNuevo);
  await expect(page.getByRole("button", { name: "Rehacer" })).toBeDisabled();
});

test("guardar, buscar, abrir y eliminar un mapa", async ({ page }) => {
  const n = nombre("Mapa E2E");
  await generarMapa(page, "e2e-guardar");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByLabel("Nombre del mapa").fill(n);
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.locator(".barra-mapa strong", { hasText: n })).toBeVisible();
  await expect(page.locator(".barra-mapa")).toContainText("(v1)");

  // Guardar de nuevo sobre la identidad sube la versión.
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".barra-mapa")).toContainText("(v2)");

  await page.getByRole("link", { name: "Mapas" }).click();
  await page.getByLabel("Buscar").fill(n);
  const enlace = page.getByRole("button", { name: n });
  await expect(enlace).toBeVisible();
  await enlace.click();
  await expect(page.getByRole("img", { name: "Tablero" })).toBeVisible();
  await expect(page.locator("code", { hasText: "e2e-guardar" })).toBeVisible();

  await page.getByRole("button", { name: "Eliminar" }).click();
  const confirmar = page.getByRole("alertdialog", { name: "Confirmar eliminación" });
  await confirmar.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByRole("heading", { name: "Mapas guardados" })).toBeVisible();
  await page.getByLabel("Buscar").fill(n);
  await expect(page.getByText("No hay mapas guardados.")).toBeVisible();
});

test("CA-MAP-002: guardar con un nombre existente muestra el aviso y no sobrescribe", async ({ page }) => {
  const n = nombre("Mapa dup");
  await generarMapa(page, "e2e-dup");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByLabel("Nombre del mapa").fill(n);
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.locator(".barra-mapa")).toContainText("(v1)");

  await page.getByRole("button", { name: "Guardar como" }).click();
  await page.getByLabel("Guardar como").fill(n.toUpperCase());
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("alert")).toContainText(`Ya existe un mapa llamado`);
});
