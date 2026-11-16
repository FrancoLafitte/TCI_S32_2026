"""API de Gestión de Stock y Mantenimiento de Planta."""

import json
import os
import threading
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session, init_db
from app.models import Usuario
from app.seed import seed_data
from app.routers import (
    tablero,
    repuestos,
    maquinas,
    incidencias,
    reparaciones,
    compras,
    reservas,
)

VERSION = "0.2.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa la base de datos y precarga datos iniciales al arrancar."""
    init_db()
    seed_data()
    yield


app = FastAPI(
    title="API de Gestión de Stock y Mantenimiento de Planta",
    version=VERSION,
    lifespan=lifespan,
)

# El frontend corre en otro puerto (5173 o 8080), así que habilitamos CORS.
# CORS habilitado para que el frontend (Vite en localhost:5173 o 8080) pueda consumir la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar todos los routers de negocio
app.include_router(tablero.router)
app.include_router(repuestos.router)
app.include_router(maquinas.router)
app.include_router(incidencias.router)
app.include_router(reparaciones.router)
app.include_router(compras.router)
app.include_router(reservas.router)


Rol = Literal["operario", "mantenimiento", "encargado", "gerencia"]


class LoginRequest(BaseModel):
    email: str
    password: str
    captcha_token: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: Rol
    nombre: str
    email: str


LOGIN_CAPTCHA_THRESHOLD = 5
LOGIN_ATTEMPT_TTL_SECONDS = 15 * 60
_login_attempts_lock = threading.Lock()


@dataclass
class LoginAttempt:
    failures: int
    expires_at: float


_login_attempts: dict[str, LoginAttempt] = {}
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def _login_error(
    detail: str,
    *,
    status_code: int,
    captcha_required: bool = True,
) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"detail": detail, "captcha_required": captcha_required},
    )


def _verify_turnstile_token(token: str) -> bool:
    secret = os.getenv("TURNSTILE_SECRET_KEY")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "detail": "El CAPTCHA no está configurado en el servidor",
                "captcha_required": True,
            },
        )

    payload = urlencode({"secret": secret, "response": token}).encode()
    request = UrlRequest(TURNSTILE_VERIFY_URL, data=payload, method="POST")
    try:
        with urlopen(request, timeout=5) as response:
            result = json.loads(response.read())
    except (URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "detail": "No se pudo validar el CAPTCHA; intenta nuevamente",
                "captcha_required": True,
            },
        ) from error

    return isinstance(result, dict) and result.get("success") is True


@app.post("/auth/login", response_model=LoginResponse, tags=["Autenticación"])
def login(
    creds: LoginRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> LoginResponse:
    """Valida credenciales contra la base de datos y devuelve el token y rol."""
    email_normalizado = creds.email.strip().lower()
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()

    with _login_attempts_lock:
        attempt = _login_attempts.get(client_ip)
        if attempt is None or attempt.expires_at <= now:
            attempt = LoginAttempt(failures=0, expires_at=now + LOGIN_ATTEMPT_TTL_SECONDS)
            _login_attempts[client_ip] = attempt

        captcha_required = attempt.failures >= LOGIN_CAPTCHA_THRESHOLD

    if captcha_required:
        if not creds.captcha_token:
            raise _login_error(
                "Completa la verificación CAPTCHA para continuar",
                status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            )
        if not _verify_turnstile_token(creds.captcha_token):
            raise _login_error(
                "La verificación CAPTCHA no es válida; inténtalo nuevamente",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    # Buscamos el usuario en la base de datos
    statement = select(Usuario).where(Usuario.email == email_normalizado)
    usuario = session.exec(statement).first()

    if not usuario or usuario.password != creds.password:
        with _login_attempts_lock:
            attempt.failures += 1
            attempt.expires_at = time.monotonic() + LOGIN_ATTEMPT_TTL_SECONDS
            captcha_required = attempt.failures >= LOGIN_CAPTCHA_THRESHOLD
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Correo o contraseña incorrectos",
                "captcha_required": captcha_required,
            },
        )

    with _login_attempts_lock:
        _login_attempts.pop(client_ip, None)

    rol = usuario.rol  # operario, mantenimiento, encargado, gerencia
    rol = usuario.rol
    token = f"token-{rol}-{int(datetime.now(timezone.utc).timestamp())}"

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        rol=rol,  # type: ignore[arg-type]
        nombre=usuario.nombre,
        email=usuario.email,
    )


@app.get("/health", tags=["Sistema"])
def health() -> dict:
    """Estado del servicio. Público (sin token). Respeta el schema Health del contrato."""
    return {
        "status": "ok",
        "servicio": "api-stock-planta",
        "version": VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
