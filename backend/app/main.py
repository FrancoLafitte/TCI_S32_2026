"""API de Gestión de Stock y Mantenimiento de Planta.

M3 (walking skeleton): solo existe GET /health. El resto de los endpoints del
contrato (docs/contrato/openapi.yaml) los sirve el mock de Prism hasta la M4.
"""

import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

VERSION = "0.2.0"

app = FastAPI(
    title="API de Gestión de Stock y Mantenimiento de Planta",
    version=VERSION,
)

# El frontend corre en otro puerto (5173 o 8080), así que hay que habilitar CORS.
origenes = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origenes],
    allow_methods=["*"],
    allow_headers=["*"],
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
