import { useEffect, useState } from "react";
import {
  api,
  ErrorApi,
  type Ataque,
  type CategoriaEspecie,
  type Especie,
  type TipoGimnasio,
} from "../api";
import Modal from "../componentes/Modal";

interface FormEspecie {
  dex: string;
  nombre: string;
  tipo_i: number;
  tipo_ii: string;
  hp: string;
  iniciativa: string;
  puntos_evolucion: string;
  ataque_inicial_id: string;
  preevolucion: string;
  evolucion: string;
  etapa: string;
  sprite_url: string;
  grito_url: string;
  generacion: string;
  prob_aparicion: string;
  prob_shiny: string;
  categorias: Set<string>;
  tipos_ataque: Set<number>;
}

const FORM_VACIO = (tipoPorDefecto: number): FormEspecie => ({
  dex: "",
  nombre: "",
  tipo_i: tipoPorDefecto,
  tipo_ii: "",
  hp: "",
  iniciativa: "",
  puntos_evolucion: "",
  ataque_inicial_id: "",
  preevolucion: "",
  evolucion: "",
  etapa: "",
  sprite_url: "",
  grito_url: "",
  generacion: "",
  prob_aparicion: "",
  prob_shiny: "",
  categorias: new Set(),
  tipos_ataque: new Set(),
});

const numOVacio = (v: number | null) => (v == null ? "" : String(v));

export default function EspeciesAdmin({
  tipos,
  categorias,
  ataques,
  onCambio,
}: {
  tipos: TipoGimnasio[];
  categorias: CategoriaEspecie[];
  ataques: Ataque[];
  onCambio: () => void;
}) {
  const [especies, setEspecies] = useState<Especie[] | null>(null);
  const [filtros, setFiltros] = useState({ q: "", estado: "", tipo: "", categoria: "", generacion: "", orden: "dex" });
  const [editando, setEditando] = useState<Especie | "nuevo" | null>(null);
  const [form, setForm] = useState<FormEspecie>(FORM_VACIO(12));
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function cargar() {
    api
      .especies(filtros)
      .then(setEspecies)
      .catch(() => setError("No se pudieron cargar las especies."));
  }

  useEffect(cargar, [filtros]);

  const nombreTipo = (id: number | null) => (id == null ? "—" : tipos.find((t) => t.id === id)?.nombre ?? String(id));

  function abrirEdicion(e: Especie) {
    setEditando(e);
    setForm({
      dex: String(e.dex),
      nombre: e.nombre,
      tipo_i: e.tipo_i,
      tipo_ii: e.tipo_ii == null ? "" : String(e.tipo_ii),
      hp: numOVacio(e.hp),
      iniciativa: numOVacio(e.iniciativa),
      puntos_evolucion: numOVacio(e.puntos_evolucion),
      ataque_inicial_id: e.ataque_inicial_id ?? "",
      preevolucion: e.preevolucion ?? "",
      evolucion: e.evolucion ?? "",
      etapa: e.etapa ?? "",
      sprite_url: e.sprite_url ?? "",
      grito_url: e.grito_url ?? "",
      generacion: numOVacio(e.generacion),
      prob_aparicion: numOVacio(e.prob_aparicion),
      prob_shiny: numOVacio(e.prob_shiny),
      categorias: new Set(e.categorias),
      tipos_ataque: new Set(e.tipos_ataque),
    });
    setError(null);
  }

  const num = (s: string) => (s.trim() === "" ? null : Number(s));

  async function guardar() {
    setOcupado(true);
    setError(null);
    const datos = {
      dex: Number(form.dex),
      nombre: form.nombre.trim(),
      tipo_i: form.tipo_i,
      tipo_ii: form.tipo_ii === "" ? null : Number(form.tipo_ii),
      hp: num(form.hp),
      iniciativa: num(form.iniciativa),
      puntos_evolucion: num(form.puntos_evolucion),
      ataque_inicial_id: form.ataque_inicial_id || null,
      preevolucion: form.preevolucion || null,
      evolucion: form.evolucion || null,
      etapa: form.etapa || null,
      sprite_url: form.sprite_url || null,
      grito_url: form.grito_url || null,
      generacion: num(form.generacion),
      prob_aparicion: num(form.prob_aparicion),
      prob_shiny: num(form.prob_shiny),
      categorias: [...form.categorias],
      tipos_ataque: [...form.tipos_ataque],
    };
    try {
      if (editando === "nuevo") {
        await api.crearEspecie(datos);
      } else if (editando) {
        await api.actualizarEspecie(editando.id, { ...datos, activo: editando.activo, version: editando.version });
      }
      setEditando(null);
      cargar();
      onCambio();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo guardar la especie.");
    } finally {
      setOcupado(false);
    }
  }

  async function alternarActivo(e: Especie) {
    setError(null);
    try {
      await api.actualizarEspecie(e.id, { ...e, activo: !e.activo });
      cargar();
      onCambio();
    } catch (err) {
      setError(err instanceof ErrorApi ? `${err.causa} ${err.accion ?? ""}` : "No se pudo cambiar el estado.");
    }
  }

  function alternar<T>(set: Set<T>, v: T, aplicar: (s: Set<T>) => void) {
    const s = new Set(set);
    if (s.has(v)) s.delete(v);
    else s.add(v);
    aplicar(s);
  }

  const campoNumero = (clave: keyof FormEspecie, etiqueta: string, min: number, max: number, step = "1") => (
    <label>
      {etiqueta}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={form[clave] as string}
        onChange={(e) => setForm({ ...form, [clave]: e.target.value })}
      />
    </label>
  );

  const campoTexto = (clave: keyof FormEspecie, etiqueta: string, maxLength = 200) => (
    <label>
      {etiqueta}
      <input
        value={form[clave] as string}
        maxLength={maxLength}
        onChange={(e) => setForm({ ...form, [clave]: e.target.value })}
      />
    </label>
  );

  return (
    <>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por nombre"
          aria-label="Buscar especie"
          value={filtros.q}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
        />
        <select aria-label="Filtrar por tipo" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select aria-label="Filtrar por categoría" value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select aria-label="Filtrar por estado" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <input
          type="number"
          placeholder="Gen."
          aria-label="Filtrar por generación"
          min={0}
          max={99}
          value={filtros.generacion}
          onChange={(e) => setFiltros({ ...filtros, generacion: e.target.value })}
        />
        <select aria-label="Orden" value={filtros.orden} onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}>
          <option value="dex">Por dex</option>
          <option value="nombre">Por nombre</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Dex</th>
            <th>Nombre</th>
            <th>Tipo I</th>
            <th>Tipo II</th>
            <th>Categorías</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(especies ?? []).map((e) => (
            <tr key={e.id}>
              <td>{e.dex}</td>
              <td>{e.nombre}</td>
              <td>{nombreTipo(e.tipo_i)}</td>
              <td>{nombreTipo(e.tipo_ii)}</td>
              <td>{e.categorias.map((c) => categorias.find((x) => x.id === c)?.nombre ?? c).join(", ") || "—"}</td>
              <td>{e.activo ? "Activo" : "Inactivo"}</td>
              <td className="acciones">
                <button type="button" onClick={() => abrirEdicion(e)}>
                  Editar
                </button>
                <button type="button" onClick={() => alternarActivo(e)}>
                  {e.activo ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => { setEditando("nuevo"); setForm(FORM_VACIO(tipos[0]?.id ?? 12)); setError(null); }}>
        Nueva especie
      </button>
      {editando && (
        <Modal
          abierto
          titulo={editando === "nuevo" ? "Nueva especie" : `Editar ${editando.nombre}`}
          onCerrar={() => setEditando(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void guardar();
            }}
          >
            <div className="editor-fila">
              {campoNumero("dex", "Dex nacional", 0.01, 99999.99, "0.01")}
              <label>
                Nombre
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required maxLength={100} />
              </label>
            </div>
            <div className="editor-fila">
              <label>
                Tipo I
                <select
                  value={form.tipo_i}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setForm({
                      ...form,
                      tipo_i: v,
                      tipo_ii: String(form.tipo_ii) === String(v) ? "" : form.tipo_ii,
                    });
                  }}
                >
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo II
                <select value={form.tipo_ii} onChange={(e) => setForm({ ...form, tipo_ii: e.target.value })}>
                  <option value="">Ninguno</option>
                  {tipos.filter((t) => t.id !== form.tipo_i).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="editor-fila">
              {campoNumero("hp", "HP", 0, 99)}
              {campoNumero("iniciativa", "Iniciativa", 0, 99)}
              {campoNumero("puntos_evolucion", "Puntos evolución", 0, 99)}
            </div>
            <label>
              Ataque inicial
              <select value={form.ataque_inicial_id} onChange={(e) => setForm({ ...form, ataque_inicial_id: e.target.value })}>
                <option value="">Ninguno</option>
                {ataques.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Tipos de ataque compatibles (máx. 4)</legend>
              {tipos.map((t) => (
                <label key={t.id} className="check">
                  <input
                    type="checkbox"
                    checked={form.tipos_ataque.has(t.id)}
                    onChange={() =>
                      alternar(form.tipos_ataque, t.id, (s) => {
                        if (s.size <= 4) setForm({ ...form, tipos_ataque: s });
                      })
                    }
                  />
                  {t.nombre}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Categorías</legend>
              {categorias.map((c) => (
                <label key={c.id} className="check">
                  <input
                    type="checkbox"
                    checked={form.categorias.has(c.id)}
                    onChange={() => alternar(form.categorias, c.id, (s) => setForm({ ...form, categorias: s }))}
                  />
                  {c.nombre}
                </label>
              ))}
            </fieldset>
            <div className="editor-fila">
              {campoTexto("preevolucion", "PreEvolución", 100)}
              {campoTexto("evolucion", "Evolución", 100)}
              {campoTexto("etapa", "Etapa", 100)}
            </div>
            {campoTexto("sprite_url", "Sprite URL", 500)}
            {campoTexto("grito_url", "Grito URL", 500)}
            <div className="editor-fila">
              {campoNumero("generacion", "Generación", 0, 99)}
              {campoNumero("prob_aparicion", "Prob. aparición (0-1)", 0, 1, "0.0001")}
              {campoNumero("prob_shiny", "Prob. shiny (0-1)", 0, 1, "0.0001")}
            </div>
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
