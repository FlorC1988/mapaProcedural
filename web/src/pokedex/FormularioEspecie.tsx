import { useRef, useState } from "react";
import {
  api,
  ErrorApi,
  type Ataque,
  type CategoriaEspecie,
  type Especie,
  type TipoGimnasio,
} from "../api";
import Modal from "../componentes/Modal";
import BadgeTipo from "./BadgeTipo";
import { formatearDex } from "./tipos";

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

const numOVacio = (v: number | null) => (v == null ? "" : String(v));
const porcentajeOVacio = (v: number | null) => (v == null ? "" : (v * 100).toFixed(1));
const num = (s: string) => (s.trim() === "" ? null : Number(s));
const porcentaje = (s: string) => {
  const valor = num(s);
  return valor == null ? null : valor / 100;
};

function formInicial(especie: Especie | "nuevo", tipoPorDefecto: number): FormEspecie {
  if (especie === "nuevo") {
    return {
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
    };
  }
  const e = especie;
  return {
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
    prob_aparicion: porcentajeOVacio(e.prob_aparicion),
    prob_shiny: porcentajeOVacio(e.prob_shiny),
    categorias: new Set(e.categorias),
    tipos_ataque: new Set(e.tipos_ataque),
  };
}

// Modal de alta/edición de especie (RF-PKM-004). Las probabilidades se muestran
// en % con un decimal y se guardan como 0..1.
export default function FormularioEspecie({
  especie,
  tipos,
  categorias,
  ataques,
  onGuardado,
  onCerrar,
}: {
  especie: Especie | "nuevo";
  tipos: TipoGimnasio[];
  categorias: CategoriaEspecie[];
  ataques: Ataque[];
  onGuardado: () => void;
  onCerrar: () => void;
}) {
  const [form, setForm] = useState<FormEspecie>(() => formInicial(especie, tipos[0]?.id ?? 12));
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [spriteRoto, setSpriteRoto] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      prob_aparicion: porcentaje(form.prob_aparicion),
      prob_shiny: porcentaje(form.prob_shiny),
      categorias: [...form.categorias],
      tipos_ataque: [...form.tipos_ataque],
    };
    try {
      if (especie === "nuevo") {
        await api.crearEspecie(datos);
      } else {
        await api.actualizarEspecie(especie.id, { ...datos, activo: especie.activo, version: especie.version });
      }
      onGuardado();
    } catch (e) {
      setError(e instanceof ErrorApi ? `${e.causa} ${e.accion ?? ""}` : "No se pudo guardar la especie.");
    } finally {
      setOcupado(false);
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

  const nombreTipo = (id: number) => tipos.find((t) => t.id === id)?.nombre ?? String(id);
  const dexNum = Number(form.dex);
  const titulo = especie === "nuevo" ? "Nueva especie" : `Editar ${especie.nombre}`;

  function probarGrito() {
    if (!form.grito_url) return;
    audioRef.current?.pause();
    audioRef.current = new Audio(form.grito_url);
    void audioRef.current.play().catch(() => undefined);
  }

  return (
    <Modal abierto titulo={titulo} onCerrar={onCerrar} className="modal-pokedex" sinTitulo>
      <div className="modal-pokedex-cabecera">
        <div className="pokedex-leds" aria-hidden="true">
          <span className="led grande" />
          <span className="led rojo" />
          <span className="led amarillo" />
          <span className="led verde" />
        </div>
        <h3 className="pokedex-titulo">{titulo}</h3>
        <button type="button" className="modal-pokedex-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ✕
        </button>
      </div>
      {error && (
        <div className="aviso-error" role="alert">
          {error}
        </div>
      )}
      <form
        className="modal-pokedex-form"
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
      >
        <div className="pokedex-pantalla">
          <div className="pokedex-previa" aria-label="Vista previa">
            <div className="pokedex-previa-sprite">
              {form.sprite_url && !spriteRoto ? (
                <img src={form.sprite_url} alt="" onError={() => setSpriteRoto(true)} />
              ) : (
                "?"
              )}
            </div>
            <div className="pokedex-previa-datos">
              <span className="pokedex-previa-dex">{Number.isFinite(dexNum) && form.dex !== "" ? formatearDex(dexNum) : "#----"}</span>
              <span className="pokedex-previa-nombre">{form.nombre || "Sin nombre"}</span>
              <div className="pokedex-previa-tipos">
                <BadgeTipo id={form.tipo_i} nombre={nombreTipo(form.tipo_i)} />
                {form.tipo_ii !== "" && <BadgeTipo id={Number(form.tipo_ii)} nombre={nombreTipo(Number(form.tipo_ii))} />}
              </div>
            </div>
          </div>

          <fieldset className="pokedex-campos">
            <legend>Identidad</legend>
            {campoNumero("dex", "Dex nacional", 0.01, 99999.99, "0.01")}
            <label>
              Nombre
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required maxLength={100} />
            </label>
          </fieldset>

          <fieldset className="pokedex-campos">
            <legend>Tipos</legend>
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
          </fieldset>

          <fieldset className="pokedex-campos">
            <legend>Datos de juego</legend>
            {campoNumero("hp", "HP", 0, 99)}
            {campoNumero("iniciativa", "Iniciativa", 0, 99)}
            {campoNumero("puntos_evolucion", "Puntos evolución", 0, 99)}
            <label className="ancho-completo">
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
          </fieldset>

          <fieldset className="pokedex-campos">
            <legend>Tipos de ataque compatibles (máx. 4)</legend>
            <div className="pokedex-checks">
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
            </div>
          </fieldset>

          <fieldset className="pokedex-campos">
            <legend>Categorías</legend>
            <div className="pokedex-checks">
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
            </div>
          </fieldset>

          <fieldset className="pokedex-campos">
            <legend>Evolución</legend>
            {campoTexto("preevolucion", "PreEvolución", 100)}
            {campoTexto("evolucion", "Evolución", 100)}
            {campoTexto("etapa", "Etapa", 100)}
          </fieldset>

          <fieldset className="pokedex-campos">
            <legend>Multimedia</legend>
            <div className="ancho-completo">
              <label>
                Sprite URL
                <input
                  value={form.sprite_url}
                  maxLength={500}
                  onChange={(e) => {
                    setSpriteRoto(false);
                    setForm({ ...form, sprite_url: e.target.value });
                  }}
                />
              </label>
            </div>
            <div className="ancho-completo pokedex-fila-audio">
              {campoTexto("grito_url", "Grito URL", 500)}
              <button type="button" onClick={probarGrito} disabled={!form.grito_url} aria-label="Probar grito">
                ▶
              </button>
            </div>
          </fieldset>

          <fieldset className="pokedex-campos">
            <legend>Generación y probabilidades</legend>
            {campoNumero("generacion", "Generación", 0, 99)}
            {campoNumero("prob_aparicion", "Prob. aparición (%)", 0, 100, "0.1")}
            {campoNumero("prob_shiny", "Prob. shiny (%)", 0, 100, "0.1")}
          </fieldset>
        </div>
        <div className="modal-pokedex-pie">
          <button type="button" className="cancelar" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="guardar" disabled={ocupado}>
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
