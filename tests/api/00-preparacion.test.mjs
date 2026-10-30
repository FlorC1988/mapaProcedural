import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { get, limpiarRestos } from "../ayudantes/api.mjs";

describe("Preparación", () => {
  it("el backend responde y tiene base de datos", async () => {
    const r = await get("/health");
    assert.equal(r.status, 200, "¿está corriendo `npm run dev` y Supabase?");
    assert.deepEqual(r.body, { estado: "ok" });
  });

  it("limpia restos activos de corridas anteriores (ZZ Prueba)", async () => {
    await limpiarRestos();
  });
});
