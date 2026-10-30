import { expect, type Page } from "@playwright/test";

/** Genera un mapa desde la UI con semilla fija y sin microbiomas. */
export async function generarMapa(page: Page, semilla = "e2e", dims = { filas: 16, columnas: 16 }) {
  await page.goto("/");
  await page.getByLabel("Filas").fill(String(dims.filas));
  await page.getByLabel("Columnas").fill(String(dims.columnas));
  await page.getByLabel("Semilla (opcional)").fill(semilla);
  await page.getByRole("button", { name: "Generar" }).click();
  const dialogo = page.getByRole("dialog", { name: "Microbiomas a colocar" });
  await expect(dialogo.getByLabel("Cantidad de microbiomas")).toBeVisible();
  await dialogo.getByLabel("Cantidad de microbiomas").fill("0");
  await dialogo.getByRole("button", { name: "Generar" }).click();
  await expect(page.getByRole("img", { name: "Tablero" })).toBeVisible();
}

export const celda = (page: Page, fila: number, columna: number) =>
  page.getByRole("button", { name: new RegExp(`^Celda ${fila}, ${columna}:`) });

export const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Selector del bioma de la herramienta de edición (no el del panel de expansión). */
export const selectorBioma = (page: Page) => page.locator("#bioma-sel");

/** Elige una herramienta del editor. */
export const herramienta = (page: Page, nombreHerramienta: string) =>
  page.getByLabel("Herramienta", { exact: true }).selectOption({ label: nombreHerramienta });

/**
 * Registra errores de consola y excepciones no capturadas. Ignora recursos
 * externos que no cargan (p. ej. sprites de PokéAPI), que no son fallos de la app.
 */
export function vigilarErrores(page: Page): string[] {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const externo = m.text().startsWith("Failed to load resource") && !/localhost|127\.0\.0\.1/.test(m.location().url);
    if (!externo) errores.push(`console: ${m.text()} (${m.location().url})`);
  });
  return errores;
}
