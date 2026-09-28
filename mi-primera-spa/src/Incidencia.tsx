interface IncidenciaProps {
  maquina: string;
  descripcion: string;
}

function Incidencia({ maquina, descripcion }: IncidenciaProps) {
  return (
    <article>
      <h3>{maquina}</h3>
      <p>{descripcion}</p>
    </article>
  );
}

export default Incidencia;