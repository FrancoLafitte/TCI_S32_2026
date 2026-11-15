import os
import time
from typing import Generator
from sqlmodel import Session, SQLModel, create_engine

# URL de la base de datos: por defecto SQLite local si no hay variable de entorno
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./planta.db")

# En SQLite necesitamos check_same_thread=False para FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    echo=False,  # Cambiar a True si se desea ver las consultas SQL en consola
    connect_args=connect_args,
)


def init_db(max_retries: int = 5, delay: float = 2.0) -> None:
    """Crea todas las tablas definidas en los modelos si todavía no existen.
    
    Incluye reintentos por si la base de datos (PostgreSQL en Docker) todavía
    está terminando de arrancar.
    """
    for intento in range(1, max_retries + 1):
        try:
            SQLModel.metadata.create_all(engine)
            break
        except Exception as e:
            if intento == max_retries:
                raise e
            print(f"[DB] Esperando a la base de datos... intento {intento}/{max_retries}")
            time.sleep(delay)


def get_session() -> Generator[Session, None, None]:
    """Generador de sesiones para inyección de dependencias en FastAPI."""
    with Session(engine) as session:
        yield session
