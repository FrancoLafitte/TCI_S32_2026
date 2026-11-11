"""API de Gestión de Stock y Mantenimiento de Planta.

M3 (walking skeleton): solo existe GET /health. El resto de los endpoints del
contrato (docs/contrato/openapi.yaml) los sirve el mock de Prism hasta la M4.
"""

import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

VERSION = "0.2.0"

app = FastAPI(
    title="API de Gestión de Stock y Mantenimiento de Planta",
    version=VERSION,
)

# El frontend corre en otro puerto (5173 o 8080), así que hay que habilitar CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# Usuarios del sistema precargados por rol
USUARIOS_SISTEMA: dict[str, dict] = {
    "operario@planta.com": {
        "password": "1234",
        "rol": "operario",
        "nombre": "Juan Pérez",
    },
    "mantenimiento@planta.com": {
        "password": "1234",
        "rol": "mantenimiento",
        "nombre": "Carlos Gómez",
    },
    "encargado@planta.com": {
        "password": "1234",
        "rol": "encargado",
        "nombre": "Dra. Laura Martínez",
    },
    "gerencia@planta.com": {
        "password": "1234",
        "rol": "gerencia",
        "nombre": "Ing. Roberto Rossi",
    },
}


@app.post("/auth/login", response_model=LoginResponse, tags=["Autenticación"])
def login(creds: LoginRequest) -> LoginResponse:
    """Valida credenciales y devuelve el token y rol para redirigir al panel correspondiente."""
    usuario = USUARIOS_SISTEMA.get(creds.email.strip().lower())
    if not usuario or usuario["password"] != creds.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    rol: Rol = usuario["rol"]
    token = f"token-{rol}-{int(datetime.now(timezone.utc).timestamp())}"

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        rol=rol,
        nombre=usuario["nombre"],
        email=creds.email.strip().lower(),
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
