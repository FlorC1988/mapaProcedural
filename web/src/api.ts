export interface Bioma {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  activo: boolean;
  version: number;
  incompatibles_con: string[];
}

export interface TipoGimnasio {
  id: number;
  nombre: string;
  biomas_compatibles: string[];
}

export interface DefinicionMicrobioma {
  id: string;
  nombre: string;
  activo: boolean;
  version: number;
  celdas: { dq: number; dr: number; bioma: string; altura: 1 | 2 | 3 }[];
  creadoEn: string;
  modificadoEn: string;
}

export interface ConfigGeneracion {
  filas: number;
  columnas: number;
  microbiomas: number;
  microbiomasElegidos?: string[];
  n: number;
  radio: number;
  semilla?: string;
}

export interface CeldaMapa {
  fila: number;
  columna: number;
  bioma: string;
  altura: 1 | 2 | 3;
  gimnasio: string | null;
  microbioma: string | null;
}

export interface MapaGenerado {
  configuracion: { filas: number; columnas: number; microbiomas: number; microbiomasElegidos?: string[]; n: number; radio: number; semilla: string };
  celdas: CeldaMapa[];
  gimnasios: {
    id: string;
    tipoId: number;
    fila: number;
    columna: number;
    cuadrante: number;
    area: { fila: number; columna: number }[];
  }[];
  instanciasMicrobioma: {
    id: string;
    definicionId: string;
    nombre: string;
    ancla: { fila: number; columna: number };
    celdas: { fila: number; columna: number }[];
    definicion: { dq: number; dr: number; bioma: string; altura: 1 | 2 | 3 }[];
  }[];
}

export interface ContextoVisual {
  biomas: { id: string; nombre: string; color: string; icono: string; activo?: boolean }[];
  tiposGimnasio: { id: number; nombre: string }[];
}

export interface RespuestaGeneracion {
  resultado: "exito" | "sin_solucion" | "presupuesto_agotado";
  semilla: string;
  mapa: MapaGenerado | null;
  contexto: ContextoVisual;
  contextoSnapshot?: unknown;
  versionSnapshot?: number;
  versionAlgoritmo?: number;
}

export interface SnapshotMapa {
  versionSnapshot: number;
  versionAlgoritmo: number;
  configuracion: MapaGenerado["configuracion"];
  celdas: CeldaMapa[];
  gimnasios: MapaGenerado["gimnasios"];
  instanciasMicrobioma: MapaGenerado["instanciasMicrobioma"];
  contexto: {
    biomas: { id: string; nombre: string; color: string; icono: string; activo: boolean }[];
    tiposGimnasio: { id: number; nombre: string; biomasCompatibles: string[] }[];
  };
}

export interface ResumenMapa {
  id: string;
  nombre: string;
  creadoEn: string;
  modificadoEn: string;
  version: number;
}

export interface MapaGuardado extends ResumenMapa {
  snapshot: SnapshotMapa;
}

// --- Expansión Pokémon (docs/13) --------------------------------------------

export interface EstadoAlterado {
  id: string;
  nombre: string;
  activo: boolean;
  version: number;
}

export interface CategoriaEspecie {
  id: string;
  nombre: string;
  activo: boolean;
  version: number;
  usos: number;
}

export interface Ataque {
  id: string;
  nombre: string;
  tipo_id: number;
  descripcion: string;
  danio: number | null;
  estado_objetivo_id: string | null;
  estado_auto_id: string | null;
  activo: boolean;
  version: number;
  creadoEn: string;
  modificadoEn: string;
}

export interface Especie {
  id: string;
  dex: number;
  nombre: string;
  tipo_i: number;
  tipo_ii: number | null;
  hp: number | null;
  iniciativa: number | null;
  puntos_evolucion: number | null;
  ataque_inicial_id: string | null;
  preevolucion: string | null;
  evolucion: string | null;
  etapa: string | null;
  sprite_url: string | null;
  grito_url: string | null;
  generacion: number | null;
  prob_aparicion: number | null;
  prob_shiny: number | null;
  activo: boolean;
  version: number;
  categorias: string[];
  tipos_ataque: number[];
  creadoEn: string;
  modificadoEn: string;
}

export interface AparicionBioma {
  bioma_id: string;
  tipo_id: number;
  incluyeTipoII: boolean;
}

export class ErrorApi extends Error {
  constructor(
    public causa: string,
    public accion: string | undefined,
    public estado: number,
    public codigo?: string
  ) {
    super(causa);
  }
}

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const res = await fetch(ruta, opciones);
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new ErrorApi(
      cuerpo.causa ?? `La solicitud falló con estado ${res.status}.`,
      cuerpo.accion,
      res.status,
      cuerpo.error
    );
  }
  return res.json() as Promise<T>;
}

export const api = {
  biomas: () => pedir<Bioma[]>("/api/biomas"),
  tiposGimnasio: () => pedir<TipoGimnasio[]>("/api/tipos-gimnasio"),
  microbiomas: (q = "", estado = "", orden = "asc") =>
    pedir<DefinicionMicrobioma[]>(
      `/api/microbiomas?q=${encodeURIComponent(q)}&estado=${estado}&orden=${orden}`
    ),
  crearBioma: (datos: { nombre: string; color: string; icono: string; incompatibles_con: string[] }) =>
    pedir<{ id: string }>("/api/biomas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  actualizarBioma: (
    id: string,
    datos: { nombre: string; color: string; icono: string; activo: boolean; incompatibles_con: string[] }
  ) =>
    pedir<{ ok: true }>(`/api/biomas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  actualizarTipoGimnasio: (id: number, biomas_compatibles: string[]) =>
    pedir<{ ok: true }>(`/api/tipos-gimnasio/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biomas_compatibles }),
    }),
  crearMicrobioma: (datos: { nombre: string; celdas: DefinicionMicrobioma["celdas"] }) =>
    pedir<{ id: string }>("/api/microbiomas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  actualizarMicrobioma: (
    id: string,
    datos: { nombre: string; activo: boolean; celdas: DefinicionMicrobioma["celdas"]; version: number }
  ) =>
    pedir<{ version: number }>(`/api/microbiomas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  generar: (config: ConfigGeneracion) =>
    pedir<RespuestaGeneracion>("/api/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }),
  salud: () => pedir<{ estado: string }>("/health"),
  listarMapas: (buscar = "", orden = "modificacion", dir = "desc") =>
    pedir<ResumenMapa[]>(
      `/api/mapas?buscar=${encodeURIComponent(buscar)}&orden=${orden}&dir=${dir}`
    ),
  obtenerMapa: (id: string) => pedir<MapaGuardado>(`/api/mapas/${id}`),
  crearMapa: (nombre: string, snapshot: SnapshotMapa) =>
    pedir<ResumenMapa>("/api/mapas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, snapshot }),
    }),
  actualizarMapa: (id: string, version: number, snapshot: SnapshotMapa) =>
    pedir<ResumenMapa>(`/api/mapas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot, version }),
    }),
  eliminarMapa: async (id: string) => {
    const res = await fetch(`/api/mapas/${id}`, { method: "DELETE" });
    if (!res.ok) throw new ErrorApi("No se pudo eliminar el mapa.", "Actualizá el listado.", res.status);
  },
  regenerarMapa: (id: string) =>
    pedir<RespuestaGeneracion>(`/api/mapas/${id}/regenerar`, { method: "POST" }),

  // --- Expansión Pokémon ---
  estadosAlterados: () => pedir<EstadoAlterado[]>("/api/estados-alterados"),
  crearEstadoAlterado: (nombre: string) =>
    pedir<{ id: string }>("/api/estados-alterados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    }),
  actualizarEstadoAlterado: (id: string, datos: { nombre: string; activo: boolean; version: number }) =>
    pedir<{ version: number }>(`/api/estados-alterados/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  categoriasEspecie: () => pedir<CategoriaEspecie[]>("/api/categorias-especie"),
  crearCategoriaEspecie: (nombre: string) =>
    pedir<{ id: string }>("/api/categorias-especie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    }),
  actualizarCategoriaEspecie: (id: string, datos: { nombre: string; activo: boolean; version: number }) =>
    pedir<{ version: number }>(`/api/categorias-especie/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  ataques: (q = "", estado = "", tipo = "", orden = "asc") =>
    pedir<Ataque[]>(
      `/api/ataques?q=${encodeURIComponent(q)}&estado=${estado}&tipo=${tipo}&orden=${orden}`
    ),
  crearAtaque: (datos: Omit<Ataque, "id" | "activo" | "version" | "creadoEn" | "modificadoEn">) =>
    pedir<{ id: string }>("/api/ataques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  actualizarAtaque: (id: string, datos: Omit<Ataque, "id" | "creadoEn" | "modificadoEn"> & { version: number }) =>
    pedir<{ version: number }>(`/api/ataques/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  especies: (params: { q?: string; estado?: string; tipo?: string; categoria?: string; generacion?: string; orden?: string } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    return pedir<Especie[]>(`/api/especies?${qs.toString()}`);
  },
  crearEspecie: (datos: Omit<Especie, "id" | "activo" | "version" | "creadoEn" | "modificadoEn">) =>
    pedir<{ id: string }>("/api/especies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  actualizarEspecie: (id: string, datos: Omit<Especie, "id" | "creadoEn" | "modificadoEn"> & { version: number }) =>
    pedir<{ version: number }>(`/api/especies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
  apariciones: () => pedir<AparicionBioma[]>("/api/apariciones"),
  actualizarApariciones: (biomaId: string, tipos: { tipo_id: number; incluyeTipoII: boolean }[]) =>
    pedir<{ ok: true }>(`/api/apariciones/${biomaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipos }),
    }),
};
