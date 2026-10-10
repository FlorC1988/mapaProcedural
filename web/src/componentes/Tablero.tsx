import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapaGenerado } from "../api";

// Visualización del tablero (DEC-060/061/062):
// - hexágonos flat-top, columnas visibles pares desplazadas medio hexágono abajo
// - cada celda: color + icono de bioma, etiqueta Z persistente, coordenadas
// - gimnasio superpuesto con símbolo y tipo; microbiomas con contorno propio
// - capa de influencia conmutable (oculta inicialmente)
// - inspector de celda, ajuste inicial, zoom (controles y rueda), arrastre

const S = 26;
const H = Math.sqrt(3) * S;
const PALETA_MICRO = ["#7c3aed", "#0891b2", "#dc2626", "#ca8a04", "#4f46e5", "#0d9488", "#be185d", "#65a30d"];

// Ángulos de los 6 vértices del hexágono flat-top.
const VERTICES = [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180);
// Borde que comparte cada dirección axial vecina: vértices en ángulo±30°.
const BORDES: Record<string, [number, number]> = {
  "1,0": [0, 60],
  "1,-1": [300, 0],
  "0,-1": [240, 300],
  "-1,0": [180, 240],
  "-1,1": [120, 180],
  "0,1": [60, 120],
};

function centro(fila: number, columna: number): { cx: number; cy: number } {
  return {
    cx: S + (columna - 1) * 1.5 * S,
    cy: H / 2 + (fila - 1) * H + (columna % 2 === 0 ? H / 2 : 0),
  };
}

function vertice(cx: number, cy: number, angulo: number): string {
  return `${(cx + S * Math.cos(angulo)).toFixed(2)},${(cy + S * Math.sin(angulo)).toFixed(2)}`;
}

function poligono(cx: number, cy: number): string {
  return VERTICES.map((a) => vertice(cx, cy, a)).join(" ");
}

interface Seleccion {
  fila: number;
  columna: number;
}

export default function Tablero({
  mapa,
  biomas,
  tipos,
  onCelda,
}: {
  mapa: MapaGenerado;
  biomas: { id: string; nombre: string; color: string; icono: string; activo?: boolean }[];
  tipos: { id: number; nombre: string }[];
  onCelda?: (fila: number, columna: number) => void;
}) {
  const { filas, columnas } = mapa.configuracion;
  const biomaPorId = useMemo(() => new Map(biomas.map((b) => [b.id, b])), [biomas]);
  const tipoPorId = useMemo(() => new Map(tipos.map((t) => [t.id, t])), [tipos]);
  const gymPorPos = useMemo(
    () => new Map(mapa.gimnasios.map((g) => [`${g.fila},${g.columna}`, g])),
    [mapa]
  );
  const celdaPorPos = useMemo(
    () => new Map(mapa.celdas.map((c) => [`${c.fila},${c.columna}`, c])),
    [mapa]
  );
  const microPorId = useMemo(
    () => new Map(mapa.instanciasMicrobioma.map((m, i) => [m.id, { ...m, indice: i }])),
    [mapa]
  );

  const [mostrarInfluencia, setMostrarInfluencia] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [vista, setVista] = useState({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const arrastre = useRef<{ x: number; y: number; vx: number; vy: number; movio: boolean } | null>(null);

  const ancho = (columnas - 1) * 1.5 * S + 2 * S;
  const alto = (filas - 1) * H + H * 1.5 + (columnas > 1 ? H / 2 : 0);

  // Convierte un punto de pantalla a coordenadas del viewBox considerando el
  // letterboxing de preserveAspectRatio="meet" (el SVG puede ser más ancho o
  // alto que la proporción del tablero).
  const aTablero = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const r = svgRef.current!.getBoundingClientRect();
      const escala = Math.min(r.width / ancho, r.height / alto);
      const offsetX = (r.width - ancho * escala) / 2;
      const offsetY = (r.height - alto * escala) / 2;
      return {
        x: (e.clientX - r.left - offsetX) / escala,
        y: (e.clientY - r.top - offsetY) / escala,
      };
    },
    [ancho, alto]
  );

  const zoom = useCallback(
    (factor: number, punto?: { x: number; y: number }) => {
      setVista((v) => {
        const k = Math.min(6, Math.max(0.4, v.k * factor));
        const p = punto ?? { x: ancho / 2, y: alto / 2 };
        const f = k / v.k;
        return { k, x: p.x - (p.x - v.x) * f, y: p.y - (p.y - v.y) * f };
      });
    },
    [ancho, alto]
  );

  // React registra `wheel` como pasivo; el zoom con rueda necesita
  // preventDefault, así que se adjunta manualmente como no pasivo.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const alRodar = (e: WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, aTablero(e));
    };
    svg.addEventListener("wheel", alRodar, { passive: false });
    return () => svg.removeEventListener("wheel", alRodar);
  }, [zoom, aTablero]);

  // Contornos de microbioma: bordes cuyo vecino no pertenece a la instancia.
  const contornos = useMemo(() => {
    const instanciaDePos = new Map<string, string>();
    for (const m of mapa.instanciasMicrobioma)
      for (const c of m.celdas) instanciaDePos.set(`${c.fila},${c.columna}`, m.id);
    const out: { id: string; indice: number; segmentos: [string, string][] }[] = [];
    for (const m of mapa.instanciasMicrobioma) {
      const segmentos: [string, string][] = [];
      for (const c of m.celdas) {
        const { cx, cy } = centro(c.fila, c.columna);
        const a = { q: c.columna - 1, r: c.fila - 1 - Math.floor((c.columna - 1) / 2) };
        for (const [dir, [a1, a2]] of Object.entries(BORDES)) {
          const [dq, dr] = dir.split(",").map(Number);
          const v = { q: a.q + dq, r: a.r + dr };
          const vf = v.r + Math.floor(v.q / 2) + 1;
          const vecinoEsMismo = instanciaDePos.get(`${vf},${v.q + 1}`) === m.id;
          if (!vecinoEsMismo) segmentos.push([vertice(cx, cy, (a1 * Math.PI) / 180), vertice(cx, cy, (a2 * Math.PI) / 180)]);
        }
      }
      const indice = microPorId.get(m.id)?.indice ?? 0;
      out.push({ id: m.id, indice, segmentos });
    }
    return out;
  }, [mapa, microPorId]);

  const celdaSel = seleccion ? celdaPorPos.get(`${seleccion.fila},${seleccion.columna}`) : null;
  const gymSel = celdaSel?.gimnasio ? mapa.gimnasios.find((g) => g.id === celdaSel.gimnasio) : null;
  const microSel = celdaSel?.microbioma ? microPorId.get(celdaSel.microbioma) : null;

  return (
    <div className="visor">
      <div className="visor-controles" role="toolbar" aria-label="Controles del tablero">
        <button type="button" onClick={() => zoom(1.25)} aria-label="Acercar">+</button>
        <button type="button" onClick={() => zoom(0.8)} aria-label="Alejar">−</button>
        <button type="button" onClick={() => setVista({ x: 0, y: 0, k: 1 })}>Ajustar</button>
        <label>
          <input
            type="checkbox"
            checked={mostrarInfluencia}
            onChange={(e) => setMostrarInfluencia(e.target.checked)}
          />{" "}
          Influencia
        </label>
      </div>
      <div className="visor-cuerpo">
        <svg
          ref={svgRef}
          className="visor-svg"
          viewBox={`0 0 ${ancho} ${alto}`}
          role="img"
          aria-label="Tablero"
          onPointerDown={(e) => {
            svgRef.current!.setPointerCapture?.(e.pointerId);
            arrastre.current = { x: e.clientX, y: e.clientY, vx: vista.x, vy: vista.y, movio: false };
          }}
          onPointerMove={(e) => {
            const d = arrastre.current;
            if (!d) return;
            const r = svgRef.current!.getBoundingClientRect();
            if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.movio = true;
            const escala = Math.min(r.width / ancho, r.height / alto);
            const nx = d.vx + (e.clientX - d.x) / escala;
            const ny = d.vy + (e.clientY - d.y) / escala;
            setVista((v) => ({ ...v, x: nx, y: ny }));
          }}
          onPointerUp={(e) => {
            const d = arrastre.current;
            arrastre.current = null;
            if (d?.movio) return;
            // Con pointer capture el click no llega a la celda: se selecciona
            // la celda más cercana al punto soltado (en coordenadas de tablero).
            const p = aTablero(e);
            const bx = (p.x - vista.x) / vista.k;
            const by = (p.y - vista.y) / vista.k;
            let mejor: Seleccion | null = null;
            let mejorD = Infinity;
            for (const c of mapa.celdas) {
              const { cx, cy } = centro(c.fila, c.columna);
              const dd = Math.hypot(bx - cx, by - cy);
              if (dd < mejorD) {
                mejorD = dd;
                mejor = { fila: c.fila, columna: c.columna };
              }
            }
            if (mejor && mejorD <= S) {
              setSeleccion(mejor);
              onCelda?.(mejor.fila, mejor.columna);
            }
          }}
          onPointerLeave={() => (arrastre.current = null)}
        >
          <defs>
            <pattern
              id="trama-gym"
              width="6"
              height="6"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#7f1d1d" strokeWidth="1.2" opacity="0.45" />
            </pattern>
          </defs>
          <g transform={`translate(${vista.x} ${vista.y}) scale(${vista.k})`}>
            {mapa.celdas.map((c) => {
              const { cx, cy } = centro(c.fila, c.columna);
              const bioma = biomaPorId.get(c.bioma);
              const gym = gymPorPos.get(`${c.fila},${c.columna}`);
              const sel = seleccion?.fila === c.fila && seleccion?.columna === c.columna;
              return (
                <g
                  key={`${c.fila}-${c.columna}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Celda ${c.fila}, ${c.columna}: ${bioma?.nombre ?? c.bioma}, Z${c.altura}${gym ? `, gimnasio ${tipoPorId.get(gym.tipoId)?.nombre}` : ""}`}
                  onClick={() => setSeleccion({ fila: c.fila, columna: c.columna })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSeleccion({ fila: c.fila, columna: c.columna });
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <polygon
                    points={poligono(cx, cy)}
                    fill={bioma?.color ?? "#e4e4e7"}
                    stroke={sel ? "#18181b" : "#fafafa"}
                    strokeWidth={sel ? 3 : 1.5}
                  />
                  {gym && (
                    <polygon
                      points={poligono(cx, cy)}
                      fill="url(#trama-gym)"
                      stroke="#7f1d1d"
                      strokeWidth={2.5}
                      pointerEvents="none"
                    />
                  )}
                  <text x={cx} y={cy - 5} textAnchor="middle" fontSize={8} fill="#18181b" pointerEvents="none">
                    {c.fila},{c.columna}
                  </text>
                  {gym ? (
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#7f1d1d" pointerEvents="none">
                      ⬢ {tipoPorId.get(gym.tipoId)?.nombre}
                    </text>
                  ) : (
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#3f3f46" pointerEvents="none">
                      {bioma?.icono}
                    </text>
                  )}
                  <text x={cx} y={cy + 15} textAnchor="middle" fontSize={10} fontWeight={600} fill="#18181b" pointerEvents="none">
                    Z{c.altura}
                  </text>
                </g>
              );
            })}
            {mostrarInfluencia &&
              mapa.gimnasios.map((g) =>
                g.area.map((c) => {
                  const { cx, cy } = centro(c.fila, c.columna);
                  return (
                    <polygon
                      key={`inf-${g.id}-${c.fila}-${c.columna}`}
                      points={poligono(cx, cy)}
                      fill="#7f1d1d"
                      opacity={0.18}
                      pointerEvents="none"
                    />
                  );
                })
              )}
            {contornos.map((cont) => (
              <g key={cont.id} pointerEvents="none">
                {cont.segmentos.map(([p1, p2], i) => (
                  <line
                    key={i}
                    x1={p1.split(",")[0]}
                    y1={p1.split(",")[1]}
                    x2={p2.split(",")[0]}
                    y2={p2.split(",")[1]}
                    stroke={PALETA_MICRO[cont.indice % PALETA_MICRO.length]}
                    strokeWidth={3}
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
        <aside className="inspector" aria-label="Detalle de celda">
          <h3>Detalle</h3>
          {celdaSel ? (
            <dl>
              <dt>Coordenadas</dt>
              <dd>
                ({celdaSel.fila}, {celdaSel.columna})
              </dd>
              <dt>Bioma</dt>
              <dd>{biomaPorId.get(celdaSel.bioma)?.nombre ?? celdaSel.bioma}</dd>
              <dt>Altura</dt>
              <dd>Z{celdaSel.altura}</dd>
              {gymSel && (
                <>
                  <dt>Gimnasio</dt>
                  <dd>
                    {tipoPorId.get(gymSel.tipoId)?.nombre} ({gymSel.id})
                  </dd>
                </>
              )}
              {microSel && (
                <>
                  <dt>Microbioma</dt>
                  <dd>
                    {microSel.nombre} ({microSel.id})
                  </dd>
                </>
              )}
            </dl>
          ) : (
            <p>Seleccioná una celda para ver su detalle.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
