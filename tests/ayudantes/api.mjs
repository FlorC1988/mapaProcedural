// Cliente HTTP y utilidades compartidas por las pruebas de API y E2E.
//
// IMPORTANTE: la suite corre contra la base de desarrollo real (decisión de la
// responsable). Los catálogos no admiten eliminación física, así que todo lo
// creado lleva el prefijo PREFIJO y se desactiva al terminar; los mapas de
// prueba sí se eliminan. Las configuraciones globales que se tocan se restauran.

export const API = process.env.API_URL ?? "http://localhost:3000";
export const PREFIJO = "ZZ Prueba";
export const RUN = `${PREFIJO} ${Date.now().toString(36)}`;

/** Nombre único para esta corrida. */
let contador = 0;
export const nombre = (etiqueta) => `${RUN} ${etiqueta} ${++contador}`;

export async function pedir(metodo, ruta, cuerpo) {
  const res = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  let body = null;
  try {
    body = texto ? JSON.parse(texto) : null;
  } catch {
    body = texto;
  }
  return { status: res.status, body };
}

export const get = (r) => pedir("GET", r);
export const post = (r, c) => pedir("POST", r, c);
export const put = (r, c) => pedir("PUT", r, c);
export const del = (r) => pedir("DELETE", r);

/** Pila de tareas de limpieza; se ejecutan en orden inverso en `after()`. */
const pendientes = [];
export const alFinal = (fn) => pendientes.push(fn);
export async function limpiar() {
  while (pendientes.length) {
    const fn = pendientes.pop();
    try {
      await fn();
    } catch (e) {
      console.error("[limpieza]", e);
    }
  }
}

export const esPrueba = (n) => typeof n === "string" && n.startsWith(PREFIJO);

/** Datos base de la instalación. */
export async function biomasActivos() {
  const { body } = await get("/api/biomas");
  return body.filter((b) => b.activo);
}

/**
 * Crea un bioma de prueba y registra su desactivación. Antes de desactivarlo
 * lo quita de las compatibilidades de tipos (si alguna prueba lo agregó).
 */
export async function crearBiomaPrueba(extra = {}) {
  const r = await post("/api/biomas", {
    nombre: nombre("Bioma"),
    color: "#123456",
    icono: "🧪",
    incompatibles_con: [],
    ...extra,
  });
  if (r.status !== 201) throw new Error(`No se pudo crear el bioma de prueba: ${JSON.stringify(r.body)}`);
  const id = r.body.id;
  alFinal(() => desactivarBioma(id));
  return id;
}

export async function desactivarBioma(id) {
  const { body: biomas } = await get("/api/biomas");
  const b = biomas.find((x) => x.id === id);
  if (!b || !b.activo) return;
  await put(`/api/apariciones/${id}`, { tipos: [] });
  await put(`/api/biomas/${id}`, { ...b, activo: false, incompatibles_con: [] });
}

/**
 * Limpieza idempotente de restos de corridas interrumpidas: desactiva todo lo
 * activo con el prefijo, quita biomas de prueba de compatibilidades y aparición,
 * y elimina mapas de prueba.
 */
export async function limpiarRestos() {
  const [{ body: biomas }, { body: tipos }] = await Promise.all([get("/api/biomas"), get("/api/tipos-gimnasio")]);
  const biomasPrueba = new Set(biomas.filter((b) => esPrueba(b.nombre)).map((b) => b.id));

  for (const id of biomasPrueba) await put(`/api/apariciones/${id}`, { tipos: [] });

  const { body: especies } = await get("/api/especies?estado=activo");
  for (const e of especies.filter((x) => esPrueba(x.nombre))) {
    await put(`/api/especies/${e.id}`, { ...e, activo: false });
  }
  const { body: ataques } = await get("/api/ataques?estado=activo");
  for (const a of ataques.filter((x) => esPrueba(x.nombre))) {
    await put(`/api/ataques/${a.id}`, { ...a, activo: false });
  }
  for (const ruta of ["/api/estados-alterados", "/api/categorias-especie"]) {
    const { body } = await get(ruta);
    for (const x of body.filter((i) => i.activo && esPrueba(i.nombre))) {
      await put(`${ruta}/${x.id}`, { nombre: x.nombre, activo: false, version: x.version });
    }
  }
  const { body: micros } = await get("/api/microbiomas?estado=activo");
  for (const m of micros.filter((x) => esPrueba(x.nombre))) {
    await put(`/api/microbiomas/${m.id}`, { nombre: m.nombre, activo: false, celdas: m.celdas, version: m.version });
  }
  for (const t of tipos) {
    const sin = t.biomas_compatibles.filter((b) => !biomasPrueba.has(b));
    if (sin.length !== t.biomas_compatibles.length && sin.length > 0) {
      await put(`/api/tipos-gimnasio/${t.id}`, { biomas_compatibles: sin });
    }
  }
  for (const id of biomasPrueba) await desactivarBioma(id);

  const { body: mapas } = await get(`/api/mapas?buscar=${encodeURIComponent(PREFIJO)}`);
  for (const m of mapas.filter((x) => esPrueba(x.nombre))) await del(`/api/mapas/${m.id}`);
}

/** Configuración de generación pequeña y rápida. */
export const CONFIG_CHICA = { filas: 8, columnas: 8, microbiomas: 0, microbiomasElegidos: [], n: 1, radio: 1 };
