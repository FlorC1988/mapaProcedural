import { createContext, useContext, useState, type ReactNode } from "react";
import type { RespuestaGeneracion } from "./api";
import type { DatosMapa } from "./componentes/VistaMapa";

// Mantiene vivo el mapa en curso (generado o abierto) al navegar entre
// Generar, Mapas y Administración. No persiste entre recargas.

interface ConfigForm {
  filas: number;
  columnas: number;
  microbiomas: number;
  gimnasiosPorCuadrante: number;
  radio: number;
  semilla: string;
}

export const CONFIG_INICIAL: ConfigForm = {
  filas: 16,
  columnas: 16,
  microbiomas: 2,
  gimnasiosPorCuadrante: 2,
  radio: 1,
  semilla: "",
};

interface EstadoMapa {
  config: ConfigForm;
  setConfig: (c: ConfigForm) => void;
  respuesta: RespuestaGeneracion | null;
  setRespuesta: (r: RespuestaGeneracion | null) => void;
  datos: DatosMapa | null;
  setDatos: (d: DatosMapa | null) => void;
}

const Contexto = createContext<EstadoMapa | null>(null);

export function ProveedorMapa({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigForm>(CONFIG_INICIAL);
  const [respuesta, setRespuesta] = useState<RespuestaGeneracion | null>(null);
  const [datos, setDatos] = useState<DatosMapa | null>(null);
  return (
    <Contexto.Provider value={{ config, setConfig, respuesta, setRespuesta, datos, setDatos }}>
      {children}
    </Contexto.Provider>
  );
}

export function useMapaActual(): EstadoMapa {
  const c = useContext(Contexto);
  if (!c) throw new Error("useMapaActual fuera de ProveedorMapa");
  return c;
}
