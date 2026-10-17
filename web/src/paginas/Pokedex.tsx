import { useCallback, useEffect, useState } from "react";
import {
  api,
  ErrorApi,
  type Ataque,
  type CategoriaEspecie,
  type TipoGimnasio,
} from "../api";
import EspeciesAdmin from "../admin/EspeciesAdmin";

export default function Pokedex() {
  const [tipos, setTipos] = useState<TipoGimnasio[] | null>(null);
  const [categorias, setCategorias] = useState<CategoriaEspecie[] | null>(null);
  const [ataques, setAtaques] = useState<Ataque[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    Promise.all([api.tiposGimnasio(), api.categoriasEspecie(), api.ataques()])
      .then(([t, c, a]) => {
        setTipos(t);
        setCategorias(c);
        setAtaques(a);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(
          e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudieron cargar los datos de la Pokédex."
        );
      });
  }, []);

  useEffect(cargar, [cargar]);

  return (
    <section aria-labelledby="titulo-pokedex">
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      {tipos && categorias && ataques && (
        <EspeciesAdmin tipos={tipos} categorias={categorias} ataques={ataques} onCambio={cargar} />
      )}
    </section>
  );
}
