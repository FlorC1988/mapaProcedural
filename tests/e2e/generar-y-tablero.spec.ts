import { expect, test } from "@playwright/test";
import { celda, generarMapa } from "./comun";

test("CA-GEN-015: el formulario inicia con los valores predeterminados", async ({ page }) => {
  await page.goto("/");
  // El estado vive en el contexto global; al cargar la página es el inicial.
  await expect(page.getByLabel("Filas")).toHaveValue("16");
  await expect(page.getByLabel("Columnas")).toHaveValue("16");
  await expect(page.getByLabel("Gimnasios por cuadrante")).toHaveValue("2");
  await expect(page.getByLabel("Radio de influencia")).toHaveValue("1");
});

test("CA-GEN-016 / CA-VIS-007: una dimensión impar muestra el error y bloquea Generar", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Filas").fill("9");
  await page.getByLabel("Filas").blur();
  await expect(page.locator("#filas-error")).toHaveText("Debe ser un número par.");
  await expect(page.getByText("Corregí los siguientes campos:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generar" })).toBeDisabled();
  await page.getByLabel("Filas").fill("16");
  await expect(page.getByRole("button", { name: "Generar" })).toBeEnabled();
});

test("generar muestra el tablero completo, la semilla y recursos coherentes", async ({ page }) => {
  await generarMapa(page, "e2e-tablero");
  await expect(page.getByRole("button", { name: /^Celda \d+, \d+:/ })).toHaveCount(256);
  await expect(page.locator("code", { hasText: "e2e-tablero" })).toBeVisible();

  // CA-REC-001/006: el total general de la matriz es la cantidad de celdas.
  const total = page.getByRole("table", { name: "Piezas por bioma y altura" }).locator("tbody tr").last().locator("td").nth(4);
  await expect(total).toHaveText("256");
  // CA-REC-005: 4 × N marcadores de gimnasio.
  await expect(page.getByRole("table", { name: "Marcadores de gimnasio por tipo" })).toContainText("Total (8)");
  // CA-VIS-001: 8 gimnasios visibles en el tablero.
  await expect(page.getByRole("button", { name: /gimnasio/ })).toHaveCount(8);
});

test("CA-VIS-004/005/006: detalle de celda, capa de influencia y zoom", async ({ page }) => {
  await generarMapa(page, "e2e-detalle");
  const detalle = page.getByRole("complementary", { name: "Detalle de celda" });
  await expect(detalle).toContainText("Seleccioná una celda");
  await celda(page, 3, 4).click();
  await expect(detalle).toContainText("(3, 4)");
  await expect(detalle).toContainText("Bioma");
  await expect(detalle).toContainText(/Z[123]/);
  await expect(detalle.getByRole("button", { name: "Buscar pokémon" })).toBeVisible();

  const influencia = page.getByRole("checkbox", { name: "Influencia", exact: true });
  await expect(influencia).not.toBeChecked();
  const capa = page.locator('svg[aria-label="Tablero"] polygon[fill="#7f1d1d"]');
  await expect(capa).toHaveCount(0);
  await influencia.check();
  expect(await capa.count()).toBeGreaterThan(0);

  const grupo = page.locator('svg[aria-label="Tablero"] > g');
  const antes = await grupo.getAttribute("transform");
  await page.getByRole("button", { name: "Acercar" }).click();
  await expect(grupo).not.toHaveAttribute("transform", antes!);
  await page.getByRole("button", { name: "Ajustar" }).click();
  await expect(grupo).toHaveAttribute("transform", "translate(0 0) scale(1)");
});
