import { useEffect, useState } from "react";
import { api, ErrorApi, type Ataque, type EstadoAlterado, type TipoGimnasio } from "../api";
import Modal from "../componentes/Modal";

interface FormAtaque {
  nombre: string;
  tipo_id: number;
  descripcion: string;
  danio: string;
  estado_objetivo_id: string;
  estado_auto_id: string;
}

const FORM_VACIO: FormAtaque = {
  nombre: "",
  tipo_id: 12,
  descripcion: "",
  danio: "",
  estado_objetivo_id: "",
  estado_auto_id: "",
};

export default function AtaquesAdmin({
  tipos,
  estados,
  onCambio,
}: {
  tipos: TipoGimnasio[];
  estados: EstadoAlterado[];
  onCambio: () => void;
}) {
  const [ataques, setAtaques] = useState<Ataque[] | null>(null);
  const [filtros, setFiltros] = useState({ q: "", estado: "", tipo: "", orden: "asc" });
  const [editando, setEditando] = useState<Ataque | "nuevo" | null>(null);
  const [form, setForm] = useState<FormAtaque>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function cargar() {
    api
      .ataques(filtros.q, filtros.estado, filtros.tipo, filtros.orden)
      .then(setAtaques)
      .catch(() => setError("No se pudieron cargar los ataques."));
  }

  useEffect(cargar, [filtros]);

  const nombreTipo = (id: number) => tipos.find((t) => t.id === id)?.nombre ?? String(id);
  const nombreEstado = (id: string | null) => (id ? estados.find((e) => e.id === id)?.nombre ?? "—" : "—");

  function abrirEdicion(a: Ataque) {
    setEditando(a);
    setForm({
      nombre: a.nombre,
      tipo_id: a.tipo_id,
      descripcion: a.descripcion,
      danio: a.danio == null ? "" : String(a.danio),
      estado_objetivo_id: a.estado_objetivo_id ?? "",
      estado_auto_id: a.estado_auto_id ?? "",
    });
    setError(null);
  }

  async function guardar() {
    setOcupado(true);
    setError(null);
    const datos = {
      nombre: form.nombre.trim(),
      tipo_id: form.tipo_id,
      descripcion: form.descripcion,
      danio: form.danio === "" ? null : Number(form.danio),
      estado_objetivo_id: form.estado_objetivo_id || null,
      estado_auto_id: form.estado_auto_id || null,
    };
    try {
      if (editando === "nuevo") {
        await api.crearAtaque(datos);
      } else if (editando) {
        await api.actualizarAtaque(editando.id, { ...datos, activo: editando.activo, version: editando.version });
      }
      setEditando(null);
      cargar();
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo guardar el ataque.");
    } finally {
      setOcupado(false);
    }
  }

  async function alternarActivo(a: Ataque) {
    setError(null);
    try {
      await api.actualizarAtaque(a.id, {
        nombre: a.nombre,
        tipo_id: a.tipo_id,
        descripcion: a.descripcion,
        danio: a.danio,
        estado_objetivo_id: a.estado_objetivo_id,
        estado_auto_id: a.estado_auto_id,
        activo: !a.activo,
        version: a.version,
      });
      cargar();
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo cambiar el estado.");
    }
  }

  return (
    <>
      <h3>Ataques</h3>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por nombre"
          aria-label="Buscar ataque"
          value={filtros.q}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
        />
        <select
          aria-label="Filtrar por tipo"
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado"
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <select
          aria-label="Orden"
          value={filtros.orden}
          onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
        >
          <option value="asc">Nombre A→Z</option>
          <option value="desc">Nombre Z→A</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Daño</th>
            <th>Estado obj.</th>
            <th>Estado auto</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(ataques ?? []).map((a) => (
            <tr key={a.id}>
              <td>{a.nombre}</td>
              <td>{nombreTipo(a.tipo_id)}</td>
              <td>{a.danio ?? "?"}</td>
              <td>{nombreEstado(a.estado_objetivo_id)}</td>
              <td>{nombreEstado(a.estado_auto_id)}</td>
              <td>{a.activo ? "Activo" : "Inactivo"}</td>
              <td className="acciones">
                <button type="button" onClick={() => abrirEdicion(a)}>
                  Editar
                </button>
                <button type="button" onClick={() => alternarActivo(a)}>
                  {a.activo ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => { setEditando("nuevo"); setForm(FORM_VACIO); setError(null); }}>
        Nuevo ataque
      </button>
      {editando && (
        <Modal
          abierto
          titulo={editando === "nuevo" ? "Nuevo ataque" : `Editar ${editando.nombre}`}
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
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required maxLength={100} />
            </label>
            <label>
              Tipo
              <select value={form.tipo_id} onChange={(e) => setForm({ ...form, tipo_id: Number(e.target.value) })}>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descripción
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>
            <label>
              Daño
              <input type="number" min={0} max={99} value={form.danio} onChange={(e) => setForm({ ...form, danio: e.target.value })} />
            </label>
            <label>
              Estado sobre el objetivo
              <select value={form.estado_objetivo_id} onChange={(e) => setForm({ ...form, estado_objetivo_id: e.target.value })}>
                <option value="">Ninguno</option>
                {estados.filter((s) => s.activo).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado sobre el usuario
              <select value={form.estado_auto_id} onChange={(e) => setForm({ ...form, estado_auto_id: e.target.value })}>
                <option value="">Ninguno</option>
                {estados.filter((s) => s.activo).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
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
