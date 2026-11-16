import secrets

from fastapi.testclient import TestClient

from app import main as auth


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
