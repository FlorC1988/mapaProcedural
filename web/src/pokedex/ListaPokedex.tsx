import { useEffect, useRef, type KeyboardEvent } from "react";
import type { CategoriaEspecie, Especie, TipoGimnasio } from "../api";
import BadgeTipo from "./BadgeTipo";
import { formatearDex } from "./tipos";

export interface FiltrosPokedex {
  q: string;
  estado: string;
  tipo: string;
  categoria: string;
  generacion: string;
  orden: string;
}

// Pantalla izquierda de la Pokédex: filtros + lista navegable por teclado.
export default function ListaPokedex({
  especies,
  tipos,
  categorias,
  filtros,
  seleccionadaId,
  onFiltros,
  onSeleccionar,
}: {
  especies: Especie[];
  tipos: TipoGimnasio[];
  categorias: CategoriaEspecie[];
  filtros: FiltrosPokedex;
  seleccionadaId: string | null;
  onFiltros: (f: FiltrosPokedex) => void;
  onSeleccionar: (id: string) => void;
}) {
  const listaRef = useRef<HTMLUListElement>(null);

  // Mantiene visible la fila seleccionada al cambiar por teclado o por enlace de evolución.
  useEffect(() => {
    if (!seleccionadaId) return;
    listaRef.current
      ?.querySelector<HTMLElement>(`[data-id="${seleccionadaId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [seleccionadaId]);

  const nombreTipo = (id: number) => tipos.find((t) => t.id === id)?.nombre ?? String(id);

  function teclado(e: KeyboardEvent<HTMLUListElement>) {
    if (especies.length === 0) return;
    const i = especies.findIndex((x) => x.id === seleccionadaId);
    let siguiente = i;
    if (e.key === "ArrowDown") siguiente = Math.min(especies.length - 1, i + 1);
    else if (e.key === "ArrowUp") siguiente = Math.max(0, i - 1);
    else if (e.key === "Home") siguiente = 0;
    else if (e.key === "End") siguiente = especies.length - 1;
    else return;
    e.preventDefault();
    onSeleccionar(especies[siguiente].id);
  }

  return (
    <div className="pokedex-pantalla pokedex-lista">
      <div className="filtros pokedex-filtros">
        <input
          type="search"
          placeholder="Buscar por nombre"
          aria-label="Buscar especie"
          value={filtros.q}
          onChange={(e) => onFiltros({ ...filtros, q: e.target.value })}
        />
        <select aria-label="Filtrar por tipo" value={filtros.tipo} onChange={(e) => onFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por categoría"
          value={filtros.categoria}
          onChange={(e) => onFiltros({ ...filtros, categoria: e.target.value })}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select aria-label="Filtrar por estado" value={filtros.estado} onChange={(e) => onFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todas</option>
          <option value="activo">Activas</option>
          <option value="inactivo">Inactivas</option>
        </select>
        <input
          type="number"
          placeholder="Gen."
          aria-label="Filtrar por generación"
          min={0}
          max={99}
          value={filtros.generacion}
          onChange={(e) => onFiltros({ ...filtros, generacion: e.target.value })}
        />
        <select aria-label="Orden" value={filtros.orden} onChange={(e) => onFiltros({ ...filtros, orden: e.target.value })}>
          <option value="dex">Por dex</option>
          <option value="nombre">Por nombre</option>
        </select>
      </div>
      <p className="pokedex-conteo" aria-live="polite">
        {especies.length} especie{especies.length === 1 ? "" : "s"}
      </p>
      <ul
        ref={listaRef}
        className="pokedex-filas"
        role="listbox"
        aria-label="Especies"
        tabIndex={0}
        aria-activedescendant={seleccionadaId ? `especie-${seleccionadaId}` : undefined}
        onKeyDown={teclado}
      >
        {especies.map((e) => (
          <li
            key={e.id}
            id={`especie-${e.id}`}
            data-id={e.id}
            role="option"
            aria-selected={e.id === seleccionadaId}
            className={`pokedex-fila${e.id === seleccionadaId ? " seleccionada" : ""}${e.activo ? "" : " inactiva"}`}
            onClick={() => onSeleccionar(e.id)}
          >
            <span className="pokedex-fila-dex">{formatearDex(Number(e.dex))}</span>
            {e.sprite_url ? (
              <img className="pokedex-sprite pequeno" src={e.sprite_url} alt="" loading="lazy" />
            ) : (
              <span className="pokedex-sprite pequeno vacio" aria-hidden>
                ?
              </span>
            )}
            <span className="pokedex-fila-nombre">{e.nombre}</span>
            <span className="pokedex-fila-tipos">
              <BadgeTipo id={e.tipo_i} nombre={nombreTipo(e.tipo_i)} />
              {e.tipo_ii != null && <BadgeTipo id={e.tipo_ii} nombre={nombreTipo(e.tipo_ii)} />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
