// Importación inicial del catálogo Pokémon (Fase 7, DEC-100/DEC-101).
// Uso: node scripts/importar-pokedex.mjs [ruta al xlsx]
// Por defecto lee "../../National Pokedex Gen 9.xlsx" respecto de server/.
// Requiere DATABASE_URL (por defecto postgres://postgres:postgres@127.0.0.1:54322/postgres).
//
// Reglas aplicadas:
// - Hoja Pokedex-JuegoMesa: A=dex, B=nombre, C=categorías separadas por coma,
//   D=Type I, E=Type II, F=HP, G=iniciativa, H=puntos evolución,
//   I..L=TIPO COMP 1-4, M=ataque inicial.
// - Hoja Atques-JuegoMesa: A=nombre, B=tipo, C=descripción, D=daño,
//   E=estado objetivo, F=estado auto (G=marca REVISAR, no se importa).
// - Especie activa solo si tiene todos los datos de juego (F..M completos).
// - Tipos se resuelven por nombre contra public.tipos_gimnasio.
// - Idempotente: borra e inserta dentro de una transacción.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const archivo = process.argv[2] ?? path.resolve(__dirname, "../../National Pokedex Gen 9.xlsx");
const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres";

const norm = (v) => (v == null ? "" : String(v).trim());
const num = (v) => {
  const n = Number(norm(v));
  return norm(v) !== "" && Number.isFinite(n) ? n : null;
};

const wb = xlsx.readFile(archivo);
const hojaEspecie = wb.Sheets["Pokedex-JuegoMesa"];
const hojaAtaques = wb.Sheets["Atques-JuegoMesa"];
if (!hojaEspecie || !hojaAtaques) {
  throw new Error("No se encontraron las hojas Pokedex-JuegoMesa / Atques-JuegoMesa.");
}
const filasEsp = xlsx.utils.sheet_to_json(hojaEspecie, { header: 1, defval: "" }).slice(1);
const filasAtq = xlsx.utils.sheet_to_json(hojaAtaques, { header: 1, defval: "" }).slice(1);

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query("begin");

  const tipos = new Map();
  for (const r of (await client.query("select id, nombre from public.tipos_gimnasio")).rows) {
    tipos.set(String(r.nombre).toLowerCase(), r.id);
  }
  const aliasTipos = {
    normal: "normal", fighting: "lucha", flying: "volador", poison: "veneno",
    ground: "tierra", rock: "roca", bug: "bicho", ghost: "fantasma",
    steel: "acero", fire: "fuego", water: "agua", grass: "planta",
    electric: "eléctrico", psychic: "psíquico", ice: "hielo",
    dragon: "dragón", dark: "siniestro", fairy: "hada",
  };
  const tipoId = (nombre, ctx) => {
    let clave = norm(nombre).toLowerCase();
    clave = aliasTipos[clave] ?? clave;
    const id = tipos.get(clave);
    if (norm(nombre) !== "" && id == null) throw new Error(`Tipo desconocido "${nombre}" en ${ctx}`);
    return norm(nombre) === "" ? null : id;
  };

  // --- Estados alterados: catálogo desde los valores distintos de E/F ---
  const estados = new Map();
  for (const f of filasAtq) {
    for (const col of [4, 5]) {
      const v = norm(f[col]);
      if (v && !estados.has(v.toLowerCase())) estados.set(v.toLowerCase(), v);
    }
  }
  const estadoIds = new Map();
  for (const nombre of [...estados.values()].sort((a, b) => a.localeCompare(b, "es"))) {
    const r = await client.query(
      "insert into public.estados_alterados (nombre) values ($1) returning id",
      [nombre],
    );
    estadoIds.set(nombre.toLowerCase(), r.rows[0].id);
  }
  console.log(`estados_alterados: ${estadoIds.size}`);

  // --- Ataques ---
  const ataqueIds = new Map();
  let atq = 0;
  for (const f of filasAtq) {
    const nombre = norm(f[0]);
    if (!nombre) continue;
    const r = await client.query(
      `insert into public.ataques (nombre, tipo_id, descripcion, danio, estado_objetivo_id, estado_auto_id)
       values ($1,$2,$3,$4,$5,$6) returning id`,
      [
        nombre,
        tipoId(f[1], `ataque "${nombre}"`),
        norm(f[2]),
        num(f[3]),
        estadoIds.get(norm(f[4]).toLowerCase()) ?? null,
        estadoIds.get(norm(f[5]).toLowerCase()) ?? null,
      ],
    );
    ataqueIds.set(nombre.toLowerCase(), r.rows[0].id);
    atq++;
  }
  console.log(`ataques: ${atq}`);

  // --- Categorías ---
  const categorias = new Set();
  for (const f of filasEsp) {
    for (const c of norm(f[2]).split(",")) {
      const v = norm(c);
      if (v) categorias.add(v);
    }
  }
  const categoriaIds = new Map();
  for (const nombre of [...categorias].sort((a, b) => a.localeCompare(b, "es"))) {
    const r = await client.query(
      "insert into public.categorias_especie (nombre) values ($1) returning id",
      [nombre],
    );
    categoriaIds.set(nombre.toLowerCase(), r.rows[0].id);
  }
  console.log(`categorias_especie: ${categoriaIds.size}`);

  // --- Especies ---
  let esp = 0;
  let activas = 0;
  const sinAtaque = new Set();
  const nombresUsados = new Set();
  for (const f of filasEsp) {
    const dex = num(f[0]);
    let nombre = norm(f[1]);
    if (dex == null || !nombre) continue;
    if (nombresUsados.has(nombre.toLowerCase())) nombre = `${nombre} (${dex})`;
    nombresUsados.add(nombre.toLowerCase());

    const datosJuego = [5, 6, 7, 8, 9, 10, 11, 12].every((i) => norm(f[i]) !== "");
    const atqIni = norm(f[12]);
    const atqId = atqIni ? ataqueIds.get(atqIni.toLowerCase()) ?? null : null;
    if (atqIni && !atqId) sinAtaque.add(atqIni);

    const r = await client.query(
      `insert into public.especies
         (dex, nombre, tipo_i, tipo_ii, hp, iniciativa, puntos_evolucion, ataque_inicial_id, activo)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
      [
        dex,
        nombre,
        tipoId(f[3], `especie "${nombre}"`),
        tipoId(f[4], `especie "${nombre}"`),
        num(f[5]),
        num(f[6]),
        num(f[7]),
        atqId,
        datosJuego,
      ],
    );
    const especieId = r.rows[0].id;
    if (datosJuego) activas++;

    for (const c of norm(f[2]).split(",")) {
      const v = norm(c).toLowerCase();
      if (v) {
        await client.query(
          "insert into public.especie_categorias (especie_id, categoria_id) values ($1,$2) on conflict do nothing",
          [especieId, categoriaIds.get(v)],
        );
      }
    }
    for (const i of [8, 9, 10, 11]) {
      const t = tipoId(f[i], `TIPO COMP de "${nombre}"`);
      if (t != null) {
        await client.query(
          "insert into public.especie_tipos_ataque (especie_id, tipo_id) values ($1,$2) on conflict do nothing",
          [especieId, t],
        );
      }
    }
    esp++;
  }
  console.log(`especies: ${esp} (activas: ${activas})`);
  if (sinAtaque.size) {
    console.warn(`ataque inicial no encontrado en Atques (${sinAtaque.size}): ${[...sinAtaque].join(", ")}`);
  }

  await client.query("commit");
  console.log("Importación completada.");
} catch (e) {
  await client.query("rollback");
  throw e;
} finally {
  await client.end();
}
