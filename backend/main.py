from fastapi import FastAPI

app = FastAPI(title="Mi primera API", version="0.1.0")

@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "¡Hola, mundo desde FastAPI!"}

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/api/saludo/{nombre}")
def saludo(nombre: str, edad: int = 0) -> dict[str, str]:
    return {"message": f"¡Hola, {nombre}! Tenés {edad} años."}
