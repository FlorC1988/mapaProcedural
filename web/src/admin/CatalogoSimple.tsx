import { useState } from "react";
import { ErrorApi } from "../api";
import Modal from "../componentes/Modal";

export interface ItemCatalogo {
  id: string;
  nombre: string;
  activo: boolean;
  version: number;
  usos?: number;
}

// Catálogo simple nombre + activo con concurrencia optimista (expansión Pokémon).
export default function CatalogoSimple({
  titulo,
  singular,
  items,
  onCrear,
  onGuardar,
}: {
  titulo: string;
  singular: string;
  items: ItemCatalogo[];
  onCrear: (nombre: string) => Promise<unknown>;
  onGuardar: (id: string, datos: { nombre: string; activo: boolean; version: number }) => Promise<unknown>;
}) {
  const [editando, setEditando] = useState<ItemCatalogo | "nuevo" | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function abrir(item: ItemCatalogo | "nuevo") {
    setEditando(item);
    setNombre(item === "nuevo" ? "" : item.nombre);
    setError(null);
  }

  async function guardar() {
    setOcupado(true);
    setError(null);
    try {
      if (editando === "nuevo") {
        await onCrear(nombre);
      } else if (editando) {
        await onGuardar(editando.id, { nombre, activo: editando.activo, version: editando.version });
      }
      setEditando(null);
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : `No se pudo guardar: ${singular}.`);
    } finally {
      setOcupado(false);
    }
  }

  async function alternarActivo(item: ItemCatalogo) {
    setError(null);
    try {
      await onGuardar(item.id, { nombre: item.nombre, activo: !item.activo, version: item.version });
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo cambiar el estado.");
    }
  }

  return (
    <>
      <h3>{titulo}</h3>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            {items.some((i) => i.usos !== undefined) && <th>Usos</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.nombre}</td>
              <td>{i.activo ? "Activo" : "Inactivo"}</td>
              {items.some((x) => x.usos !== undefined) && <td>{i.usos ?? ""}</td>}
              <td className="acciones">
                <button type="button" onClick={() => abrir(i)}>
                  Editar
                </button>
                <button type="button" onClick={() => alternarActivo(i)}>
                  {i.activo ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => abrir("nuevo")}>
        Nuevo: {singular}
      </button>
      {editando && (
        <Modal
          abierto
          titulo={editando === "nuevo" ? `Nuevo: ${singular}` : `Editar ${editando.nombre}`}
          onCerrar={() => setEditando(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void guardar();
            }}
          >
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} />
            </label>
            <div className="editor-fila">
              <button type="submit" disabled={ocupado}>
                Guardar
              </button>
              <button type="button" onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
