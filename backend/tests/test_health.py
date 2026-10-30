from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_responde_200_y_status_ok():
    respuesta = client.get("/health")
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["status"] == "ok"
    assert cuerpo["servicio"] == "api-stock-planta"


def test_health_no_requiere_token():
    # Sin header Authorization igual debe responder 200 (es público en el contrato).
    assert client.get("/health").status_code == 200
