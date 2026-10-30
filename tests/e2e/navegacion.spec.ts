import { expect, test } from "@playwright/test";
import { vigilarErrores } from "./comun";

test("las cuatro páginas cargan sin errores de consola", async ({ page }) => {
  const errores = vigilarErrores(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Generación de mapa" })).toBeVisible();

  await page.getByRole("link", { name: "Mapas" }).click();
  await expect(page.getByRole("heading", { name: "Mapas guardados" })).toBeVisible();

  await page.getByRole("link", { name: "Pokedex" }).click();
  await expect(page.getByRole("heading", { name: "Pokédex" })).toBeVisible();
  await expect(page.getByRole("listbox", { name: "Especies" }).getByRole("option").first()).toBeVisible();

  await page.getByRole("link", { name: "Administración" }).click();
  await expect(page.getByRole("heading", { name: "Administración de catálogos" })).toBeVisible();
  for (const pestana of ["Biomas", "Tipos", "Microbiomas", "Ataques", "Estados alterados", "Categorías", "Aparición"]) {
    const tab = page.getByRole("tab", { name: pestana, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).not.toBeEmpty();
  }
  await expect(page.locator(".aviso-error")).toHaveCount(0);
  expect(errores).toEqual([]);
});

test("el modo oscuro se conmuta y persiste", async ({ page }) => {
  await page.goto("/");
  const app = page.locator(".app");
  const inicial = await app.getAttribute("data-tema");
  await page.locator(".boton-tema").click();
  await expect(app).not.toHaveAttribute("data-tema", inicial!);
  await page.reload();
  await expect(app).not.toHaveAttribute("data-tema", inicial!);
  await page.locator(".boton-tema").click();
  await expect(app).toHaveAttribute("data-tema", inicial!);
});
