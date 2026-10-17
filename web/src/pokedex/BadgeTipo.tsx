import { COLOR_TIPO, contrasteTexto } from "./tipos";

export default function BadgeTipo({ id, nombre }: { id: number; nombre: string }) {
  const fondo = COLOR_TIPO[id] ?? "#a1a1aa";
  return (
    <span className="badge-tipo" style={{ background: fondo, color: contrasteTexto(fondo) }}>
      {nombre}
    </span>
  );
}
