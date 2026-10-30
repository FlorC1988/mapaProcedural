import { useEffect, useRef, useState } from "react";
import { api, ErrorApi, type EspecieElegible, type RespuestaElegibles } from "../api";
import Modal from "./Modal";
import BadgeTipo from "../pokedex/BadgeTipo";
import { formatearDex } from "../pokedex/tipos";
import { sortearEspecie, spriteShiny, tirarShiny } from "../pokedex/encuentro";

interface Encuentro {
  especie: EspecieElegible;
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
    setEncuentro(especie ? { especie, shiny: tirarShiny(especie.prob_shiny) } : null);
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
      <Modal abierto={abierto} titulo={`Encuentro en ${biomaNombre}`} onCerrar={cerrar} className="modal-encuentro">
        {cargando && <p className="ayuda">Buscando…</p>}
        {error && (
          <div className="aviso-error" role="alert">
            {error}
          </div>
        )}
        {!cargando && !error && datos && !e && (
          <p className="ayuda">
            {datos.tiposHabilitados === 0
              ? `El bioma ${biomaNombre} no tiene tipos habilitados. Configuralos en Administración > Aparición por bioma.`
              : `Ninguna especie activa de los tipos habilitados en ${biomaNombre} tiene probabilidad de aparición cargada. Cargala desde la Pokédex.`}
          </p>
        )}
        {!cargando && e && (
          <div className="encuentro" aria-live="polite">
            {sprite ? (
              <img className="pokedex-sprite encuentro-sprite" src={sprite} alt={`Sprite de ${e.nombre}`} />
            ) : (
              <span className="pokedex-sprite encuentro-sprite vacio" aria-label="Sin sprite">
                ?
              </span>
            )}
            <span className="encuentro-dex">{formatearDex(e.dex)}</span>
            <strong className="encuentro-nombre">
              {e.nombre}
              {encuentro.shiny && <span className="encuentro-shiny"> ✨ Shiny</span>}
            </strong>
            <div className="pokedex-tipos">
              <BadgeTipo id={e.tipo_i} nombre={nombreTipo(e.tipo_i)} />
              {e.tipo_ii != null && <BadgeTipo id={e.tipo_ii} nombre={nombreTipo(e.tipo_ii)} />}
            </div>
          </div>
        )}
        <div className="acciones">
          {e?.grito_url && (
            <button type="button" onClick={() => reproducirGrito(e.grito_url!)}>
              ▶ Grito
            </button>
          )}
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
