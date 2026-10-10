import { useState } from "react";
import { api, ErrorApi } from "../api";
import VistaMapa, { datosDesdeRespuesta } from "../componentes/VistaMapa";
import { useMapaActual } from "../estado";

// Rangos y valores predeterminados aprobados (RF-GEN-008).
const RANGOS = {
  filas: { min: 8, max: 30, def: 16 },
  columnas: { min: 8, max: 30, def: 16 },
  microbiomas: { min: 0, max: 10, def: 2 },
  gimnasiosPorCuadrante: { min: 1, max: 4, def: 2 },
  radio: { min: 0, max: 2, def: 1 },
} as const;

type Campo = keyof typeof RANGOS;

function validar(campo: Campo, valor: number): string | null {
  const r = RANGOS[campo];
  if (!Number.isInteger(valor) || valor < r.min || valor > r.max) {
    return `Debe ser un entero entre ${r.min} y ${r.max}.`;
  }
  if ((campo === "filas" || campo === "columnas") && valor % 2 !== 0) {
    return "Debe ser un número par.";
  }
  return null;
}

export default function Generar() {
  // El estado del mapa vive en el contexto global para sobrevivir a la
  // navegación entre Generar, Mapas y Administración.
  const { config, setConfig, respuesta, setRespuesta, datos, setDatos } = useMapaActual();
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [cargando, setCargando] = useState(false);
  const [errorOp, setErrorOp] = useState<{ causa: string; accion?: string } | null>(null);

  const errores = (Object.keys(RANGOS) as Campo[]).reduce<Partial<Record<Campo, string>>>(
    (acc, campo) => {
      const e = validar(campo, config[campo]);
      if (e) acc[campo] = e;
      return acc;
    },
    {}
  );
  const listaErrores = Object.entries(errores) as [Campo, string][];

  function cambiar(campo: Campo, crudo: string) {
    setConfig({ ...config, [campo]: Number(crudo) });
  }

  function campo(nombre: Campo, etiqueta: string) {
    const r = RANGOS[nombre];
    const error = tocados[nombre] ? errores[nombre] : undefined;
    return (
      <div className="campo">
        <label htmlFor={nombre}>{etiqueta}</label>
        <input
          id={nombre}
          type="number"
          min={r.min}
          max={r.max}
          step={nombre === "filas" || nombre === "columnas" ? 2 : 1}
          value={Number.isNaN(config[nombre]) ? "" : config[nombre]}
          aria-invalid={!!error}
          aria-describedby={error ? `${nombre}-error` : undefined}
          onChange={(e) => cambiar(nombre, e.target.value)}
          onBlur={() => setTocados((t) => ({ ...t, [nombre]: true }))}
        />
        <small>
          {r.min}–{r.max}
          {(nombre === "filas" || nombre === "columnas") && ", par"}
        </small>
        {error && (
          <p id={`${nombre}-error`} className="error-campo" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <section aria-labelledby="titulo-generar">
      <h2 id="titulo-generar">Generación de mapa</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setCargando(true);
          setErrorOp(null);
          try {
            const r = await api.generar({
              filas: config.filas,
              columnas: config.columnas,
              microbiomas: config.microbiomas,
              n: config.gimnasiosPorCuadrante,
              radio: config.radio,
              semilla: config.semilla.trim() || undefined,
            });
            setRespuesta(r);
            setDatos(datosDesdeRespuesta(r));
          } catch (err) {
            setRespuesta(null);
            setErrorOp(
              err instanceof ErrorApi
                ? { causa: err.causa, accion: err.accion }
                : { causa: "No se pudo contactar al servidor.", accion: "Verificá que el backend esté corriendo." }
            );
          } finally {
            setCargando(false);
          }
        }}
        noValidate
      >
        <div className="grilla-form">
          {campo("filas", "Filas")}
          {campo("columnas", "Columnas")}
          {campo("microbiomas", "Microbiomas")}
          {campo("gimnasiosPorCuadrante", "Gimnasios por cuadrante")}
          {campo("radio", "Radio de influencia")}
          <div className="campo">
            <label htmlFor="semilla">Semilla (opcional)</label>
            <input
              id="semilla"
              type="text"
              value={config.semilla}
              placeholder="Se genera una si se deja vacía"
              onChange={(e) => setConfig({ ...config, semilla: e.target.value })}
            />
          </div>
        </div>
        {listaErrores.length > 0 && (
          <div className="aviso-error" role="alert">
            <strong>Corregí los siguientes campos:</strong>
            <ul>
              {listaErrores.map(([c, msg]) => (
                <li key={c}>
                  {c}: {msg}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button type="submit" disabled={listaErrores.length > 0 || cargando}>
          {cargando ? "Generando…" : "Generar"}
        </button>
      </form>

      {errorOp && (
        <div className="aviso-error" role="alert">
          <strong>{errorOp.causa}</strong> {errorOp.accion}
        </div>
      )}

      {respuesta && respuesta.resultado !== "exito" && (
        <div className="aviso-error" role="alert">
          {respuesta.resultado === "sin_solucion"
            ? "No existe una solución para esa configuración en ese contexto."
            : "La búsqueda agotó su presupuesto sin demostrar que la configuración sea imposible."}{" "}
          Semilla utilizada: <code>{respuesta.semilla}</code>
        </div>
      )}

      {datos && <VistaMapa datos={datos} onCambio={setDatos} />}
    </section>
  );
}
