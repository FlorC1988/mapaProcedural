import { useEffect, useRef, useState } from "react";
import {
  api,
  ErrorApi,
  type ContextoVisual,
  type MapaGenerado,
  type RespuestaGeneracion,
  type SnapshotMapa,
} from "../api";
import Tablero from "./Tablero";
import Recursos from "./Recursos";
import Editor from "./Editor";

type EstadoMapa = DatosMapa["mapa"];

export interface IdentidadMapa {
  id: string;
  nombre: string;
  version: number;
}

export interface DatosMapa {
  mapa: Pick<MapaGenerado, "configuracion" | "celdas" | "gimnasios" | "instanciasMicrobioma">;
  contextoVisual: ContextoVisual;
  contextoSnapshot: unknown;
  versionSnapshot: number;
  versionAlgoritmo: number;
  identidad: IdentidadMapa | null;
}

export function datosDesdeRespuesta(r: RespuestaGeneracion): DatosMapa | null {
  if (r.resultado !== "exito" || !r.mapa) return null;
  return {
    mapa: r.mapa,
    contextoVisual: r.contexto,
    contextoSnapshot: r.contextoSnapshot,
    versionSnapshot: r.versionSnapshot ?? 1,
    versionAlgoritmo: 1,
    identidad: null,
  };
}

export function datosDesdeGuardado(g: {
  id: string;
  nombre: string;
  version: number;
  snapshot: SnapshotMapa;
}): DatosMapa {
  return {
    mapa: {
      configuracion: g.snapshot.configuracion,
      celdas: g.snapshot.celdas,
      gimnasios: g.snapshot.gimnasios,
      instanciasMicrobioma: g.snapshot.instanciasMicrobioma,
    },
    contextoVisual: {
      biomas: g.snapshot.contexto.biomas.map(({ id, nombre, color, icono, activo }) => ({
        id,
        nombre,
        color,
        icono,
        activo,
      })),
      tiposGimnasio: g.snapshot.contexto.tiposGimnasio.map(({ id, nombre }) => ({ id, nombre })),
    },
    contextoSnapshot: g.snapshot.contexto,
    versionSnapshot: g.snapshot.versionSnapshot,
    versionAlgoritmo: g.snapshot.versionAlgoritmo,
    identidad: { id: g.id, nombre: g.nombre, version: g.version },
  };
}

type ModoNombre = "guardar" | "guardar-como" | "duplicar" | null;

export default function VistaMapa({
  datos,
  onCambio,
}: {
  datos: DatosMapa;
  onCambio: (d: DatosMapa | null) => void;
}) {
  const [modo, setModo] = useState<ModoNombre>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<{ causa: string; accion?: string } | null>(null);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  // Edición: historial de sesión (deshacer/rehacer, RF-EDI-013).
  const [editando, setEditando] = useState(false);
  const [pasados, setPasados] = useState<EstadoMapa[]>([]);
  const [futuros, setFuturos] = useState<EstadoMapa[]>([]);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
  const clickEditor = useRef<((fila: number, columna: number) => void) | null>(null);

  const { mapa, identidad } = datos;

  function cambiarDatos(d: DatosMapa | null) {
    setPasados([]);
    setFuturos([]);
    onCambio(d);
  }

  function aplicarEdicion(nuevo: EstadoMapa) {
    setPasados((p) => [...p, mapa]);
    setFuturos([]);
    onCambio({ ...datos, mapa: nuevo });
  }

  function deshacer() {
    setPasados((p) => {
      if (p.length === 0) return p;
      const anterior = p[p.length - 1];
      setFuturos((f) => [mapa, ...f]);
      onCambio({ ...datos, mapa: anterior });
      return p.slice(0, -1);
    });
  }

  function rehacer() {
    setFuturos((f) => {
      if (f.length === 0) return f;
      const siguiente = f[0];
      setPasados((p) => [...p, mapa]);
      onCambio({ ...datos, mapa: siguiente });
      return f.slice(1);
    });
  }

  useEffect(() => {
    if (!editando) return;
    const alTecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) rehacer();
        else deshacer();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        rehacer();
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  });

  function snapshotActual(): SnapshotMapa {
    return {
      versionSnapshot: datos.versionSnapshot,
      versionAlgoritmo: datos.versionAlgoritmo,
      configuracion: mapa.configuracion,
      celdas: mapa.celdas,
      gimnasios: mapa.gimnasios,
      instanciasMicrobioma: mapa.instanciasMicrobioma,
      contexto: datos.contextoSnapshot as SnapshotMapa["contexto"],
    };
  }

  async function ejecutar(fn: () => Promise<void>) {
    setOcupado(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof ErrorApi
          ? { causa: e.causa, accion: e.accion }
          : { causa: "No se pudo contactar al servidor." }
      );
    } finally {
      setOcupado(false);
    }
  }

  async function guardarNuevo(n: string) {
    await ejecutar(async () => {
      const creado = await api.crearMapa(n, snapshotActual());
      cambiarDatos({ ...datos, identidad: creado });
      setModo(null);
      setNombre("");
    });
  }

  async function guardarExistente() {
    if (!identidad) return;
    await ejecutar(async () => {
      const act = await api.actualizarMapa(identidad.id, identidad.version, snapshotActual());
      cambiarDatos({ ...datos, identidad: { id: act.id, nombre: act.nombre, version: act.version } });
    });
  }

  async function regenerar() {
    if (!identidad) return;
    await ejecutar(async () => {
      const r = await api.regenerarMapa(identidad.id);
      const d = datosDesdeRespuesta(r);
      if (d) cambiarDatos(d);
      else
        setError({
          causa:
            r.resultado === "sin_solucion"
              ? "No existe una solución para esa configuración con el contexto guardado."
              : "La búsqueda agotó su presupuesto sin demostrar que la configuración sea imposible.",
        });
    });
  }

  async function eliminar() {
    if (!identidad) return;
    await ejecutar(async () => {
      await api.eliminarMapa(identidad.id);
      cambiarDatos(null);
    });
  }

  return (
    <section aria-label="Mapa">
      <div className="barra-mapa">
        {identidad && (
          <span>
            <strong>{identidad.nombre}</strong> (v{identidad.version})
          </span>
        )}
        <span className="acciones">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => (identidad ? guardarExistente() : setModo("guardar"))}
          >
            Guardar
          </button>
          <button type="button" disabled={ocupado} onClick={() => setModo("guardar-como")}>
            Guardar como
          </button>
          <button type="button" disabled={ocupado} onClick={() => setModo("duplicar")}>
            Duplicar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditando((e) => !e);
              setErrorEdicion(null);
            }}
          >
            {editando ? "Terminar edición" : "Editar"}
          </button>
          {identidad && (
            <>
              <button type="button" disabled={ocupado} onClick={regenerar}>
                Regenerar
              </button>
              <button type="button" disabled={ocupado} onClick={() => setConfirmandoBorrado(true)}>
                Eliminar
              </button>
            </>
          )}
        </span>
      </div>

      {modo && (
        <form
          className="pedir-nombre"
          onSubmit={(e) => {
            e.preventDefault();
            if (nombre.trim().length >= 1 && nombre.trim().length <= 100) guardarNuevo(nombre.trim());
          }}
        >
          <label htmlFor="nombre-mapa">
            {modo === "guardar" ? "Nombre del mapa" : modo === "guardar-como" ? "Guardar como" : "Nombre de la copia"}
          </label>
          <input
            id="nombre-mapa"
            value={nombre}
            maxLength={100}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={ocupado || nombre.trim().length === 0}>
            Confirmar
          </button>
          <button type="button" onClick={() => setModo(null)}>
            Cancelar
          </button>
        </form>
      )}

      {confirmandoBorrado && identidad && (
        <div className="aviso-error" role="alertdialog" aria-label="Confirmar eliminación">
          <p>
            ¿Eliminar definitivamente el mapa <strong>{identidad.nombre}</strong>?
          </p>
          <button type="button" onClick={eliminar} disabled={ocupado}>
            Eliminar
          </button>
          <button type="button" onClick={() => setConfirmandoBorrado(false)}>
            Cancelar
          </button>
        </div>
      )}

      {error && (
        <div className="aviso-error" role="alert">
          <strong>{error.causa}</strong> {error.accion}
        </div>
      )}

      <p>
        Semilla: <code>{mapa.configuracion.semilla}</code> · {mapa.configuracion.filas}×
        {mapa.configuracion.columnas} · {mapa.configuracion.microbiomas} microbiomas · N=
        {mapa.configuracion.n} · radio {mapa.configuracion.radio}
      </p>

      {editando && (
        <>
          <div className="editor-fila">
            <button type="button" onClick={deshacer} disabled={pasados.length === 0}>
              Deshacer
            </button>
            <button type="button" onClick={rehacer} disabled={futuros.length === 0}>
              Rehacer
            </button>
          </div>
          <Editor
            mapa={mapa}
            contexto={datos.contextoVisual}
            onEditar={aplicarEdicion}
            onError={setErrorEdicion}
            registrarClick={(fn) => (clickEditor.current = fn)}
          />
          {errorEdicion && (
            <div className="aviso-error" role="alert">
              {errorEdicion}
            </div>
          )}
        </>
      )}

      <Tablero
        mapa={mapa as MapaGenerado}
        biomas={datos.contextoVisual.biomas}
        tipos={datos.contextoVisual.tiposGimnasio}
        onCelda={editando ? (f, c) => clickEditor.current?.(f, c) : undefined}
      />
      <Recursos
        mapa={mapa as MapaGenerado}
        biomas={datos.contextoVisual.biomas}
        tipos={datos.contextoVisual.tiposGimnasio}
      />
    </section>
  );
}
