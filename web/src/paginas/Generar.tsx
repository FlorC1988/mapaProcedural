import { useEffect, useState } from "react";
import { api, ErrorApi, type DefinicionMicrobioma } from "../api";
import Modal from "../componentes/Modal";
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
  // Selección de microbiomas (DEC-091): el modal se abre al pulsar Generar.
  const [modalMicro, setModalMicro] = useState(false);
  const [defs, setDefs] = useState<DefinicionMicrobioma[] | null>(null);
  const [errorDefs, setErrorDefs] = useState<string | null>(null);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [cantidadMicro, setCantidadMicro] = useState<number>(config.microbiomas);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    if (!modalMicro) return;
    let vivo = true;
    setDefs(null);
    setErrorDefs(null);
    setErrorModal(null);
    setCantidadMicro(config.microbiomas);
    api
      .microbiomas("", "activo")
      .then((lista) => {
        if (!vivo) return;
        setDefs(lista);
        setMarcadas(
          new Set(
            config.microbiomasElegidos === null
              ? lista.map((d) => d.id)
              : config.microbiomasElegidos.filter((id) => lista.some((d) => d.id === id))
          )
        );
      })
      .catch(() => {
        if (vivo) setErrorDefs("No se pudieron cargar las definiciones de microbioma.");
      });
    return () => {
      vivo = false;
    };
  }, [modalMicro]); // eslint-disable-line react-hooks/exhaustive-deps

  const errores = (Object.keys(RANGOS) as Campo[]).filter((c) => c !== "microbiomas").reduce<Partial<Record<Campo, string>>>(
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

  async function confirmarGeneracion() {
    const r = RANGOS.microbiomas;
    if (!Number.isInteger(cantidadMicro) || cantidadMicro < r.min || cantidadMicro > r.max) {
      setErrorModal(`La cantidad debe ser un entero entre ${r.min} y ${r.max}.`);
      return;
    }
    if (cantidadMicro > 0 && marcadas.size === 0) {
      setErrorModal("Elegí al menos una definición para colocar microbiomas.");
      return;
    }
    setErrorModal(null);
    const elegidos = [...marcadas];
    setConfig({ ...config, microbiomas: cantidadMicro, microbiomasElegidos: elegidos });
    setCargando(true);
    setErrorOp(null);
    try {
      const resp = await api.generar({
        filas: config.filas,
        columnas: config.columnas,
        microbiomas: cantidadMicro,
        microbiomasElegidos: elegidos,
        n: config.gimnasiosPorCuadrante,
        radio: config.radio,
        semilla: config.semilla.trim() || undefined,
      });
      setRespuesta(resp);
      setDatos(datosDesdeRespuesta(resp));
      setModalMicro(false);
    } catch (err) {
      setRespuesta(null);
      setModalMicro(false);
      setErrorOp(
        err instanceof ErrorApi
          ? { causa: err.causa, accion: err.accion }
          : { causa: "No se pudo contactar al servidor.", accion: "Verificá que el backend esté corriendo." }
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-generar">
      <h2 id="titulo-generar">Generación de mapa</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setModalMicro(true);
        }}
        noValidate
      >
        <div className="grilla-form">
          {campo("filas", "Filas")}
          {campo("columnas", "Columnas")}
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

      <Modal
        abierto={modalMicro}
        titulo="Microbiomas a colocar"
        onCerrar={() => setModalMicro(false)}
      >
        {errorDefs && (
          <div className="aviso-error" role="alert">
            {errorDefs}
          </div>
        )}
        {defs === null && !errorDefs && <p className="ayuda">Cargando definiciones…</p>}
        {defs !== null && (
          <>
            <p className="ayuda">
              Elegí qué definiciones participan y cuántas instancias se colocarán. El reparto
              es aleatorio entre las elegidas.
            </p>
            {defs.length === 0 && (
              <p className="ayuda">No hay definiciones activas; se generará sin microbiomas.</p>
            )}
            <div className="lista-microbiomas">
              {defs.map((d) => (
                <label key={d.id} className="check">
                  <input
                    type="checkbox"
                    checked={marcadas.has(d.id)}
                    onChange={(e) =>
                      setMarcadas((m) => {
                        const s = new Set(m);
                        if (e.target.checked) s.add(d.id);
                        else s.delete(d.id);
                        return s;
                      })
                    }
                  />
                  {d.nombre} ({d.celdas.length} {d.celdas.length === 1 ? "celda" : "celdas"})
                </label>
              ))}
            </div>
            <div className="campo">
              <label htmlFor="cantidad-micro">Cantidad de microbiomas</label>
              <input
                id="cantidad-micro"
                type="number"
                min={RANGOS.microbiomas.min}
                max={RANGOS.microbiomas.max}
                value={Number.isNaN(cantidadMicro) ? "" : cantidadMicro}
                onChange={(e) => setCantidadMicro(Number(e.target.value))}
              />
              <small>
                {RANGOS.microbiomas.min}–{RANGOS.microbiomas.max}
              </small>
            </div>
            {errorModal && (
              <div className="aviso-error" role="alert">
                {errorModal}
              </div>
            )}
            <div className="acciones">
              <button
                type="button"
                disabled={cargando}
                onClick={() => void confirmarGeneracion()}
              >
                {cargando ? "Generando…" : "Generar"}
              </button>
              <button type="button" disabled={cargando} onClick={() => setModalMicro(false)}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </Modal>

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
