import { useEffect, useRef, useState } from "react";
import { api, ErrorApi, type AtaqueInicialElegible, type EspecieElegible, type RespuestaElegibles } from "../api";
import Modal from "./Modal";
import BadgeTipo from "../pokedex/BadgeTipo";
import { formatearDex } from "../pokedex/tipos";
import { sortearAtaqueInicial, sortearEspecie, spriteShiny, tirarShiny } from "../pokedex/encuentro";

interface Encuentro {
  especie: EspecieElegible;
  ataque: AtaqueInicialElegible | null;
  shiny: boolean;
}

// Encuentro efímero desde una celda (DEC-106): no se persiste ni entra al snapshot.
export default function EncuentroPokemon({
  biomaId,
  biomaNombre,
  tipos,
}: {
  biomaId: string;
  biomaNombre: string;
  tipos: { id: number; nombre: string }[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState<RespuestaElegibles | null>(null);
  const [encuentro, setEncuentro] = useState<Encuentro | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  function sortear(d: RespuestaElegibles) {
    audioRef.current?.pause();
    audioRef.current = null;
    const especie = sortearEspecie(d.especies);
    setEncuentro(especie
      ? { especie, ataque: sortearAtaqueInicial(especie.ataques_iniciales), shiny: tirarShiny(especie.prob_shiny) }
      : null);
    // El grito suena al aparecer (DEC-106); si el navegador bloquea el
    // autoplay queda el botón de reproducción manual.
    if (especie?.grito_url) {
      audioRef.current = new Audio(especie.grito_url);
      void audioRef.current.play().catch(() => undefined);
    }
  }

  async function buscar() {
    setAbierto(true);
    setCargando(true);
    setError(null);
    setEncuentro(null);
    try {
      // Se pide de nuevo en cada apertura para reflejar cambios de catálogo.
      const d = await api.especiesElegibles(biomaId);
      setDatos(d);
      sortear(d);
    } catch (e) {
      setDatos(null);
      setError(e instanceof ErrorApi ? e.causa : "No se pudo contactar al servidor.");
    } finally {
      setCargando(false);
    }
  }

  function reproducirGrito(url: string) {
    audioRef.current?.pause();
    audioRef.current = new Audio(url);
    void audioRef.current.play().catch(() => undefined);
  }

  function cerrar() {
    audioRef.current?.pause();
    setAbierto(false);
  }

  const nombreTipo = (id: number) => tipos.find((t) => t.id === id)?.nombre ?? String(id);
  const e = encuentro?.especie;
  const sprite = e ? (encuentro.shiny ? spriteShiny(e.sprite_url) ?? e.sprite_url : e.sprite_url) : null;

  return (
    <>
      <button type="button" className="boton-encuentro" onClick={() => void buscar()}>
        Buscar pokémon
      </button>
      <Modal abierto={abierto} titulo={`Encuentro en ${biomaNombre}`} onCerrar={cerrar} className="modal-pokedex modal-encuentro" sinTitulo>
        <div className="modal-pokedex-cabecera">
          <div className="pokedex-leds" aria-hidden="true">
            <span className="led grande" />
            <span className="led rojo" />
            <span className="led amarillo" />
            <span className="led verde" />
          </div>
          <h3 className="pokedex-titulo">{`Encuentro en ${biomaNombre}`}</h3>
          <button type="button" className="modal-pokedex-cerrar" onClick={cerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {error && (
          <div className="aviso-error" role="alert">
            {error}
          </div>
        )}
        <div className="pokedex-pantalla pokedex-ficha encuentro" aria-live="polite">
          {cargando && <p className="ayuda">Buscando…</p>}
          {!cargando && !error && datos && !e && (
            <p className="ayuda">
              {datos.tiposHabilitados === 0
                ? `El bioma ${biomaNombre} no tiene tipos habilitados. Configuralos en Administración > Aparición por bioma.`
                : `Ninguna especie activa de los tipos habilitados en ${biomaNombre} tiene probabilidad de aparición cargada. Cargala desde la Pokédex.`}
            </p>
          )}
          {!cargando && e && (
            <>
              <header className="pokedex-ficha-cabecera">
                <span className="pokedex-ficha-dex">{formatearDex(e.dex)}</span>
                {encuentro.shiny && <span className="pokedex-estado encuentro-shiny">✨ Shiny</span>}
              </header>
              <div className="pokedex-ficha-principal">
                {sprite ? (
                  <img className="pokedex-sprite grande" src={sprite} alt={`Sprite de ${e.nombre}`} />
                ) : (
                  <span className="pokedex-sprite grande vacio" aria-label="Sin sprite">
                    ?
                  </span>
                )}
                <div className="pokedex-ficha-identidad">
                  <h3 className="pokedex-nombre encuentro-nombre">{e.nombre}</h3>
                  <div className="pokedex-tipos">
                    <BadgeTipo id={e.tipo_i} nombre={nombreTipo(e.tipo_i)} />
                    {e.tipo_ii != null && <BadgeTipo id={e.tipo_ii} nombre={nombreTipo(e.tipo_ii)} />}
                  </div>
                  {e.grito_url && (
                    <button type="button" className="pokedex-grito" onClick={() => reproducirGrito(e.grito_url!)}>
                      ▶ Reproducir grito
                    </button>
                  )}
                </div>
              </div>
              {encuentro.ataque && (
                <p className="encuentro-ataque">
                  <span className="pokedex-etiqueta">Ataque inicial:</span> {encuentro.ataque.nombre}
                  <BadgeTipo id={encuentro.ataque.tipo_id} nombre={nombreTipo(encuentro.ataque.tipo_id)} />
                  {encuentro.ataque.danio != null && <span className="encuentro-danio"> {encuentro.ataque.danio} daño</span>}
                </p>
              )}
            </>
          )}
        </div>
        <div className="acciones">
          {e && datos && (
            <button type="button" onClick={() => sortear(datos)}>
              Buscar otro
            </button>
          )}
          <button type="button" onClick={cerrar}>
            Cerrar
          </button>
        </div>
      </Modal>
    </>
  );
}
