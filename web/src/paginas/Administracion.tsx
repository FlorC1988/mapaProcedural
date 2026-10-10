import { useCallback, useEffect, useState } from "react";
import { api, ErrorApi, type Bioma, type TipoGimnasio, type DefinicionMicrobioma } from "../api";
import BiomasAdmin from "../admin/BiomasAdmin";
import TiposAdmin from "../admin/TiposAdmin";
import MicrobiomasAdmin from "../admin/MicrobiomasAdmin";

export default function Administracion() {
  const [biomas, setBiomas] = useState<Bioma[] | null>(null);
  const [tipos, setTipos] = useState<TipoGimnasio[] | null>(null);
  const [microbiomas, setMicrobiomas] = useState<DefinicionMicrobioma[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    Promise.all([api.biomas(), api.tiposGimnasio(), api.microbiomas()])
      .then(([b, t, m]) => {
        setBiomas(b);
        setTipos(t);
        setMicrobiomas(m);
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
    </section>
  );
}
