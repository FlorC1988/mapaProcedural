import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { ProveedorMapa } from "./estado";
import Generar from "./paginas/Generar";
import Mapas from "./paginas/Mapas";
import Administracion from "./paginas/Administracion";

export default function App() {
  const [tema, setTema] = useState<"claro" | "oscuro">(
    () => (localStorage.getItem("tema") === "oscuro" ? "oscuro" : "claro")
  );

  useEffect(() => {
    localStorage.setItem("tema", tema);
  }, [tema]);

  return (
    <div className="app" data-tema={tema}>
      <header className="cabecera">
        <h1>Generador de mapas</h1>
        <nav aria-label="Principal">
          <NavLink to="/">Generar</NavLink>
          <NavLink to="/mapas">Mapas</NavLink>
          <NavLink to="/administracion">Administración</NavLink>
        </nav>
        <button
          type="button"
          className="boton-tema"
          aria-pressed={tema === "oscuro"}
          onClick={() => setTema((t) => (t === "oscuro" ? "claro" : "oscuro"))}
        >
          {tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
        </button>
      </header>
      <main>
        <ProveedorMapa>
          <Routes>
          <Route path="/" element={<Generar />} />
          <Route path="/mapas" element={<Mapas />} />
          <Route path="/administracion" element={<Administracion />} />
          </Routes>
        </ProveedorMapa>
      </main>
    </div>
  );
}
