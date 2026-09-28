import Incidencia from './Incidencia';

function App() {
  return (
    <div>
      <h1>Mis Incidencias</h1>
      
      {/* Esta está perfecta */}
      <Incidencia maquina="CAL-001" descripcion="Ruido fuerte" />
      
      {/* ACÁ PROVOCAMOS EL ERROR: Le pasamos un número (123) en vez de un texto ("123") */}
      <Incidencia maquina={"123"} descripcion="No enciende" />
      
    </div>
  );
}

export default App;