# Frontend (React + TypeScript + Vite + pnpm)

SPA que consume el **mock de Prism** generado desde `docs/contrato/openapi.yaml`
y muestra ONLINE/OFFLINE según el **/health real** del backend.

## Correrlo sin Docker (para desarrollar)

Necesitás Node 20+ y pnpm (`npm i -g pnpm`). En 3 terminales:

```bash
# Terminal 1 - mock del contrato (puerto 4010)
cd frontend && pnpm install && pnpm mock

# Terminal 2 - backend real (puerto 8000)
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 3 - la app (puerto 5173)
cd frontend && pnpm dev
```

Abrí http://localhost:5173 y elegí un rol.

## Estructura

```
src/
  api/client.ts     <- único lugar que hace fetch (URL base + token)
  api/tipos.ts      <- tipos TypeScript copiados del contrato
  api/useApi.ts     <- hook para hacer GET al cargar una pantalla
  components/Layout.tsx  <- encabezado, píldora ONLINE (/health) y barra inferior
  pages/<rol>/...   <- una pantalla por mockup
  rol.tsx           <- login simulado (elegir rol)
```

## Tests

```bash
pnpm test
```
