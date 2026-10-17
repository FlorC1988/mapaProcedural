// Sincronización con PokéAPI (Fase 10, DEC-103, RF-PKM-006).
// Uso: node scripts/sincronizar-pokeapi.mjs [nombre-de-especie]
// Si se pasa un nombre, solo procesa esa especie (útil para validación).
// Requiere DATABASE_URL (por defecto postgres://postgres:postgres@127.0.0.1:54322/postgres).
//
// Completa únicamente campos nulos (sprite_url, grito_url, generacion,
// preevolucion, evolucion, etapa): los datos administrados son autoridad.
// Cada especie actualizada queda registrada en auditoria_admin como
// tipo_cambio = 'sincronizacion'.

import process from "node:process";
import pg from "pg";

const API = "https://pokeapi.co/api/v2";
const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres";
const filtro = process.argv[2]?.trim().toLowerCase() ?? null;

const ESPERA_MS = 150;
const REINTENTOS = 3;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(ruta) {
  let ultimo;
  for (let i = 0; i < REINTENTOS; i++) {
    try {
      const res = await fetch(`${API}${ruta}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${ruta}`);
      return await res.json();
    } catch (e) {
      ultimo = e;
      await esperar(500 * (i + 1));
    }
  }
  throw ultimo;
}

// ---------------------------------------------------------------------------
// Mapeo nombre local -> slug de PokéAPI
// ---------------------------------------------------------------------------

const REGIONES = {
  "alola": "alola", "alolan": "alola",
  "galar": "galar", "galarian": "galar",
  "hisui": "hisui", "hisuian": "hisui",
  "paldea": "paldea", "paldean": "paldea",
};

const slugBase = (s) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/♀/g, "-f").replace(/♂/g, "-m")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Alias explícitos nombre local -> slug de PokéAPI para casos sin regla general.
const ALIAS = {
  "nidoran (female)": "nidoran-f",
  "nidoran (male)": "nidoran-m",
  "farfetch'd": "farfetchd",
  "farfetch'd (galarian)": "farfetchd-galar",
  "sirfetch'd": "sirfetchd",
  "tauros (paldean, combat)": "tauros-paldea-combat-breed",
  "tauros (paldean, blaze)": "tauros-paldea-blaze-breed",
  "tauros (paldean, aqua)": "tauros-paldea-aqua-breed",
  "manetric (mega)": "manectric-mega",
  "basculin (hisuian)": "basculin-white-striped",
  "darmanitan": "darmanitan-standard",
  "darmanitan (zen mode)": "darmanitan-zen",
  "darmanitan (galarian)": "darmanitan-galar-standard",
  "darmanitan (galarian, zen mode)": "darmanitan-galar-zen",
  "ash-greninja": "greninja-ash",
  "keldeo": "keldeo-ordinary",
  "mimikyu": "mimikyu-disguised",
  "oricorio (pa'u)": "oricorio-pau",
  "eiscue (ice face)": "eiscue-ice",
  "eiscue (no ice face)": "eiscue-noice",
  "maushold (family of 4)": "maushold-family-of-four",
  "maushold (family of 3)": "maushold-family-of-three",
  "pumpkaboo (super size)": "pumpkaboo-super",
  "gourgeist (super size)": "gourgeist-super",
};

// Devuelve lista de candidatos de slug, en orden de preferencia.
function candidatosSlug(nombre, dex) {
  const alias = ALIAS[String(nombre).trim().toLowerCase()];
  if (alias) return [alias];
  let n = String(nombre).trim();
  // El importador desambiguó duplicados con " (dex)": quitarlo si coincide.
  n = n.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, "");

  const m = n.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (!m) {
    const base = slugBase(n);
    return Number.isInteger(Number(dex)) ? [base] : [base, `${base}-${slugBase(String(dex).split(".")[1] ?? "")}`];
  }
  const base = slugBase(m[1]);
  const forma = m[2].trim();
  const fl = forma.toLowerCase();

  // Forma regional: "Rattata (Alola)", "Meowth (Galar)"...
  for (const [clave, suf] of Object.entries(REGIONES)) {
    if (fl.includes(clave)) return [`${base}-${suf}`];
  }
  // Mega: "Charizard (Mega X)", "Venusaur (Mega)"...
  const mega = fl.match(/mega(?:\s*([xy]))?/);
  if (mega) return [`${base}-mega${mega[1] ? `-${mega[1]}` : ""}`, `${base}-mega`];
  // Gigantamax
  if (fl.includes("gigantamax") || fl.includes("gmax")) return [`${base}-gmax`];
  // Otras formas: usar el texto entre paréntesis como sufijo.
  return [`${base}-${slugBase(forma)}`, base];
}

// ---------------------------------------------------------------------------
// Extracción de datos desde las respuestas de PokéAPI
// ---------------------------------------------------------------------------

function extraerSprite(pokemon) {
  const s = pokemon?.sprites ?? {};
  return s.front_default
      ?? s.other?.["official-artwork"]?.front_default
      ?? s.other?.home?.front_default
      ?? null;
}

function extraerGrito(pokemon) {
  const c = pokemon?.cries ?? {};
  return c.latest ?? c.legacy ?? null;
}

const ROMANOS = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };

function extraerGeneracion(species) {
  const g = species?.generation?.name; // "generation-iii"
  const n = g ? ROMANOS[g.replace("generation-", "")] ?? Number(g.replace("generation-", "")) : NaN;
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : null;
}

// Recorre la cadena evolutiva; devuelve Map nombre-especie -> { etapa, pre, evos[] }
function analizarCadena(chain) {
  const info = new Map();
  const recorrer = (nodo, etapa, pre) => {
    const nombre = nodo.species.name;
    info.set(nombre, {
      etapa: `Etapa ${["I", "II", "III", "IV", "V"][etapa - 1] ?? etapa}`,
      pre,
      evos: (nodo.evolves_to ?? []).map((e) => e.species.name),
    });
    for (const e of nodo.evolves_to ?? []) recorrer(e, etapa + 1, nombre);
  };
  recorrer(chain.chain, 1, null);
  return info;
}

// Nombre "mostrable": primer nombre en inglés o el slug capitalizado.
const nombreDe = (speciesData, slug) =>
  speciesData?.names?.find((n) => n.language.name === "es")?.name
  ?? speciesData?.names?.find((n) => n.language.name === "en")?.name
  ?? slug;

// ---------------------------------------------------------------------------
// Proceso principal
// ---------------------------------------------------------------------------

const client = new pg.Client({ connectionString: url });
await client.connect();

const resultado = { actualizadas: 0, sinCambios: 0, noEncontradas: [], errores: [] };

try {
  const { rows: especies } = await client.query(
    `select id, dex, nombre::text as nombre, preevolucion, evolucion, etapa,
            sprite_url, grito_url, generacion
     from public.especies
     where ($1::text is null or nombre::text ilike $1)
     order by dex`,
    [filtro ? `%${filtro}%` : null],
  );
  console.log(`especies a procesar: ${especies.length}`);

  // Categorías derivadas de flags de PokéAPI (pokemon-species).
  const catFlags = { is_baby: "Baby", is_legendary: "Legendary", is_mythical: "Mythical" };
  const catIds = new Map();
  for (const r of (await client.query(
    `select id, nombre::text as nombre from public.categorias_especie
     where lower(nombre::text) = any ($1)`,
    [Object.values(catFlags).map((n) => n.toLowerCase())],
  )).rows) {
    catIds.set(r.nombre.toLowerCase(), r.id);
  }
  for (const nombre of Object.values(catFlags)) {
    if (!catIds.has(nombre.toLowerCase())) {
      const r = await client.query(
        "insert into public.categorias_especie (nombre) values ($1) returning id",
        [nombre],
      );
      catIds.set(nombre.toLowerCase(), r.rows[0].id);
    }
  }

  const cacheEspecies = new Map(); // slug de species -> datos species
  const cacheCadenas = new Map();  // url evolution_chain -> Map nombre -> info

  for (const esp of especies) {
    const campos = {};
    const catsAgregar = []; // ids de categorias_especie a vincular
    try {
      const slugs = candidatosSlug(esp.nombre, esp.dex);
      let pokemon = null;
      let slugUsado = null;
      for (const slug of slugs) {
        pokemon = await fetchJson(`/pokemon/${slug}`);
        await esperar(ESPERA_MS);
        if (pokemon) { slugUsado = slug; break; }
      }
      // Fallback: especies sin entrada /pokemon/{base} (p. ej. frillish,
      // pyroar, minior): consultar pokemon-species y elegir la variedad.
      if (!pokemon) {
        const base = slugBase(String(esp.nombre).replace(/\s*\(.*$/, "").replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, ""));
        const forma = String(esp.nombre).match(/\((.*?)\)/)?.[1]?.toLowerCase() ?? "";
        const sp = await fetchJson(`/pokemon-species/${base}`);
        await esperar(ESPERA_MS);
        if (sp?.varieties?.length) {
          const variedades = sp.varieties.map((v) => v.pokemon.name);
          const elegida =
            variedades.find((v) => forma && forma.split(/[ ,/]+/).some((w) => w.length > 2 && v.includes(w)))
            ?? variedades.find((v) => sp.varieties.find((x) => x.pokemon.name === v)?.is_default)
            ?? variedades[0];
          pokemon = await fetchJson(`/pokemon/${elegida}`);
          await esperar(ESPERA_MS);
          if (pokemon) slugUsado = elegida;
        }
      }
      if (!pokemon) {
        resultado.noEncontradas.push(`${esp.nombre} (${slugs.join(" | ")})`);
        continue;
      }

      // Datos a nivel especie (generation, cadena evolutiva).
      const spUrl = pokemon.species.url.replace(/^.*\/api\/v2/, "");
      if (!cacheEspecies.has(spUrl)) {
        cacheEspecies.set(spUrl, await fetchJson(spUrl));
        await esperar(ESPERA_MS);
      }
      const species = cacheEspecies.get(spUrl);

      // Solo se corrige un sprite_url existente si apunta al official-artwork
      // que este mismo script cargó en corridas anteriores.
      if (esp.sprite_url == null || esp.sprite_url.includes("official-artwork")) {
        campos.sprite_url = extraerSprite(pokemon);
      }
      if (esp.grito_url == null) campos.grito_url = extraerGrito(pokemon);
      if (esp.generacion == null) campos.generacion = extraerGeneracion(species);

      // Categorías desde flags de pokemon-species (solo se agregan, no se quitan).
      for (const [flag, nombreCat] of Object.entries(catFlags)) {
        if (species?.[flag]) catsAgregar.push(catIds.get(nombreCat.toLowerCase()));
      }

      // Cadena evolutiva (a nivel especie; no aplica a formas alternas en general,
      // pero las formas comparten cadena en PokéAPI para regionales/megas).
      const necesitaEvol = esp.preevolucion == null || esp.evolucion == null || esp.etapa == null;
      if (necesitaEvol && species?.evolution_chain?.url) {
        const urlCadena = species.evolution_chain.url.replace(/^.*\/api\/v2/, "");
        if (!cacheCadenas.has(urlCadena)) {
          const cadena = await fetchJson(urlCadena);
          cacheCadenas.set(urlCadena, cadena ? analizarCadena(cadena) : null);
          await esperar(ESPERA_MS);
        }
        const info = cacheCadenas.get(urlCadena)?.get(pokemon.species.name);
        if (info) {
          const especiesPorNombre = new Map();
          if (esp.preevolucion == null && info.pre) {
            const sp = await fetchJson(`/pokemon-species/${info.pre}`);
            await esperar(ESPERA_MS);
            especiesPorNombre.set(info.pre, sp);
            campos.preevolucion = nombreDe(sp, info.pre);
          }
          if (esp.evolucion == null && info.evos.length > 0) {
            const nombres = [];
            for (const evo of info.evos) {
              const sp = await fetchJson(`/pokemon-species/${evo}`);
              await esperar(ESPERA_MS);
              especiesPorNombre.set(evo, sp);
              nombres.push(nombreDe(sp, evo));
            }
            campos.evolucion = nombres.join(", ");
          }
          if (esp.etapa == null) campos.etapa = info.etapa;
        }
      }
    } catch (e) {
      resultado.errores.push(`${esp.nombre}: ${e.message}`);
      continue;
    }

    const pares = Object.entries(campos).filter(([, v]) => v != null);
    if (pares.length === 0 && catsAgregar.length === 0) {
      resultado.sinCambios++;
      continue;
    }
    await client.query("begin");
    try {
      if (pares.length > 0) {
        const set = pares.map(([k], i) => `${k} = $${i + 2}`).join(", ");
        await client.query(
          `update public.especies set ${set}, version = version + 1, modificado_en = now()
           where id = $1`,
          [esp.id, ...pares.map(([, v]) => v)],
        );
      }
      for (const catId of new Set(catsAgregar)) {
        await client.query(
          `insert into public.especie_categorias (especie_id, categoria_id)
           values ($1, $2) on conflict do nothing`,
          [esp.id, catId],
        );
      }
      await client.query(
        `insert into public.auditoria_admin (tipo_entidad, entidad_id, tipo_cambio)
         values ('especie', $1, 'sincronizacion')`,
        [esp.id],
      );
      await client.query("commit");
      resultado.actualizadas++;
      console.log(`${esp.nombre}: ${[...pares.map(([k]) => k), ...catsAgregar.length ? ["categorias"] : []].join(", ")}`);
    } catch (e) {
      await client.query("rollback");
      resultado.errores.push(`${esp.nombre} (update): ${e.message}`);
    }
  }

  console.log("\n--- Resumen ---");
  console.log(`actualizadas: ${resultado.actualizadas}`);
  console.log(`sin cambios:  ${resultado.sinCambios}`);
  console.log(`no encontradas en PokéAPI: ${resultado.noEncontradas.length}`);
  for (const n of resultado.noEncontradas) console.log(`  - ${n}`);
  console.log(`errores: ${resultado.errores.length}`);
  for (const n of resultado.errores) console.log(`  - ${n}`);
} finally {
  await client.end();
}
