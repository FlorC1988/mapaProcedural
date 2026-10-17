import { useCallback, useEffect, useState } from "react";
import { api, ErrorApi, type Ataque, type CategoriaEspecie, type Especie, type TipoGimnasio } from "../api";
import FichaPokedex from "../pokedex/FichaPokedex";
import FormularioEspecie from "../pokedex/FormularioEspecie";
import ListaPokedex, { type FiltrosPokedex } from "../pokedex/ListaPokedex";

const FILTROS_INICIALES: FiltrosPokedex = { q: "", estado: "", tipo: "", categoria: "", generacion: "", orden: "dex" };

// Pokédex: lista + ficha de detalle con edición en modal (RF-PKM-004).
export default function EspeciesAdmin({
  tipos,
  categorias,
  ataques,
  onCambio,
}: {
  tipos: TipoGimnasio[];
  categorias: CategoriaEspecie[];
  ataques: Ataque[];
  onCambio: () => void;
}) {
  const [especies, setEspecies] = useState<Especie[] | null>(null);
  const [todas, setTodas] = useState<Especie[]>([]);
  const [filtros, setFiltros] = useState<FiltrosPokedex>(FILTROS_INICIALES);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Especie | "nuevo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    Promise.all([api.especies(filtros), api.especies()])
      .then(([filtradas, completas]) => {
        setEspecies(filtradas);
        setTodas(completas);
        setError(null);
      })
      .catch(() => setError("No se pudieron cargar las especies."));
  }, [filtros]);

  useEffect(cargar, [cargar]);

  // Si la selección deja de estar en la lista filtrada, pasa a la primera.
  useEffect(() => {
    if (!especies) return;
    if (!especies.some((e) => e.id === seleccionadaId)) {
      setSeleccionadaId(especies[0]?.id ?? null);
    }
  }, [especies, seleccionadaId]);

  const seleccionada = especies?.find((e) => e.id === seleccionadaId) ?? todas.find((e) => e.id === seleccionadaId) ?? null;

  const buscarPorNombre = (nombre: string) =>
    todas.find((e) => e.nombre.toLowerCase() === nombre.trim().toLowerCase());

  // Al navegar por la cadena evolutiva hacia una especie fuera del filtro, se limpian los filtros.
  function seleccionar(id: string) {
    if (especies && !especies.some((e) => e.id === id) && todas.some((e) => e.id === id)) {
      setFiltros(FILTROS_INICIALES);
    }
    setSeleccionadaId(id);
  }

  async function alternarActivo(e: Especie) {
    setError(null);
    try {
      await api.actualizarEspecie(e.id, { ...e, activo: !e.activo });
      cargar();
      onCambio();
    } catch (err) {
      setError(err instanceof ErrorApi ? `${err.causa} ${err.accion ?? ""}` : "No se pudo cambiar el estado.");
    }
  }

  return (
    <div className="pokedex">
      <header className="pokedex-cabecera">
        <span className="pokedex-leds" aria-hidden>
          <span className="led grande" />
          <span className="led rojo" />
          <span className="led amarillo" />
          <span className="led verde" />
        </span>
        <h2 id="titulo-pokedex" className="pokedex-titulo">
          Pokédex
        </h2>
        <button type="button" className="pokedex-nueva" onClick={() => setEditando("nuevo")}>
          Nueva especie
        </button>
      </header>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <div className="pokedex-pantallas">
        <ListaPokedex
          especies={especies ?? []}
          tipos={tipos}
          categorias={categorias}
          filtros={filtros}
          seleccionadaId={seleccionadaId}
          onFiltros={setFiltros}
          onSeleccionar={setSeleccionadaId}
        />
        <FichaPokedex
          especie={seleccionada}
          tipos={tipos}
          categorias={categorias}
          ataques={ataques}
          buscarPorNombre={buscarPorNombre}
          onSeleccionar={seleccionar}
          onEditar={setEditando}
          onAlternarActivo={alternarActivo}
        />
      </div>
      {editando && (
        <FormularioEspecie
          especie={editando}
          tipos={tipos}
          categorias={categorias}
          ataques={ataques}
          onGuardado={() => {
            setEditando(null);
            cargar();
            onCambio();
          }}
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  );
}
