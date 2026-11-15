"""API de Gestión de Stock y Mantenimiento de Planta."""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, status
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


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: Rol
    nombre: str
    email: str


@app.post("/auth/login", response_model=LoginResponse, tags=["Autenticación"])
def login(creds: LoginRequest, session: Session = Depends(get_session)) -> LoginResponse:
    """Valida credenciales contra la base de datos y devuelve el token y rol."""
    email_normalizado = creds.email.strip().lower()

    # Buscamos el usuario en la base de datos
    statement = select(Usuario).where(Usuario.email == email_normalizado)
    usuario = session.exec(statement).first()

    if not usuario or usuario.password != creds.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

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
