// REQ-IP-02: Señal de vida
console.log("app.js cargado ");

// REQ-IP-03: Seleccionar el formulario
const form = document.querySelector("#form-incidencia");

// P3: objeto para UNA incidencia (array recién el 18/09 con la lista)
function leerFormulario() {
    const incidencia = {
        codigoMaquina: document.querySelector("#codigo-maquina").value,
        descripcion: document.querySelector("#descripcion").value,
        turno: document.querySelector("#turno").value
    };
    console.table(incidencia);
    return incidencia;
}

// P3: objeto para traducir valores
const NOMBRES_TURNO = { mañana: "Mañana", tarde: "Tarde", noche: "Noche" };

// REQ-IP-08: Renderizar el feedback usando textContent (cero innerHTML)
function renderizarPreview(incidencia) {
    const preview = document.querySelector("#preview-incidencia");
    const turnoLegible = NOMBRES_TURNO[incidencia.turno] ?? incidencia.turno;

    preview.textContent = `Incidencia registrada: ${incidencia.codigoMaquina} · Turno ${turnoLegible}\n${incidencia.descripcion}`;
}

// P5: addEventListener separa el comportamiento de la estructura
form.addEventListener("submit", (event) => {
    event.preventDefault(); // REQ-IP-05: Evitar recarga de página

    const incidencia = leerFormulario();

    // REQ-IP-09: Mostrar feedback
    renderizarPreview(incidencia);
    const preview = document.querySelector("#preview-incidencia");
    preview.hidden = false;

    // REQ-IP-15: Limpiar formulario
    form.reset();
    
    // Forzar la actualización del botón para que vuelva a bloquearse tras enviar
    actualizarBoton();
});

// REQ-IP-16B: Botón que se habilita (Grupo D)
const codigoInput = document.querySelector("#codigo-maquina");
const btnEnviar = document.querySelector("#btn-enviar");

function actualizarBoton() {
    btnEnviar.disabled = codigoInput.value.trim() === "";
}

codigoInput.addEventListener("input", actualizarBoton);
actualizarBoton(); // estado inicial