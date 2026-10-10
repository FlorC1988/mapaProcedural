import { NavLink, Route, Routes } from "react-router-dom";
import { ProveedorMapa } from "./estado";
import Generar from "./paginas/Generar";
import Mapas from "./paginas/Mapas";
import Administracion from "./paginas/Administracion";

export default function App() {
  return (
    <div className="app">
      <header className="cabecera">
        <h1>Generador de mapas</h1>
        <nav aria-label="Principal">
          <NavLink to="/">Generar</NavLink>
          <NavLink to="/mapas">Mapas</NavLink>
          <NavLink to="/administracion">Administración</NavLink>
        </nav>
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
