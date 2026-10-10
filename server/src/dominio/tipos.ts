// Tipos del dominio usados por el generador y la API.

export interface BiomaCat {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  activo: boolean;
}

export interface TipoGimnasioCat {
  id: number;
  nombre: string;
  biomasCompatibles: string[];
}

export interface CeldaDefinicion {
  dq: number;
  dr: number;
  bioma: string; // id de bioma
  altura: 1 | 2 | 3;
}

export interface MicroDef {
  id: string;
  nombre: string;
  activo: boolean;
  celdas: CeldaDefinicion[];
}

export interface ContextoGeneracion {
  biomas: BiomaCat[];
  incompatibles: Set<string>; // pares "a|b" en ambos sentidos
  tiposGimnasio: TipoGimnasioCat[];
  microbiomas: MicroDef[];
  versionAlgoritmo: number;
}

export interface ConfigGeneracion {
  filas: number;
  columnas: number;
  microbiomas: number;
  // Definiciones elegidas por el usuario; ausente en snapshots anteriores
  // a DEC-091 (equivale a "todas las activas").
  microbiomasElegidos?: string[];
  n: number;
  radio: number;
  semilla: string;
}

export interface CeldaMapa {
  fila: number;
  columna: number;
  bioma: string; // id
  altura: 1 | 2 | 3;
  gimnasio: string | null; // id de instancia
  microbioma: string | null; // id de instancia
}

export interface InstanciaGimnasio {
  id: string;
  tipoId: number;
  fila: number;
  columna: number;
  cuadrante: number;
  area: { fila: number; columna: number }[];
}

export interface InstanciaMicrobioma {
  id: string;
  definicionId: string;
  nombre: string;
  ancla: { fila: number; columna: number };
  celdas: { fila: number; columna: number }[];
  // copia histórica de la definición (RD-MIC-002)
  definicion: CeldaDefinicion[];
}

export interface MapaGenerado {
  configuracion: ConfigGeneracion;
  celdas: CeldaMapa[];
  gimnasios: InstanciaGimnasio[];
  instanciasMicrobioma: InstanciaMicrobioma[];
}

export type ResultadoGeneracion =
  | { tipo: "exito"; mapa: MapaGenerado; nodos: number }
  | { tipo: "sin_solucion"; nodos: number }
  | { tipo: "presupuesto_agotado"; nodos: number };
