import { useCallback, useEffect, useState } from "react";
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
import BiomasAdmin from "../admin/BiomasAdmin";
import TiposAdmin from "../admin/TiposAdmin";
import MicrobiomasAdmin from "../admin/MicrobiomasAdmin";
import CatalogoSimple from "../admin/CatalogoSimple";
import AtaquesAdmin from "../admin/AtaquesAdmin";
import EspeciesAdmin from "../admin/EspeciesAdmin";
import AparicionAdmin from "../admin/AparicionAdmin";

export default function Administracion() {
  const [biomas, setBiomas] = useState<Bioma[] | null>(null);
  const [tipos, setTipos] = useState<TipoGimnasio[] | null>(null);
  const [microbiomas, setMicrobiomas] = useState<DefinicionMicrobioma[] | null>(null);
  const [estados, setEstados] = useState<EstadoAlterado[] | null>(null);
  const [categorias, setCategorias] = useState<CategoriaEspecie[] | null>(null);
  const [ataquesBase, setAtaquesBase] = useState<Ataque[] | null>(null);
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
        setAtaquesBase(a);
        setApariciones(ap);
      })
      .catch((e: unknown) => {
        setError(
          e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudieron cargar los catálogos."
        );
      });
  }, []);

  useEffect(cargar, [cargar]);

  return (
    <section aria-labelledby="titulo-admin">
      <h2 id="titulo-admin">Administración de catálogos</h2>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      {biomas && <BiomasAdmin biomas={biomas} onCambio={cargar} />}
      {tipos && biomas && <TiposAdmin tipos={tipos} biomas={biomas} onCambio={cargar} />}
      {microbiomas && biomas && (
        <MicrobiomasAdmin biomas={biomas} microbiomas={microbiomas} onCambio={cargar} />
      )}

      <h2>Pokémon</h2>
      {estados && (
        <CatalogoSimple
          titulo="Estados alterados"
          singular="estado"
          items={estados}
          onCrear={api.crearEstadoAlterado}
          onGuardar={api.actualizarEstadoAlterado}
        />
      )}
      {categorias && (
        <CatalogoSimple
          titulo="Categorías de especie"
          singular="categoría"
          items={categorias}
          onCrear={api.crearCategoriaEspecie}
          onGuardar={api.actualizarCategoriaEspecie}
        />
      )}
      {tipos && estados && <AtaquesAdmin tipos={tipos} estados={estados} onCambio={cargar} />}
      {tipos && categorias && ataquesBase && (
        <EspeciesAdmin tipos={tipos} categorias={categorias} ataques={ataquesBase} onCambio={cargar} />
      )}
      {biomas && tipos && apariciones && (
        <AparicionAdmin biomas={biomas} tipos={tipos} apariciones={apariciones} onCambio={cargar} />
      )}
    </section>
  );
}
