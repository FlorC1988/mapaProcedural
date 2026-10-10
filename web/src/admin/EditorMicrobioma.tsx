import { useMemo, useState } from "react";
import { api, ErrorApi, type Bioma, type DefinicionMicrobioma } from "../api";

type CeldaDef = DefinicionMicrobioma["celdas"][number];
type Herramienta = "agregar" | "eliminar" | "ancla" | "editar";

const DIRS = [
  { dq: 1, dr: 0 },
  { dq: 1, dr: -1 },
  { dq: 0, dr: -1 },
  { dq: -1, dr: 0 },
  { dq: -1, dr: 1 },
  { dq: 0, dr: 1 },
];

const TAM = 22;

function clave(dq: number, dr: number) {
  return `${dq},${dr}`;
}

function conectado(celdas: CeldaDef[]): boolean {
  if (celdas.length === 0) return false;
  const set = new Set(celdas.map((c) => clave(c.dq, c.dr)));
  const alcanzadas = new Set([celdas[0] ? clave(celdas[0].dq, celdas[0].dr) : ""]);
  const pila = [...alcanzadas];
  while (pila.length) {
    const [q, r] = pila.pop()!.split(",").map(Number);
    for (const d of DIRS) {
      const k = clave(q + d.dq, r + d.dr);
      if (set.has(k) && !alcanzadas.has(k)) {
        alcanzadas.add(k);
        pila.push(k);
      }
    }
  }
  return alcanzadas.size === celdas.length;
}

function centro(q: number, r: number) {
  return { x: TAM * 1.5 * q, y: TAM * Math.sqrt(3) * (r + q / 2) };
}

function hexagono(cx: number, cy: number, s: number) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + s * Math.cos(a)).toFixed(1)},${(cy + s * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function EditorMicrobioma({
  definicion,
  biomas,
  onGuardado,
  onCerrar,
}: {
  definicion: DefinicionMicrobioma | null;
  biomas: Bioma[];
  onGuardado: () => void;
  onCerrar: () => void;
}) {
  const activos = biomas.filter((b) => b.activo);
  const [nombre, setNombre] = useState(definicion?.nombre ?? "");
  const [activo, setActivo] = useState(definicion?.activo ?? true);
  const [version, setVersion] = useState(definicion?.version ?? 0);
  const [celdas, setCeldas] = useState<CeldaDef[]>(
    definicion?.celdas ?? [{ dq: 0, dr: 0, bioma: activos[0]?.id ?? "", altura: 1 }]
  );
  const [herramienta, setHerramienta] = useState<Herramienta>("agregar");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [biomaSel, setBiomaSel] = useState(activos[0]?.id ?? "");
  const [alturaSel, setAlturaSel] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const setCeldasSet = useMemo(() => new Set(celdas.map((c) => clave(c.dq, c.dr))), [celdas]);
  const porClave = useMemo(() => new Map(celdas.map((c) => [clave(c.dq, c.dr), c])), [celdas]);

  // Vecinos vacíos adyacentes a la forma (objetivos válidos de "agregar").
  const vecinosVacios = useMemo(() => {
    const out = new Map<string, { dq: number; dr: number }>();
    for (const c of celdas) {
      for (const d of DIRS) {
        const k = clave(c.dq + d.dq, c.dr + d.dr);
        if (!setCeldasSet.has(k)) out.set(k, { dq: c.dq + d.dq, dr: c.dr + d.dr });
      }
    }
    return out;
  }, [celdas, setCeldasSet]);

  function clickCelda(c: CeldaDef, e: React.MouseEvent) {
    const k = clave(c.dq, c.dr);
    if (herramienta === "eliminar") {
      if (celdas.length === 1) {
        setError("La definición debe conservar al menos una celda.");
        return;
      }
      const resto = celdas.filter((x) => clave(x.dq, x.dr) !== k);
      if (!conectado(resto)) {
        setError("No se puede eliminar: la forma quedaría desconectada.");
        return;
      }
      setCeldas(resto);
      setSeleccion((s) => {
        const n = new Set(s);
        n.delete(k);
        return n;
      });
      setError(null);
    } else if (herramienta === "ancla") {
      // Reanclar: la celda elegida pasa a (0,0) y se recalculan los offsets.
      setCeldas(
        celdas.map((x) => ({ ...x, dq: x.dq - c.dq, dr: x.dr - c.dr }))
      );
      setSeleccion(new Set());
      setError(null);
    } else {
      // editar: selección simple o múltiple con Shift/Ctrl.
      setSeleccion((s) => {
        const n = e.shiftKey || e.ctrlKey || e.metaKey ? new Set(s) : new Set<string>();
        if (n.has(k)) n.delete(k);
        else n.add(k);
        return n;
      });
      setError(null);
    }
  }

  function clickVacio(v: { dq: number; dr: number }) {
    if (herramienta !== "agregar") return;
    if (celdas.length >= 900) {
      setError("La definición no puede superar 900 celdas.");
      return;
    }
    setCeldas([...celdas, { dq: v.dq, dr: v.dr, bioma: biomaSel, altura: alturaSel }]);
    setError(null);
  }

  function aplicarA(campo: "bioma" | "altura", valor: string | number) {
    setCeldas(
      celdas.map((c) =>
        seleccion.has(clave(c.dq, c.dr))
          ? { ...c, [campo]: campo === "altura" ? (valor as 1 | 2 | 3) : valor }
          : c
      )
    );
  }

  async function guardar() {
    setError(null);
    const n = nombre.trim();
    if (!n || n.length > 100) {
      setError("El nombre es obligatorio (1–100 caracteres).");
      return;
    }
    if (!celdas.some((c) => c.dq === 0 && c.dr === 0)) {
      setError("La definición necesita una celda ancla en (0,0).");
      return;
    }
    if (!conectado(celdas)) {
      setError("La forma debe estar conectada por lados.");
      return;
    }
    if (celdas.some((c) => !c.bioma)) {
      setError("Toda celda necesita un bioma.");
      return;
    }
    setOcupado(true);
    try {
      if (definicion) {
        const r = await api.actualizarMicrobioma(definicion.id, {
          nombre: n,
          activo,
          celdas,
          version,
        });
        setVersion(r.version);
      } else {
        await api.crearMicrobioma({ nombre: n, celdas });
      }
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo guardar la definición.");
    } finally {
      setOcupado(false);
    }
  }

  // Encuadre del SVG.
  const puntos = [...celdas, ...vecinosVacios.values()];
  const xs = puntos.map((c) => centro(c.dq, c.dr).x);
  const ys = puntos.map((c) => centro(c.dq, c.dr).y);
  const minX = Math.min(...xs) - TAM;
  const maxX = Math.max(...xs) + TAM;
  const minY = Math.min(...ys) - TAM;
  const maxY = Math.max(...ys) + TAM;

  const colorDe = (b: string) => biomas.find((x) => x.id === b)?.color ?? "#888";

  return (
    <form
      className="form-admin editor-microbioma"
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
    >
      <h4>{definicion ? `Editar "${definicion.nombre}"` : "Nueva definición de microbioma"}</h4>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <div className="editor-fila">
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} />
        </label>
        {definicion && (
          <label className="check">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activa
          </label>
        )}
        <label>
          Herramienta
          <select value={herramienta} onChange={(e) => setHerramienta(e.target.value as Herramienta)}>
            <option value="agregar">Agregar celda</option>
            <option value="eliminar">Eliminar celda</option>
            <option value="ancla">Establecer ancla</option>
            <option value="editar">Seleccionar / editar</option>
          </select>
        </label>
        <label>
          Bioma
          <select
            value={biomaSel}
            onChange={(e) => {
              setBiomaSel(e.target.value);
              aplicarA("bioma", e.target.value);
            }}
          >
            {activos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Altura
          <select
            value={alturaSel}
            onChange={(e) => {
              const v = Number(e.target.value) as 1 | 2 | 3;
              setAlturaSel(v);
              aplicarA("altura", v);
            }}
          >
            <option value={1}>Z1</option>
            <option value={2}>Z2</option>
            <option value={3}>Z3</option>
          </select>
        </label>
      </div>
      <p className="ayuda">
        {herramienta === "agregar" && "Click en un hexágono punteado para agregar una celda adyacente."}
        {herramienta === "eliminar" && "Click en una celda para eliminarla (se conserva la conexión)."}
        {herramienta === "ancla" && "Click en una celda para convertirla en el ancla (0,0)."}
        {herramienta === "editar" &&
          "Click para seleccionar celdas (Shift para selección múltiple); los cambios de bioma/altura se aplican a la selección."}
      </p>
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        className="lienzo-microbioma"
        role="img"
        aria-label="Editor de forma de microbioma"
      >
        {[...vecinosVacios.values()].map((v) => {
          const { x, y } = centro(v.dq, v.dr);
          return (
            <polygon
              key={clave(v.dq, v.dr)}
              points={hexagono(x, y, TAM * 0.95)}
              fill="transparent"
              stroke="#a1a1aa"
              strokeDasharray="4 3"
              className={herramienta === "agregar" ? "celda-agregable" : "celda-inerte"}
              onClick={() => clickVacio(v)}
            />
          );
        })}
        {celdas.map((c) => {
          const { x, y } = centro(c.dq, c.dr);
          const k = clave(c.dq, c.dr);
          const esAncla = c.dq === 0 && c.dr === 0;
          return (
            <g key={k} onClick={(e) => clickCelda(c, e)} className="celda-def">
              <polygon
                points={hexagono(x, y, TAM * 0.95)}
                fill={colorDe(c.bioma)}
                stroke={seleccion.has(k) ? "#2563eb" : esAncla ? "#111" : "#52525b"}
                strokeWidth={seleccion.has(k) || esAncla ? 2.5 : 1}
              />
              <text x={x} y={y + 3} textAnchor="middle" fontSize={9} pointerEvents="none">
                {esAncla ? "⚓" : `Z${c.altura}`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="editor-fila">
        <button type="submit" disabled={ocupado}>
          Guardar
        </button>
        <button type="button" onClick={onCerrar}>
          Cancelar
        </button>
        <span>{celdas.length} celdas · {seleccion.size} seleccionadas</span>
      </div>
    </form>
  );
}
