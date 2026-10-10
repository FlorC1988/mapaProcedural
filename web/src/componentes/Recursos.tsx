import type { MapaGenerado } from "../api";

// Matriz de piezas por bioma y altura + tabla de marcadores por tipo
// (RF-REC-001/003, RD-REC-*).
export default function Recursos({
  mapa,
  biomas,
  tipos,
}: {
  mapa: MapaGenerado;
  biomas: { id: string; nombre: string }[];
  tipos: { id: number; nombre: string }[];
}) {
  const conteo = new Map<string, [number, number, number]>();
  for (const c of mapa.celdas) {
    const v = conteo.get(c.bioma) ?? [0, 0, 0];
    v[c.altura - 1]++;
    conteo.set(c.bioma, v);
  }
  const filas = [...conteo.entries()]
    .map(([id, v]) => ({
      nombre: biomas.find((b) => b.id === id)?.nombre ?? id,
      v,
      total: v[0] + v[1] + v[2],
      estructura: v[0] + 2 * v[1] + 3 * v[2],
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const totales = [0, 0, 0];
  for (const f of filas) f.v.forEach((x, i) => (totales[i] += x));

  const conteoGym = new Map<number, number>();
  for (const g of mapa.gimnasios) conteoGym.set(g.tipoId, (conteoGym.get(g.tipoId) ?? 0) + 1);
  const filasGym = [...conteoGym.entries()]
    .map(([id, cant]) => ({ nombre: tipos.find((t) => t.id === id)?.nombre ?? String(id), cant }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div>
      <h3>Recursos físicos</h3>
      <table aria-label="Piezas por bioma y altura">
        <thead>
          <tr>
            <th>Bioma</th>
            <th>Z1</th>
            <th>Z2</th>
            <th>Z3</th>
            <th>Total</th>
            <th>Total estructura</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre}>
              <td>{f.nombre}</td>
              <td>{f.v[0]}</td>
              <td>{f.v[1]}</td>
              <td>{f.v[2]}</td>
              <td>{f.total}</td>
              <td>{f.estructura}</td>
            </tr>
          ))}
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td>{totales[0]}</td>
            <td>{totales[1]}</td>
            <td>{totales[2]}</td>
            <td>{totales[0] + totales[1] + totales[2]}</td>
            <td>{totales[0] + 2 * totales[1] + 3 * totales[2]}</td>
          </tr>
        </tbody>
      </table>
      <table aria-label="Marcadores de gimnasio por tipo">
        <thead>
          <tr>
            <th>Tipo de gimnasio</th>
          </tr>
        </thead>
        <tbody>
          {filasGym.map((f) => (
            <tr key={f.nombre}>
              <td>
                {f.nombre}
                {f.cant > 1 ? ` (${f.cant})` : ""}
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <strong>Total ({mapa.gimnasios.length})</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
