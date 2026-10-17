import { useEffect, useRef, useState } from "react";
import type { Ataque, CategoriaEspecie, Especie, TipoGimnasio } from "../api";
import BadgeTipo from "./BadgeTipo";
import { formatearDex, formatearPorcentaje } from "./tipos";

// Pantalla derecha de la Pokédex: ficha de la especie seleccionada.
export default function FichaPokedex({
  especie,
  tipos,
  categorias,
  ataques,
  buscarPorNombre,
  onSeleccionar,
  onEditar,
  onAlternarActivo,
}: {
  especie: Especie | null;
  tipos: TipoGimnasio[];
  categorias: CategoriaEspecie[];
  ataques: Ataque[];
  buscarPorNombre: (nombre: string) => Especie | undefined;
  onSeleccionar: (id: string) => void;
  onEditar: (e: Especie) => void;
  onAlternarActivo: (e: Especie) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [gritoError, setGritoError] = useState(false);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setGritoError(false);
  }, [especie?.id]);

  if (!especie) {
    return (
      <div className="pokedex-pantalla pokedex-ficha pokedex-ficha-vacia">
        <p>Seleccioná una especie de la lista.</p>
      </div>
    );
  }

  const nombreTipo = (id: number) => tipos.find((t) => t.id === id)?.nombre ?? String(id);
  const nombreCategoria = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? id;
  const ataqueInicial = especie.ataque_inicial_id
    ? ataques.find((a) => a.id === especie.ataque_inicial_id)?.nombre ?? "—"
    : "—";

  function reproducirGrito() {
    if (!especie?.grito_url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(especie.grito_url);
      audioRef.current.onerror = () => setGritoError(true);
    }
    audioRef.current.currentTime = 0;
    void audioRef.current.play().catch(() => setGritoError(true));
  }

  // Un eslabón de la cadena evolutiva: enlace si la especie existe en el catálogo cargado.
  const eslabon = (nombre: string | null, actual = false) => {
    if (!nombre) return null;
    if (actual) return <strong className="pokedex-evo-actual">{nombre}</strong>;
    const destino = buscarPorNombre(nombre);
    return destino ? (
      <button type="button" className="enlace" onClick={() => onSeleccionar(destino.id)}>
        {nombre}
      </button>
    ) : (
      <span>{nombre}</span>
    );
  };

  const metadatos = [
    ...especie.categorias.map(nombreCategoria),
    especie.generacion != null ? `Gen ${especie.generacion}` : null,
    especie.etapa,
  ].filter(Boolean);

  return (
    <div className="pokedex-pantalla pokedex-ficha">
      <header className="pokedex-ficha-cabecera">
        <span className="pokedex-ficha-dex">{formatearDex(Number(especie.dex))}</span>
        <span className={`pokedex-estado${especie.activo ? "" : " inactiva"}`}>
          {especie.activo ? "Activa" : "Inactiva"}
        </span>
      </header>

      <div className="pokedex-ficha-principal">
        {especie.sprite_url ? (
          <img className="pokedex-sprite grande" src={especie.sprite_url} alt={`Sprite de ${especie.nombre}`} />
        ) : (
          <span className="pokedex-sprite grande vacio" aria-label="Sin sprite">
            ?
          </span>
        )}
        <div className="pokedex-ficha-identidad">
          <h3 className="pokedex-nombre">{especie.nombre}</h3>
          <div className="pokedex-tipos">
            <BadgeTipo id={especie.tipo_i} nombre={nombreTipo(especie.tipo_i)} />
            {especie.tipo_ii != null && <BadgeTipo id={especie.tipo_ii} nombre={nombreTipo(especie.tipo_ii)} />}
          </div>
          {metadatos.length > 0 && <p className="pokedex-meta">{metadatos.join(" · ")}</p>}
          <button
            type="button"
            className="pokedex-grito"
            onClick={reproducirGrito}
            disabled={!especie.grito_url || gritoError}
            title={gritoError ? "No se pudo reproducir el grito" : undefined}
          >
            ▶ Reproducir grito
          </button>
        </div>
      </div>

      <section className="pokedex-seccion" aria-label="Datos de juego">
        <dl className="pokedex-stats">
          <div>
            <dt>HP</dt>
            <dd>{especie.hp ?? "—"}</dd>
          </div>
          <div>
            <dt>Iniciativa</dt>
            <dd>{especie.iniciativa ?? "—"}</dd>
          </div>
          <div>
            <dt>Ptos. evolución</dt>
            <dd>{especie.puntos_evolucion ?? "—"}</dd>
          </div>
        </dl>
        <p>
          <span className="pokedex-etiqueta">Ataque inicial:</span> {ataqueInicial}
        </p>
        <p className="pokedex-tipos-ataque">
          <span className="pokedex-etiqueta">Tipos de ataque:</span>{" "}
          {especie.tipos_ataque.length === 0
            ? "—"
            : especie.tipos_ataque.map((t) => <BadgeTipo key={t} id={t} nombre={nombreTipo(t)} />)}
        </p>
      </section>

      <section className="pokedex-seccion" aria-label="Evolución y aparición">
        <p className="pokedex-evolucion">
          <span className="pokedex-etiqueta">Evolución:</span>{" "}
          {!especie.preevolucion && !especie.evolucion ? (
            "No evoluciona"
          ) : (
            <>
              {eslabon(especie.preevolucion)}
              {especie.preevolucion && " → "}
              {eslabon(especie.nombre, true)}
              {especie.evolucion && " → "}
              {especie.evolucion
                ?.split(",")
                .map((n) => n.trim())
                .filter(Boolean)
                .map((n, i) => (
                  <span key={n}>
                    {i > 0 && " / "}
                    {eslabon(n)}
                  </span>
                ))}
            </>
          )}
        </p>
        <dl className="pokedex-stats">
          <div>
            <dt>Aparición</dt>
            <dd>{formatearPorcentaje(especie.prob_aparicion)}</dd>
          </div>
          <div>
            <dt>Shiny</dt>
            <dd>{formatearPorcentaje(especie.prob_shiny)}</dd>
          </div>
        </dl>
      </section>

      <footer className="pokedex-acciones">
        <button type="button" onClick={() => onEditar(especie)}>
          Editar
        </button>
        <button type="button" onClick={() => onAlternarActivo(especie)}>
          {especie.activo ? "Desactivar" : "Activar"}
        </button>
      </footer>
    </div>
  );
}
