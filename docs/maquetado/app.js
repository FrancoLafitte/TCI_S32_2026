console.log("app.js cargado ✅");


function leerFormulario() {
    const codigoMaquina = document.getElementById('maquina').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const fotos = document.getElementById('fotos').files;
    const turno = document.getElementById('turno').value;

    const incidencia = {
        codigoMaquina,
        descripcion,
        fotos: Array.from(fotos),
        turno,
        timestamp: new Date().toISOString()
    };

    return incidencia;
}

function validarFormulario() {
    const datos = leerFormulario();

    if (!datos.codigoMaquina) {
        console.error('Error: El código de máquina es requerido');
        return false;
    }

    if (!datos.descripcion) {
        console.error('Error: La descripción del problema es requerida');
        return false;
    }

    if (!datos.turno) {
        console.error('Error: Debe seleccionar un turno');
        return false;
    }

    console.log('Formulario válido:', datos);
    return true;
}

const NOMBRES_TURNO = { mañana: "Mañana", tarde: "Tarde", noche: "Noche" };

function renderizarPreview(incidencia) {
    const preview = document.querySelector('#preview-incidencia');
    const turnoLegible = NOMBRES_TURNO[incidencia.turno] ?? incidencia.turno;

    // textContent y no innerHTML: lo que escribe el operario es texto, no estructura (XSS).
    preview.textContent =
        `Incidencia registrada: ${incidencia.codigoMaquina} · Turno ${turnoLegible}\n` +
        incidencia.descripcion;
}

function crearTarjetaIncidencia(incidencia) {
    const turnoLegible = NOMBRES_TURNO[incidencia.turno] ?? incidencia.turno;
    const cantidadFotos = incidencia.fotos?.length ?? 0;

    const codigo = document.createElement('h3');
    codigo.className = 'tarjeta-codigo';
    codigo.textContent = incidencia.codigoMaquina;

    const turno = document.createElement('span');
    turno.className = 'tarjeta-turno';
    turno.dataset.turno = incidencia.turno;
    turno.textContent = turnoLegible;

    const encabezado = document.createElement('header');
    encabezado.className = 'tarjeta-encabezado';
    encabezado.append(codigo, turno);

    const descripcion = document.createElement('p');
    descripcion.className = 'tarjeta-descripcion';
    descripcion.textContent = incidencia.descripcion;

    const hora = new Date(incidencia.timestamp).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    const pie = document.createElement('footer');
    pie.className = 'tarjeta-pie';
    pie.textContent = cantidadFotos === 0
        ? hora
        : `${hora} · ${cantidadFotos === 1 ? '1 foto' : `${cantidadFotos} fotos`}`;

    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-incidencia';
    tarjeta.append(encabezado, descripcion, pie);

    return tarjeta;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const preview = document.querySelector('#preview-incidencia');
    const lista = document.querySelector('#lista-incidencias');
    const estadoVacio = document.querySelector('#estado-vacio');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        const incidencia = leerFormulario();

        renderizarPreview(incidencia);
        preview.hidden = false;

        lista.prepend(crearTarjetaIncidencia(incidencia));
        estadoVacio.hidden = true;

        form.reset();
        document.getElementById('maquina').focus();
    });
});
