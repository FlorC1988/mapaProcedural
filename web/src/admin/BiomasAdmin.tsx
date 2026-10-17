import { useState } from "react";
import { api, ErrorApi, type Bioma } from "../api";
import Modal from "../componentes/Modal";

interface FormBioma {
  nombre: string;
  color: string;
  icono: string;
  incompatibles: Set<string>;
}

export default function BiomasAdmin({
  biomas,
  onCambio,
}: {
  biomas: Bioma[];
  onCambio: () => void;
}) {
  const [editando, setEditando] = useState<Bioma | "nuevo" | null>(null);
  const [form, setForm] = useState<FormBioma>({ nombre: "", color: "#4ade80", icono: "", incompatibles: new Set() });
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function abrirNuevo() {
    setEditando("nuevo");
    setForm({ nombre: "", color: "#4ade80", icono: "", incompatibles: new Set() });
    setError(null);
  }

  function abrirEdicion(b: Bioma) {
    setEditando(b);
    setForm({ nombre: b.nombre, color: b.color, icono: b.icono, incompatibles: new Set(b.incompatibles_con) });
    setError(null);
  }

  async function guardar() {
    setOcupado(true);
    setError(null);
    try {
      if (editando === "nuevo") {
        await api.crearBioma({
          nombre: form.nombre,
          color: form.color,
          icono: form.icono,
          incompatibles_con: [...form.incompatibles],
        });
      } else if (editando) {
        await api.actualizarBioma(editando.id, {
          nombre: form.nombre,
          color: form.color,
          icono: form.icono,
          activo: editando.activo,
          incompatibles_con: [...form.incompatibles],
        });
      }
      setEditando(null);
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo guardar el bioma.");
    } finally {
      setOcupado(false);
    }
  }

  async function alternarActivo(b: Bioma) {
    setError(null);
    try {
      await api.actualizarBioma(b.id, {
        nombre: b.nombre,
        color: b.color,
        icono: b.icono,
        activo: !b.activo,
        incompatibles_con: b.incompatibles_con,
      });
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo cambiar el estado.");
    }
  }

  function alternarIncompatible(id: string) {
    setForm((f) => {
      const s = new Set(f.incompatibles);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return { ...f, incompatibles: s };
    });
  }

  return (
    <>
      <h3>Biomas</h3>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      {!editando && (
        <button type="button" onClick={abrirNuevo}>
          Nuevo bioma
        </button>
      )}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Color</th>
            <th>Icono</th>
            <th>Estado</th>
            <th>Incompatible con</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {biomas.map((b) => (
            <tr key={b.id}>
              <td>{b.nombre}</td>
              <td>
                <span className="muestra-color" style={{ backgroundColor: b.color }} aria-hidden />{" "}
                {b.color}
              </td>
              <td>{b.icono}</td>
              <td>{b.activo ? "Activo" : "Inactivo"}</td>
              <td>
                {b.incompatibles_con
                  .map((id) => biomas.find((o) => o.id === id)?.nombre ?? id)
                  .join(", ") || "—"}
              </td>
              <td className="acciones">
                <button type="button" onClick={() => abrirEdicion(b)}>
                  Editar
                </button>
                <button type="button" onClick={() => alternarActivo(b)}>
                  {b.activo ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editando && (
        <Modal
          abierto
          titulo={editando === "nuevo" ? "Nuevo bioma" : `Editar ${editando.nombre}`}
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
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              maxLength={100}
            />
          </label>
          <label>
            Color
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </label>
          <label>
            Icono
            <input
              value={form.icono}
              onChange={(e) => setForm({ ...form, icono: e.target.value })}
              required
              maxLength={8}
            />
          </label>
          <fieldset>
            <legend>Incompatible con</legend>
            {biomas
              .filter((b) => b.id !== (editando === "nuevo" ? null : editando.id))
              .map((b) => (
                <label key={b.id} className="check">
                  <input
                    type="checkbox"
                    checked={form.incompatibles.has(b.id)}
                    onChange={() => alternarIncompatible(b.id)}
                  />
                  {b.nombre}
                </label>
              ))}
          </fieldset>
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
