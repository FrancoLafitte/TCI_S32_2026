# Backend - API de Gestión de Stock y Mantenimiento de Planta
FastAPI + SQLModel + PostgreSQL / SQLite.

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
