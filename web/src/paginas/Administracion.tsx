import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import {
  api,
  ErrorApi,
  type AparicionBioma,
  type Ataque,
  type Bioma,
  type CategoriaEspecie,
  type DefinicionMicrobioma,
  type EstadoAlterado,
  type TipoGimnasio,
} from "../api";
import AparicionAdmin from "../admin/AparicionAdmin";
import AtaquesAdmin from "../admin/AtaquesAdmin";
import BiomasAdmin from "../admin/BiomasAdmin";
import CatalogoSimple from "../admin/CatalogoSimple";
import MicrobiomasAdmin from "../admin/MicrobiomasAdmin";
import TiposAdmin from "../admin/TiposAdmin";

type Seccion = "biomas" | "tipos" | "microbiomas" | "ataques" | "estados" | "categorias" | "aparicion";

const SECCIONES: { id: Seccion; etiqueta: string }[] = [
  { id: "biomas", etiqueta: "Biomas" },
  { id: "tipos", etiqueta: "Tipos" },
  { id: "microbiomas", etiqueta: "Microbiomas" },
  { id: "ataques", etiqueta: "Ataques" },
  { id: "estados", etiqueta: "Estados alterados" },
  { id: "categorias", etiqueta: "Categorías" },
  { id: "aparicion", etiqueta: "Aparición" },
];

export default function Administracion() {
  const [seccion, setSeccion] = useState<Seccion>("biomas");
  const [biomas, setBiomas] = useState<Bioma[] | null>(null);
  const [tipos, setTipos] = useState<TipoGimnasio[] | null>(null);
  const [microbiomas, setMicrobiomas] = useState<DefinicionMicrobioma[] | null>(null);
  const [estados, setEstados] = useState<EstadoAlterado[] | null>(null);
  const [categorias, setCategorias] = useState<CategoriaEspecie[] | null>(null);
  const [ataques, setAtaques] = useState<Ataque[] | null>(null);
  const [apariciones, setApariciones] = useState<AparicionBioma[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    Promise.all([
      api.biomas(),
      api.tiposGimnasio(),
      api.microbiomas(),
      api.estadosAlterados(),
      api.categoriasEspecie(),
      api.ataques(),
      api.apariciones(),
    ])
      .then(([b, t, m, e, c, a, ap]) => {
        setBiomas(b);
        setTipos(t);
        setMicrobiomas(m);
        setEstados(e);
        setCategorias(c);
        setAtaques(a);
        setApariciones(ap);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(
          e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudieron cargar los catálogos."
        );
      });
  }, []);

  useEffect(cargar, [cargar]);

  function navegarPestanas(e: KeyboardEvent<HTMLButtonElement>, indice: number) {
    let siguiente = indice;
    if (e.key === "ArrowRight") siguiente = (indice + 1) % SECCIONES.length;
    else if (e.key === "ArrowLeft") siguiente = (indice - 1 + SECCIONES.length) % SECCIONES.length;
    else if (e.key === "Home") siguiente = 0;
    else if (e.key === "End") siguiente = SECCIONES.length - 1;
    else return;
    e.preventDefault();
    setSeccion(SECCIONES[siguiente].id);
    document.getElementById(`pestana-${SECCIONES[siguiente].id}`)?.focus();
  }

  async function crearEstado(nombre: string) {
    await api.crearEstadoAlterado(nombre);
    cargar();
  }

  async function guardarEstado(id: string, datos: { nombre: string; activo: boolean; version: number }) {
    await api.actualizarEstadoAlterado(id, datos);
    cargar();
  }

  async function crearCategoria(nombre: string) {
    await api.crearCategoriaEspecie(nombre);
    cargar();
  }

  async function guardarCategoria(id: string, datos: { nombre: string; activo: boolean; version: number }) {
    await api.actualizarCategoriaEspecie(id, datos);
    cargar();
  }

  return (
    <section aria-labelledby="titulo-admin">
      <h2 id="titulo-admin">Administración de catálogos</h2>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <div className="pestanas-admin" role="tablist" aria-label="Secciones de administración">
        {SECCIONES.map((item, indice) => (
          <button
            key={item.id}
            id={`pestana-${item.id}`}
            type="button"
            role="tab"
            aria-selected={seccion === item.id}
            aria-controls="panel-admin"
            tabIndex={seccion === item.id ? 0 : -1}
            onClick={() => setSeccion(item.id)}
            onKeyDown={(e) => navegarPestanas(e, indice)}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>
      <div id="panel-admin" className="panel-admin" role="tabpanel" aria-labelledby={`pestana-${seccion}`}>
        {seccion === "biomas" && biomas && <BiomasAdmin biomas={biomas} onCambio={cargar} />}
        {seccion === "tipos" && tipos && biomas && (
          <TiposAdmin tipos={tipos} biomas={biomas} onCambio={cargar} />
        )}
        {seccion === "microbiomas" && microbiomas && biomas && (
          <MicrobiomasAdmin biomas={biomas} microbiomas={microbiomas} onCambio={cargar} />
        )}
        {seccion === "ataques" && tipos && estados && (
          <AtaquesAdmin tipos={tipos} estados={estados} onCambio={cargar} />
        )}
        {seccion === "estados" && estados && (
          <CatalogoSimple
            titulo="Estados alterados"
            singular="estado"
            items={estados}
            onCrear={crearEstado}
            onGuardar={guardarEstado}
          />
        )}
        {seccion === "categorias" && categorias && (
          <CatalogoSimple
            titulo="Categorías de especie"
            singular="categoría"
            items={categorias}
            onCrear={crearCategoria}
            onGuardar={guardarCategoria}
          />
        )}
        {seccion === "aparicion" && biomas && tipos && apariciones && (
          <AparicionAdmin biomas={biomas} tipos={tipos} apariciones={apariciones} onCambio={cargar} />
        )}
      </div>
    </section>
  );
}
