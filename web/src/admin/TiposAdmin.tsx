import { useState } from "react";
import { api, ErrorApi, type Bioma, type TipoGimnasio } from "../api";

export default function TiposAdmin({
  tipos,
  biomas,
  onCambio,
}: {
  tipos: TipoGimnasio[];
  biomas: Bioma[];
  onCambio: () => void;
}) {
  const [editando, setEditando] = useState<TipoGimnasio | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const activos = biomas.filter((b) => b.activo);

  function abrir(t: TipoGimnasio) {
    setEditando(t);
    setSeleccion(new Set(t.biomas_compatibles));
    setError(null);
  }

  function alternar(id: string) {
    setSeleccion((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function guardar() {
    if (!editando) return;
    if (seleccion.size === 0) {
      setError("Un tipo de gimnasio debe conservar al menos un bioma compatible.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      await api.actualizarTipoGimnasio(editando.id, [...seleccion]);
      setEditando(null);
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudieron guardar las compatibilidades.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <h3>Tipos de gimnasio</h3>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Biomas compatibles</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((t) => (
            <tr key={t.id}>
              <td>{t.nombre}</td>
              <td>
                {t.biomas_compatibles
                  .map((id) => biomas.find((b) => b.id === id)?.nombre ?? id)
                  .join(", ")}
              </td>
              <td className="acciones">
                <button type="button" onClick={() => abrir(t)}>
                  Configurar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editando && (
        <form
          className="form-admin"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <h4>Biomas compatibles con {editando.nombre}</h4>
          {activos.map((b) => (
            <label key={b.id} className="check">
              <input
                type="checkbox"
                checked={seleccion.has(b.id)}
                onChange={() => alternar(b.id)}
              />
              {b.nombre}
            </label>
          ))}
          <div className="editor-fila">
            <button type="submit" disabled={ocupado || seleccion.size === 0}>
              Guardar
            </button>
            <button type="button" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </>
  );
}
