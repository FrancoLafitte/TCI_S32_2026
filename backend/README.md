# Backend - API de Gestión de Stock y Mantenimiento de Planta
FastAPI + SQLModel + PostgreSQL / SQLite.

## Contraseñas hasheadas

Las contraseñas nuevas se almacenan con Argon2id mediante `pwdlib`. El login
verifica el hash; no acepta contraseñas almacenadas en texto plano. El frontend
no requiere cambios y los usuarios de prueba siguen ingresando con `1234`.

### Actualizar una instalación existente con Docker

Desde la raíz del repositorio:

```sh
docker compose up -d --build backend
```

Al arrancar, el backend convierte automáticamente las contraseñas existentes en
la base configurada por `DATABASE_URL`, antes de aceptar pedidos. Conserva usuarios,
identificadores y los demás datos. No hace falta ejecutar comandos de migración
ni borrar el volumen de PostgreSQL. Las contraseñas de acceso siguen siendo las mismas.
Una base nueva recibe hashes directamente desde el seed.

La comprobación se realiza en cada arranque, pero solo se convierten las contraseñas
que todavía están en texto plano. Los hashes Argon2 existentes no se modifican.
La migración se confirma en una única transacción; si falla, el backend no comienza
a aceptar pedidos. No se muestran contraseñas ni hashes.

### Desarrollo local y comprobación

Desde `backend/`, con `DATABASE_URL` apuntando a la base que quieras actualizar
(por defecto, `planta.db` de SQLite en el directorio actual):

```sh
uv sync
uv run uvicorn app.main:app --reload
```

El arranque local también migra automáticamente. Para ejecutar las pruebas:

```sh
uv run pytest tests/test_security.py tests/test_auth.py tests/test_migrate_passwords.py -q
```

En `http://localhost:8000/docs`, prueba `POST /auth/login` con un usuario de prueba:
`1234` debe devolver 200 y una contraseña incorrecta debe devolver 401.
El endpoint nunca devuelve la contraseña ni su hash. Las pruebas usan SQLite
en memoria y no modifican la base de la aplicación.

En un despliegue público debe usarse HTTPS para proteger la contraseña en tránsito;
el hashing protege su almacenamiento. El hashing no modifica el mecanismo actual
de tokens ni de permisos por rol.

## Login y CAPTCHA de prueba

Después de cinco intentos fallidos desde una misma IP, `/auth/login` requiere un token
de Cloudflare Turnstile. El backend valida el token con la API de Cloudflare antes de
continuar con el inicio de sesión.

Para el TP, Docker Compose usa por defecto claves oficiales de prueba de Turnstile: no hace
falta crear una cuenta ni configurar un `.env`, y la site key fuerza un desafío interactivo
que funciona en `localhost`. Levanta el proyecto con `docker compose up --build`.

Si existe un `.env` local con otros valores, Compose los prioriza. Para usar las claves
del TP, copia `.env.example` a `.env` o reemplaza allí ambas claves por los valores de
prueba. La site key se incorpora al frontend durante el build; reconstruye las imágenes
si cambias las claves.

Estas claves son públicas y solo sirven para desarrollo: no las uses en producción. Si
alguna vez se despliega la aplicación, crea un widget propio en Cloudflare y configura sus
claves en `.env`; la secret key debe mantenerse privada.

El contador se guarda en memoria por IP y vence después de 15 minutos sin actividad; se
reinicia al reiniciar el backend y no se comparte entre procesos.
