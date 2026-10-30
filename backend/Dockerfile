# Imagen oficial de uv con Python 3.12 ya instalado
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# 1) Copiamos solo la definición de dependencias (así Docker cachea este paso)
COPY pyproject.toml ./
COPY uv.lock* ./
RUN uv sync --no-dev

# 2) Copiamos el código
COPY app ./app

EXPOSE 8000

# 3) Arrancamos el servidor
CMD ["uv", "run", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
