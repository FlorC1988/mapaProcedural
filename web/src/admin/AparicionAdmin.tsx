import { useState } from "react";
import { api, ErrorApi, type AparicionBioma, type Bioma, type TipoGimnasio } from "../api";
import Modal from "../componentes/Modal";

// Aparición por bioma: tipos elementales habilitados + flag de tipo II (DEC-098).
export default function AparicionAdmin({
  biomas,
  tipos,
  apariciones,
  onCambio,
}: {
  biomas: Bioma[];
  tipos: TipoGimnasio[];
  apariciones: AparicionBioma[];
  onCambio: () => void;
}) {
  const [editando, setEditando] = useState<Bioma | null>(null);
  const [sel, setSel] = useState<Map<number, boolean>>(new Map()); // tipo_id -> incluyeTipoII
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function abrir(b: Bioma) {
    const m = new Map<number, boolean>();
    for (const a of apariciones.filter((x) => x.bioma_id === b.id)) {
      m.set(a.tipo_id, a.incluyeTipoII);
    }
    setSel(m);
    setEditando(b);
    setError(null);
  }

  async function guardar() {
    if (!editando) return;
    setOcupado(true);
    setError(null);
    try {
      await api.actualizarApariciones(
        editando.id,
        [...sel.entries()].map(([tipo_id, incluyeTipoII]) => ({ tipo_id, incluyeTipoII }))
      );
      setEditando(null);
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo guardar la aparición.");
    } finally {
      setOcupado(false);
    }
  }

  const nombreTipo = (id: number) => tipos.find((t) => t.id === id)?.nombre ?? String(id);

  return (
    <>
      <h3>Aparición por bioma</h3>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Bioma</th>
            <th>Tipos habilitados</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {biomas.map((b) => {
            const filas = apariciones.filter((a) => a.bioma_id === b.id);
            return (
              <tr key={b.id}>
                <td>{b.nombre}</td>
                <td>
                  {filas.length === 0
                    ? "—"
                    : filas
                        .map((a) => `${nombreTipo(a.tipo_id)}${a.incluyeTipoII ? " (+II)" : ""}`)
                        .join(", ")}
                </td>
                <td className="acciones">
                  <button type="button" onClick={() => abrir(b)}>
                    Editar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {editando && (
        <Modal abierto titulo={`Aparición en ${editando.nombre}`} onCerrar={() => setEditando(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void guardar();
            }}
          >
            <fieldset>
              <legend>Tipos elementales habilitados</legend>
              {tipos.map((t) => (
                <div key={t.id} className="editor-fila">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={sel.has(t.id)}
                      onChange={() => {
                        const m = new Map(sel);
                        if (m.has(t.id)) m.delete(t.id);
                        else m.set(t.id, false);
                        setSel(m);
                      }}
                    />
                    {t.nombre}
                  </label>
                  {sel.has(t.id) && (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={sel.get(t.id) ?? false}
                        onChange={() => setSel(new Map(sel).set(t.id, !sel.get(t.id)))}
                      />
                      Incluir como tipo II
                    </label>
                  )}
                </div>
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
