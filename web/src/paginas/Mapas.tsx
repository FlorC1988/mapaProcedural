import { useCallback, useEffect, useState } from "react";
import { api, ErrorApi, type ResumenMapa } from "../api";
import VistaMapa, { datosDesdeGuardado, type DatosMapa } from "../componentes/VistaMapa";

const ORDENES = [
  { id: "modificacion", nombre: "Última modificación" },
  { id: "creacion", nombre: "Creación" },
  { id: "nombre", nombre: "Nombre" },
] as const;

export default function Mapas() {
  const [lista, setLista] = useState<ResumenMapa[] | null>(null);
  const [buscar, setBuscar] = useState("");
  const [orden, setOrden] = useState<string>("modificacion");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [abierto, setAbierto] = useState<DatosMapa | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api
      .listarMapas(buscar, orden, dir)
      .then(setLista)
      .catch((e: unknown) =>
        setError(e instanceof ErrorApi ? e.causa : "No se pudo cargar el listado.")
      );
  }, [buscar, orden, dir]);

  useEffect(() => {
    const t = setTimeout(cargar, 200); // búsqueda con pequeño debounce
    return () => clearTimeout(t);
  }, [cargar]);

  function abrir(id: string) {
    api
      .obtenerMapa(id)
      .then((m) => setAbierto(datosDesdeGuardado(m)))
      .catch((e: unknown) =>
        setError(e instanceof ErrorApi ? e.causa : "No se pudo abrir el mapa.")
      );
  }

  if (abierto) {
    return (
      <section aria-labelledby="titulo-mapa">
        <button
          type="button"
          onClick={() => {
            setAbierto(null);
            cargar();
          }}
        >
          ← Volver al listado
        </button>
        <VistaMapa
          datos={abierto}
          onCambio={(d) => {
            setAbierto(d);
            if (d === null) cargar();
          }}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-mapas">
      <h2 id="titulo-mapas">Mapas guardados</h2>
      <div className="visor-controles">
        <label htmlFor="buscar-mapa">Buscar</label>
        <input
          id="buscar-mapa"
          type="search"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Nombre del mapa"
        />
        <label htmlFor="orden-mapa">Ordenar por</label>
        <select id="orden-mapa" value={orden} onChange={(e) => setOrden(e.target.value)}>
          {ORDENES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}>
          {dir === "asc" ? "↑ Ascendente" : "↓ Descendente"}
        </button>
      </div>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      {lista && (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Creado</th>
              <th>Modificado</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={3}>No hay mapas guardados.</td>
              </tr>
            )}
            {lista.map((m) => (
              <tr key={m.id}>
                <td>
                  <button type="button" className="enlace" onClick={() => abrir(m.id)}>
                    {m.nombre}
                  </button>
                </td>
                <td>{new Date(m.creadoEn).toLocaleString()}</td>
                <td>{new Date(m.modificadoEn).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
