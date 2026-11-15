import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_listar_maquinas_publico():
    res = client.get("/maquinas")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_obtener_maquina_existente():
    res = client.get("/maquinas/MAQ-F04")
    assert res.status_code == 200
    data = res.json()
    assert data["codigo"] == "MAQ-F04"
    assert "repuestosAMantener" in data
    assert isinstance(data["repuestosAMantener"], list)


def test_obtener_maquina_inexistente():
    res = client.get("/maquinas/MAQ-INEXISTENTE")
    assert res.status_code == 404


def test_crear_maquina_sin_rol_encargado_falla_403():
    codigo = f"MAQ-TEST-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "codigo": codigo,
        "tipo": "Caldera",
        "ejemplar": "T-01",
        "linea": "Línea Test",
        "repuestosAMantener": [],
    }
    # Sin header de autenticación
    res = client.post("/maquinas", json=payload)
    assert res.status_code == 403

    # Con rol operario
    res_op = client.post(
        "/maquinas",
        json=payload,
        headers={"Authorization": "Bearer token-operario"},
    )
    assert res_op.status_code == 403


def test_ciclo_completo_maquina_encargado():
    codigo = f"MAQ-TEST-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "codigo": codigo,
        "nombre": "Caldera Test",
        "tipo": "Caldera",
        "ejemplar": "T-01",
        "linea": "Sala Térmica Test",
        "estado": "operativa",
        "repuestosAMantener": ["REP-7742", "REP-3301"],
    }

    # 1. Crear máquina
    res = client.post(
        "/maquinas",
        json=payload,
        headers={"Authorization": "Bearer mock-encargado"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["codigo"] == codigo
    assert data["estado"] == "operativa"
    assert "REP-7742" in data["repuestosAMantener"]
    assert "REP-3301" in data["repuestosAMantener"]

    # 2. Código duplicado -> 409
    res_dup = client.post(
        "/maquinas",
        json=payload,
        headers={"Authorization": "Bearer mock-encargado"},
    )
    assert res_dup.status_code == 409

    # 3. Actualizar estado
    res_patch = client.patch(
        f"/maquinas/{codigo}",
        json={"estado": "fuera_de_servicio"},
        headers={"Authorization": "Bearer mock-encargado"},
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["estado"] == "fuera_de_servicio"

    # 4. Actualizar estado sin permiso -> 403
    res_fail = client.patch(
        f"/maquinas/{codigo}",
        json={"estado": "operativa"},
        headers={"Authorization": "Bearer mock-operario"},
    )
    assert res_fail.status_code == 403

    # 5. Vincular nuevo repuesto
    res_vinc = client.post(
        f"/maquinas/{codigo}/repuestos",
        json={"repuestoCodigo": "REP-1024"},
        headers={"Authorization": "Bearer mock-encargado"},
    )
    assert res_vinc.status_code == 200
    assert "REP-1024" in res_vinc.json()["repuestosAMantener"]

    # 6. Obtener lista detallada de repuestos de la máquina
    res_rep = client.get(f"/maquinas/{codigo}/repuestos")
    assert res_rep.status_code == 200
    codigos = [r["codigo"] for r in res_rep.json()]
    assert "REP-1024" in codigos

    # 7. Desvincular repuesto
    res_desv = client.delete(
        f"/maquinas/{codigo}/repuestos/REP-1024",
        headers={"Authorization": "Bearer mock-encargado"},
    )
    assert res_desv.status_code == 200
    assert "REP-1024" not in res_desv.json()["repuestosAMantener"]
