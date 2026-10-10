// Logs estructurados locales sin contenido sensible (RF-OBS-002, DEC-070).
// No registrar contenido de mapas, snapshots ni secretos.
export function log(level: "info" | "warn" | "error", evento: string, datos: Record<string, unknown> = {}): void {
  const linea = JSON.stringify({ ts: new Date().toISOString(), level, evento, ...datos });
  if (level === "error") console.error(linea);
  else console.log(linea);
}
