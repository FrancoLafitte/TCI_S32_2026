import { Navigate, Route, Routes } from "react-router-dom";
import { useRol } from "./rol";
import ElegirRol from "./pages/ElegirRol";
import PanelOperario from "./pages/operario/PanelOperario";
import ReportarIncidencia from "./pages/operario/ReportarIncidencia";
import PanelMantenimiento from "./pages/mantenimiento/PanelMantenimiento";
import SeleccionarIncidencia from "./pages/mantenimiento/SeleccionarIncidencia";
import ReportarArreglo from "./pages/mantenimiento/ReportarArreglo";
import RepuestosHome from "./pages/repuestos/RepuestosHome";
import BuscarRepuesto from "./pages/repuestos/BuscarRepuesto";
import IngresarRepuesto from "./pages/repuestos/IngresarRepuesto";

/** Si no hay rol elegido, manda a la pantalla de inicio. */
function ConRol({ children }: { children: React.ReactNode }) {
  const { rol } = useRol();
  return rol ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ElegirRol />} />
      <Route
        path="/operario"
        element={
          <ConRol>
            <PanelOperario />
          </ConRol>
        }
      />
      <Route
        path="/incidencias/nueva"
        element={
          <ConRol>
            <ReportarIncidencia />
          </ConRol>
        }
      />
      <Route
        path="/mantenimiento"
        element={
          <ConRol>
            <PanelMantenimiento />
          </ConRol>
        }
      />
      <Route
        path="/reparar"
        element={
          <ConRol>
            <SeleccionarIncidencia />
          </ConRol>
        }
      />
      <Route
        path="/reparar/:id"
        element={
          <ConRol>
            <ReportarArreglo />
          </ConRol>
        }
      />
      <Route
        path="/repuestos"
        element={
          <ConRol>
            <RepuestosHome />
          </ConRol>
        }
      />
      <Route
        path="/repuestos/buscar"
        element={
          <ConRol>
            <BuscarRepuesto />
          </ConRol>
        }
      />
      <Route
        path="/repuestos/ingresar"
        element={
          <ConRol>
            <IngresarRepuesto />
          </ConRol>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
