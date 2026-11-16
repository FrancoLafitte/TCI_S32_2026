import secrets
import importlib

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from sqlalchemy.pool import StaticPool

from app import main as auth
from app import database
from app.models import Usuario
from app.migrate_passwords import migrate_passwords
from app.security import verify_password


@pytest.fixture(autouse=True)
def base_aislada(monkeypatch):
    """Cada prueba usa usuarios nuevos en SQLite en memoria, sin tocar datos reales."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    monkeypatch.setattr(database, "engine", engine)
    monkeypatch.setattr(importlib.import_module("app.seed"), "engine", engine)
    monkeypatch.setattr(auth, "_login_attempts", {})
    yield
    engine.dispose()


@pytest.mark.parametrize(
    "email,password,expected_status",
    [
        ("operario@planta.com", "1234", 200),
        ("operario@planta.com", "incorrecta", 401),
        ("inexistente@planta.com", "1234", 401),
    ],
)
def test_login_con_hash(email, password, expected_status):
    with TestClient(auth.app) as client:
        response = client.post("/auth/login", json={"email": email, "password": password})
        assert response.status_code == expected_status
        if expected_status == 200:
            assert response.json()["email"] == email
            assert "password" not in response.json()


def test_login_de_usuario_migrado():
    with TestClient(auth.app) as client:
        with Session(database.engine) as session:
            usuario = session.exec(select(Usuario).where(Usuario.email == "operario@planta.com")).one()
            usuario.password = "1234"
            session.add(usuario)
            session.commit()
            assert migrate_passwords(session) == 1
        response = client.post("/auth/login", json={"email": "operario@planta.com", "password": "1234"})
        assert response.status_code == 200
        assert response.json()["rol"] == "operario"


def test_arranque_migra_usuarios_antiguos_una_sola_vez():
    database.init_db()
    with Session(database.engine) as session:
        usuario = Usuario(email="anterior@planta.com", password="clave-original", nombre="Ana", rol="operario")
        session.add(usuario)
        session.commit()
        usuario_id = usuario.id

    with TestClient(auth.app) as client:
        response = client.post("/auth/login", json={"email": "anterior@planta.com", "password": "clave-original"})
        assert response.status_code == 200
        with Session(database.engine) as session:
            usuario = session.get(Usuario, usuario_id)
            first_hash = usuario.password
            assert verify_password("clave-original", first_hash)
            assert usuario.nombre == "Ana"

    # Un nuevo arranque conserva exactamente el mismo hash y permite ingresar.
    with TestClient(auth.app) as client:
        with Session(database.engine) as session:
            assert session.get(Usuario, usuario_id).password == first_hash
        response = client.post("/auth/login", json={"email": "anterior@planta.com", "password": "clave-original"})
        assert response.status_code == 200


def test_login_verifica_turnstile_despues_de_cinco_fallos(monkeypatch):
    monkeypatch.setattr(auth, "_verify_turnstile_token", lambda token: token == "valid-token")
    puerto = 50000 + secrets.randbelow(10000)

    with TestClient(auth.app, client=("auth-test", puerto)) as client:
        for intento in range(5):
            respuesta = client.post(
                "/auth/login",
                json={"email": "operario@planta.com", "password": "incorrecta"},
            )
            assert respuesta.status_code == 401
            assert respuesta.json()["detail"]["captcha_required"] is (intento == 4)

        respuesta_sin_token = client.post(
            "/auth/login",
            json={"email": "operario@planta.com", "password": "1234"},
        )
        assert respuesta_sin_token.status_code == 428
        assert respuesta_sin_token.json()["detail"]["captcha_required"] is True

        respuesta_token_invalido = client.post(
            "/auth/login",
            json={
                "email": "operario@planta.com",
                "password": "1234",
                "captcha_token": "invalid-token",
            },
        )
        assert respuesta_token_invalido.status_code == 400
        assert respuesta_token_invalido.json()["detail"]["captcha_required"] is True

        respuesta_login = client.post(
            "/auth/login",
            json={
                "email": "operario@planta.com",
                "password": "1234",
                "captcha_token": "valid-token",
            },
        )
        assert respuesta_login.status_code == 200
        assert respuesta_login.json()["email"] == "operario@planta.com"
