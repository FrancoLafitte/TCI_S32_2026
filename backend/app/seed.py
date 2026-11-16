from sqlmodel import Session, select
from app.database import engine, init_db
from app.security import hash_password
from app.models import (
    Usuario,
    Maquina,
    Repuesto,
    MaquinaRepuesto,
    Incidencia,
    Reserva,
    LineaReserva,
)


def seed_data() -> None:
    """Precarga datos iniciales en la base de datos si está vacía."""
    init_db()

    with Session(engine) as session:
        # 1. Usuarios del sistema
        if not session.exec(select(Usuario)).first():
            usuarios = [
                Usuario(
                    email="operario@planta.com",
                    password=hash_password("1234"),
                    rol="operario",
                    nombre="Juan Pérez",
                ),
                Usuario(
                    email="mantenimiento@planta.com",
                    password=hash_password("1234"),
                    rol="mantenimiento",
                    nombre="Carlos Gómez",
                ),
                Usuario(
                    email="encargado@planta.com",
                    password=hash_password("1234"),
                    rol="encargado",
                    nombre="Dra. Laura Martínez",
                ),
                Usuario(
                    email="gerencia@planta.com",
                    password=hash_password("1234"),
                    rol="gerencia",
                    nombre="Ing. Roberto Rossi",
                ),
            ]
            session.add_all(usuarios)

        # 2. Máquinas de producción
        if not session.exec(select(Maquina)).first():
            maquinas = [
                Maquina(
                    codigo="MAQ-F04",
                    nombre="Fraccionador F-04",
                    tipo="Fraccionador",
                    ejemplar="F-04",
                    linea="Línea 2 - Envasado",
                    estado="operativa",
                ),
                Maquina(
                    codigo="MAQ-C01",
                    nombre="Caldera Principal C-01",
                    tipo="Caldera",
                    ejemplar="C-01",
                    linea="Sala de Máquinas",
                    estado="operativa",
                ),
                Maquina(
                    codigo="MAQ-B02",
                    nombre="Banda de Transporte B-02",
                    tipo="Banda de Transporte",
                    ejemplar="B-02",
                    linea="Línea 1 - Fabricación",
                    estado="en_mantenimiento",
                ),
            ]
            session.add_all(maquinas)

        # 3. Repuestos e insumos
        if not session.exec(select(Repuesto)).first():
            repuestos = [
                Repuesto(
                    codigo="REP-7742",
                    nombre="Válvula Sanitaria Diafragma EPDM",
                    descripcion="Válvula de diafragma para control estéril de fluidos 1/2 pulgada",
                    stock_fisico=15,
                    stock_reservado=3,
                    umbral_minimo=5,
                    precio_unitario=120.50,
                    ubicacion_codigo="A-03-12",
                    ubicacion_descripcion="Estante A, fila 3, gaveta 12",
                ),
                Repuesto(
                    codigo="REP-1024",
                    nombre="Filtro HEPA H14",
                    descripcion="Filtro de aire para sala limpia farmacéutica",
                    stock_fisico=4,
                    stock_reservado=0,
                    umbral_minimo=5,  # Está bajo umbral (4 <= 5)
                    precio_unitario=350.00,
                    ubicacion_codigo="B-01-05",
                    ubicacion_descripcion="Almacén de filtros B, nivel 1",
                ),
                Repuesto(
                    codigo="REP-3301",
                    nombre="Kit O-Rings Silicona Grado Farmacéutico",
                    descripcion="Juntas tóricas sanitarias certificadas FDA",
                    stock_fisico=50,
                    stock_reservado=10,
                    umbral_minimo=15,
                    precio_unitario=25.00,
                    ubicacion_codigo="C-02-08",
                    ubicacion_descripcion="Estante C, gaveta 8",
                ),
                Repuesto(
                    codigo="REP-9900",
                    nombre="Sensor de Presión Diferencial 4-20mA",
                    descripcion="Sensor piezoeléctrico para calderas y fraccionadores",
                    stock_fisico=2,
                    stock_reservado=2,  # Disponible = 0 -> Alerta crítica
                    umbral_minimo=3,
                    precio_unitario=480.00,
                    ubicacion_codigo="D-04-01",
                    ubicacion_descripcion="Gabinete de instrumentación",
                ),
            ]
            session.add_all(repuestos)

        # 4. Compatibilidad Máquinas <-> Repuestos
        if not session.exec(select(MaquinaRepuesto)).first():
            compatibilidades = [
                MaquinaRepuesto(maquina_codigo="MAQ-F04", repuesto_codigo="REP-7742"),
                MaquinaRepuesto(maquina_codigo="MAQ-F04", repuesto_codigo="REP-3301"),
                MaquinaRepuesto(maquina_codigo="MAQ-C01", repuesto_codigo="REP-7742"),
                MaquinaRepuesto(maquina_codigo="MAQ-C01", repuesto_codigo="REP-9900"),
                MaquinaRepuesto(maquina_codigo="MAQ-B02", repuesto_codigo="REP-3301"),
            ]
            session.add_all(compatibilidades)

        # 5. Incidencias iniciales
        if not session.exec(select(Incidencia)).first():
            incidencias = [
                Incidencia(
                    maquina_codigo="MAQ-B02",
                    descripcion="Ruido anómalo y vibración en el rodillo tensor.",
                    tipo_falla="ruido_anomalo",
                    prioridad="urgente",
                    fotos="[]",
                    estado="en_reparacion",
                    turno="manana",
                    reportada_por="Juan Pérez",
                ),
                Incidencia(
                    maquina_codigo="MAQ-C01",
                    descripcion="Pérdida leve de presión en línea de vapor.",
                    tipo_falla="perdida_presion",
                    prioridad="normal",
                    fotos="[]",
                    estado="abierta",
                    turno="tarde",
                    reportada_por="Carlos Gómez",
                ),
            ]
            session.add_all(incidencias)

        session.commit()
    print("Seed ejecutado exitosamente.")


if __name__ == "__main__":
    seed_data()
