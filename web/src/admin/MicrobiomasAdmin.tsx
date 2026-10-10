import { useEffect, useState } from "react";
import { api, ErrorApi, type Bioma, type DefinicionMicrobioma } from "../api";
import EditorMicrobioma from "./EditorMicrobioma";

export default function MicrobiomasAdmin({
  biomas,
  microbiomas,
  onCambio,
}: {
  biomas: Bioma[];
  microbiomas: DefinicionMicrobioma[];
  onCambio: () => void;
}) {
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const [orden, setOrden] = useState<"asc" | "desc">("asc");
  const [lista, setLista] = useState(microbiomas);
  const [editando, setEditando] = useState<DefinicionMicrobioma | "nuevo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .microbiomas(buscar, estado, orden)
        .then(setLista)
        .catch(() => setError("No se pudo cargar el listado."));
    }, 250);
    return () => clearTimeout(t);
  }, [buscar, estado, orden, microbiomas]);

  async function alternarActivo(m: DefinicionMicrobioma) {
    setError(null);
    try {
      await api.actualizarMicrobioma(m.id, {
        nombre: m.nombre,
        activo: !m.activo,
        celdas: m.celdas,
        version: m.version,
      });
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo cambiar el estado.");
    }
  }

  if (editando) {
    return (
      <EditorMicrobioma
        definicion={editando === "nuevo" ? null : editando}
        biomas={biomas}
        onGuardado={onCambio}
        onCerrar={() => setEditando(null)}
      />
    );
  }

  return (
    <>
      <h3>Definiciones de microbioma</h3>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <div className="editor-fila">
        <input
          type="search"
          placeholder="Buscar por nombre"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          aria-label="Buscar definición por nombre"
        />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todas</option>
          <option value="activo">Activas</option>
          <option value="inactivo">Inactivas</option>
        </select>
        <button type="button" onClick={() => setOrden((o) => (o === "asc" ? "desc" : "asc"))}>
          Nombre {orden === "asc" ? "↑" : "↓"}
        </button>
        <button type="button" onClick={() => setEditando("nuevo")}>
          Nueva definición
        </button>
      </div>
      {lista.length === 0 ? (
        <p>No hay definiciones que coincidan.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Celdas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id}>
                <td>{m.nombre}</td>
                <td>{m.activo ? "Activa" : "Inactiva"}</td>
                <td>{m.celdas.length}</td>
                <td className="acciones">
                  <button type="button" onClick={() => setEditando(m)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => alternarActivo(m)}>
                    {m.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
