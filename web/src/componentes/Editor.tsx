import { useEffect, useState } from "react";
import {
  api,
  type ContextoVisual,
  type DefinicionMicrobioma,
  type MapaGenerado,
} from "../api";
import {
  agregarGimnasio,
  cambiarBioma,
  cambiarAltura,
  cambiarTipoGimnasio,
  desvincularMicrobioma,
  ErrorEdicion,
  estamparMicrobioma,
  expandir,
  moverGimnasio,
  moverMicrobioma,
  quitarGimnasio,
  type Bordes,
} from "../editor/operaciones";

type Mapa = Pick<MapaGenerado, "configuracion" | "celdas" | "gimnasios" | "instanciasMicrobioma">;

type Herramienta =
  | "ver"
  | "bioma"
  | "altura"
  | "gym-agregar"
  | "gym-mover"
  | "gym-tipo"
  | "gym-quitar"
  | "micro-estampar"
  | "micro-mover"
  | "micro-desvincular";

const HERRAMIENTAS: { id: Herramienta; nombre: string }[] = [
  { id: "ver", nombre: "Ver" },
  { id: "bioma", nombre: "Cambiar bioma" },
  { id: "altura", nombre: "Cambiar altura" },
  { id: "gym-agregar", nombre: "Agregar gimnasio" },
  { id: "gym-mover", nombre: "Mover gimnasio" },
  { id: "gym-tipo", nombre: "Cambiar tipo de gimnasio" },
  { id: "gym-quitar", nombre: "Quitar gimnasio" },
  { id: "micro-estampar", nombre: "Estampar microbioma" },
  { id: "micro-mover", nombre: "Mover microbioma" },
  { id: "micro-desvincular", nombre: "Desvincular microbioma" },
];

const NECESITA: Partial<Record<Herramienta, ("bioma" | "altura" | "tipo" | "definicion")[]>> = {
  bioma: ["bioma"],
  altura: ["altura"],
  "gym-agregar": ["tipo"],
  "gym-tipo": ["tipo"],
  "micro-estampar": ["definicion"],
};

export default function Editor({
  mapa,
  contexto,
  onEditar,
  onError,
  registrarClick,
}: {
  mapa: Mapa;
  contexto: ContextoVisual;
  onEditar: (nuevo: Mapa) => void;
  onError: (msg: string | null) => void;
  registrarClick: (fn: ((fila: number, columna: number) => void) | null) => void;
}) {
  const [herramienta, setHerramienta] = useState<Herramienta>("ver");
  const [biomaSel, setBiomaSel] = useState("");
  const [alturaSel, setAlturaSel] = useState<1 | 2 | 3>(1);
  const [tipoSel, setTipoSel] = useState(1);
  const [defSel, setDefSel] = useState("");
  const [defs, setDefs] = useState<DefinicionMicrobioma[]>([]);
  const [pendiente, setPendiente] = useState<{ tipo: "gym" | "micro"; id: string } | null>(null);
  const [bordes, setBordes] = useState<Bordes>({ arriba: 0, abajo: 0, izquierda: 0, derecha: 0 });

  const biomasActivos = contexto.biomas.filter((b) => b.activo !== false);
  const defsActivas = defs.filter((d) => d.activo);

  useEffect(() => {
    api.microbiomas().then(setDefs).catch(() => setDefs([]));
  }, []);

  useEffect(() => {
    if (biomasActivos.length > 0 && !biomasActivos.some((b) => b.id === biomaSel)) {
      setBiomaSel(biomasActivos[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto]);

  useEffect(() => {
    if (defsActivas.length > 0 && !defsActivas.some((d) => d.id === defSel)) {
      setDefSel(defsActivas[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defs]);

  // Registrar el manejador de click actualizado en cada render.
  useEffect(() => {
    registrarClick(alClick);
    return () => registrarClick(null);
  });

  function celdaEn(fila: number, columna: number) {
    return mapa.celdas.find((c) => c.fila === fila && c.columna === columna);
  }

  function aplicar(fn: () => Mapa) {
    try {
      onEditar(fn());
      onError(null);
      setPendiente(null);
    } catch (e) {
      onError(e instanceof ErrorEdicion ? e.message : "No se pudo aplicar la edición.");
    }
  }

  function alClick(fila: number, columna: number) {
    const c = celdaEn(fila, columna);
    if (!c) return;
    switch (herramienta) {
      case "bioma":
        aplicar(() => cambiarBioma(mapa, fila, columna, biomaSel));
        break;
      case "altura":
        aplicar(() => cambiarAltura(mapa, fila, columna, alturaSel));
        break;
      case "gym-agregar":
        aplicar(() => agregarGimnasio(mapa, fila, columna, tipoSel));
        break;
      case "gym-quitar":
        if (c.gimnasio) aplicar(() => quitarGimnasio(mapa, c.gimnasio!));
        break;
      case "gym-tipo":
        if (c.gimnasio) aplicar(() => cambiarTipoGimnasio(mapa, c.gimnasio!, tipoSel));
        break;
      case "gym-mover":
        if (!pendiente) {
          if (c.gimnasio) {
            setPendiente({ tipo: "gym", id: c.gimnasio });
            onError(`Gimnasio seleccionado en (${fila}, ${columna}); hacé click en la celda destino.`);
          }
        } else {
          aplicar(() => moverGimnasio(mapa, pendiente.id, fila, columna));
        }
        break;
      case "micro-estampar": {
        const def = defsActivas.find((d) => d.id === defSel);
        if (def) aplicar(() => estamparMicrobioma(mapa, def, fila, columna));
        break;
      }
      case "micro-mover":
        if (!pendiente) {
          if (c.microbioma) {
            setPendiente({ tipo: "micro", id: c.microbioma });
            onError(`Microbioma seleccionado; hacé click en la nueva ancla.`);
          }
        } else {
          aplicar(() => moverMicrobioma(mapa, pendiente.id, fila, columna));
        }
        break;
      case "micro-desvincular":
        if (c.microbioma) aplicar(() => desvincularMicrobioma(mapa, c.microbioma!));
        break;
      default:
        break;
    }
  }

  function aplicarExpansion() {
    aplicar(() => expandir(mapa, bordes, biomaSel, alturaSel));
  }

  return (
    <div className="editor" aria-label="Herramientas de edición">
      <div className="editor-fila">
        <label htmlFor="herramienta">Herramienta</label>
        <select
          id="herramienta"
          value={herramienta}
          onChange={(e) => {
            setHerramienta(e.target.value as Herramienta);
            setPendiente(null);
          }}
        >
          {HERRAMIENTAS.map((h) => (
            <option key={h.id} value={h.id}>
              {h.nombre}
            </option>
          ))}
        </select>

        {NECESITA[herramienta]?.includes("bioma") && (
          <>
            <label htmlFor="bioma-sel">Bioma</label>
            <select id="bioma-sel" value={biomaSel} onChange={(e) => setBiomaSel(e.target.value)}>
              {biomasActivos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </>
        )}
        {NECESITA[herramienta]?.includes("altura") && (
          <>
            <label htmlFor="altura-sel">Altura</label>
            <select
              id="altura-sel"
              value={alturaSel}
              onChange={(e) => setAlturaSel(Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>Z1</option>
              <option value={2}>Z2</option>
              <option value={3}>Z3</option>
            </select>
          </>
        )}
        {NECESITA[herramienta]?.includes("tipo") && (
          <>
            <label htmlFor="tipo-sel">Tipo</label>
            <select id="tipo-sel" value={tipoSel} onChange={(e) => setTipoSel(Number(e.target.value))}>
              {contexto.tiposGimnasio.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </>
        )}
        {NECESITA[herramienta]?.includes("definicion") && (
          <>
            <label htmlFor="def-sel">Definición</label>
            <select id="def-sel" value={defSel} onChange={(e) => setDefSel(e.target.value)}>
              {defsActivas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
            {defsActivas.length === 0 && <span>No hay definiciones activas.</span>}
          </>
        )}
      </div>

      {pendiente && (
        <p className="editor-aviso">
          Esperando celda destino.{" "}
          <button type="button" onClick={() => setPendiente(null)}>
            Cancelar
          </button>
        </p>
      )}

      <details className="expansion">
        <summary>Ampliar tablero</summary>
        <div className="editor-fila">
          {(["arriba", "abajo", "izquierda", "derecha"] as const).map((b) => (
            <label key={b}>
              {b[0].toUpperCase() + b.slice(1)}{" "}
              <input
                type="number"
                min={0}
                max={30}
                step={b === "izquierda" ? 2 : 1}
                value={bordes[b]}
                onChange={(e) => setBordes({ ...bordes, [b]: Number(e.target.value) })}
                style={{ width: "4rem" }}
              />
            </label>
          ))}
          <label>
            Bioma{" "}
            <select value={biomaSel} onChange={(e) => setBiomaSel(e.target.value)}>
              {biomasActivos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Altura{" "}
            <select value={alturaSel} onChange={(e) => setAlturaSel(Number(e.target.value) as 1 | 2 | 3)}>
              <option value={1}>Z1</option>
              <option value={2}>Z2</option>
              <option value={3}>Z3</option>
            </select>
          </label>
          <button type="button" onClick={aplicarExpansion}>
            Aplicar
          </button>
        </div>
        <small>
          Las sumas vertical y horizontal deben ser pares y la expansión por la izquierda, par;
          dimensiones finales pares entre 8 y 30.
        </small>
      </details>
    </div>
  );
}
