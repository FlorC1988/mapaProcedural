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
};
