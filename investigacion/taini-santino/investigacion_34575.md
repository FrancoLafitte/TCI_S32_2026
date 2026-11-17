# Investigación — Taini, Santino (Legajo 34575)

## Parte A — JS asincrónico + fetch + SPA

**Preguntas guía:**
1. **¿Qué significa que fetch sea asincrónico? ¿Qué pasaría con la página si no lo fuera?**
Que sea asincrónico significa que la petición de datos al servidor se realiza en segundo plano sin detener la ejecución del resto del código. Si no lo fuera, la página web se congelaría por completo y el usuario no podría hacer nada hasta que el servidor responda.
2. **¿Por qué respuesta.json() también devuelve una promesa?**
Porque leer el cuerpo de la respuesta HTTP y transformarlo en un objeto JSON es un proceso que puede tomar tiempo (especialmente si los datos son pesados), por lo que ocurre de forma asincrónica.
3. **¿Qué relación hay entre una SPA y fetch? ¿Por qué la SPA "necesita" pedir datos así?**
Las SPA (Single Page Applications) no recargan la página completa cada vez que navegas. Necesitan usar `fetch` para pedir solo los datos específicos al backend (en formato JSON) y luego actualizar dinámicamente esa porción de la interfaz mediante JavaScript sin refrescar el navegador.

**Búsquedas:**
- **Búsqueda 1:** ¿Qué es una SPA vs MPA?
  - **Fuente:** https://developer.mozilla.org/es/docs/Glossary/SPA
  - **Qué entendí:** Que la SPA carga una sola vez el HTML y luego la navegación se maneja con JS pidiendo datos por APIs, mientras que la MPA pide un HTML completamente nuevo al servidor con cada click.
- **Búsqueda 2:** ¿Diferencia entre fetch y XMLHttpRequest?
  - **Fuente:** https://es.javascript.info/fetch
  - **Qué entendí:** XMLHttpRequest es la API antigua basada en eventos y callbacks, mientras que fetch es la forma moderna que utiliza Promesas, haciendo el código mucho más limpio y legible.

**Evidencia de la actividad guiada:**
<img width="1197" height="253" alt="captura_fetch" src="https://github.com/user-attachments/assets/cda301b0-92b4-4857-8d25-bcb71c448c05" />


---

## Parte B — React + TypeScript + Vite

**Preguntas guía:**
1. **¿Qué relación ves entre el patrón "separar datos de la vista" del taller de incidencia y el estado de React?**
En el taller de JS nativo teníamos que actualizar manualmente los elementos HTML cuando el dato cambiaba. En React, el "estado" encapsula ese dato y, al actualizar el estado, React se encarga de re-renderizar la vista automáticamente, logrando esa separación de forma más limpia.
2. **¿Por qué el interface IncidenciaProps evita errores? ¿Dónde "vive" esa verificación: en el navegador o en el editor?**
Evita errores porque le dice estrictamente a React qué forma deben tener los datos (ej: un string para la máquina). Esta verificación vive en tiempo de desarrollo en el editor (gracias a TypeScript), no en el navegador.
3. **¿Qué hace Vite que antes hacías a mano?**
Vite se encarga de empaquetar todo nuestro código, transpilar TypeScript y JSX a JavaScript estándar (que los navegadores pueden entender) y levanta un servidor de desarrollo con recarga rápida (hot reload) automáticamente.

**Búsquedas:**
- **Búsqueda 1:** ¿Por qué usar componentes en React?
  - **Fuente:** https://es.react.dev/learn/your-first-component
  - **Qué entendí:** Permiten dividir la interfaz de usuario en partes independientes, pequeñas y reutilizables, lo que hace que el código sea más ordenado y fácil de mantener.
- **Búsqueda 2:** ¿Qué es JSX?
  - **Fuente:** https://es.react.dev/learn/writing-markup-with-jsx
  - **Qué entendí:** Es una extensión de sintaxis para JavaScript que permite escribir marcas similares a HTML dentro del código de JS, para describir fácilmente cómo se debe ver la interfaz.

**Evidencia:**
<img width="2509" height="1351" alt="captura_vite" src="https://github.com/user-attachments/assets/dc3b1fbc-1d43-4330-8299-eb30ec1767ea" />

<img width="1897" height="1016" alt="Incidencia" src="https://github.com/user-attachments/assets/06727695-19f1-43f7-8ad4-92de9722fd07" />

<img width="1251" height="687" alt="captura_error_ts" src="https://github.com/user-attachments/assets/7e5ca3f7-50f4-4ca2-9e5d-83c73fde96f3" />


---

## Parte C — Contrato OpenAPI + Prism

**Preguntas guía:**
1. **¿Por qué conviene definir el contrato antes de codificar frontend y backend? ¿Qué desastre evita?**
Conviene para que ambos equipos acuerden cómo se van a comunicar. Evita el desastre de llegar a la etapa de integración en la M5 y descubrir que el frontend manda los datos en un formato que el backend no entiende o no esperaba, lo que rompería la app.
2. **¿Cómo ayuda un mock server a que dos personas trabajen en paralelo?**
El mock server simula el backend real devolviendo datos falsos basados en el contrato. Esto le permite a la persona del frontend construir la interfaz visual y hacer peticiones sin tener que esperar días o semanas a que la persona del backend termine de codificar la API real.
3. **¿Qué relación hay entre el contrato OpenAPI y las reglas de negocio (RN-STOCK, RN-UMBRAL) de la M1?**
Las reglas de negocio definen cómo se debe comportar el sistema (ej: si se supera un umbral de stock). El contrato OpenAPI expone esas reglas definiendo endpoints (ej: actualizar stock) y qué códigos de error debe devolver la API (ej: 400 Bad Request) si el frontend intenta romper alguna de esas reglas.

**Búsquedas:**
- **Búsqueda 1:** ¿OpenAPI y Swagger son lo mismo?
  - **Fuente:** https://swagger.io/blog/api-strategy/difference-between-swagger-and-openapi/
  - **Qué entendí:** OpenAPI es la especificación (el estándar formal), mientras que Swagger es el conjunto de herramientas (como Swagger UI o Swagger Editor) creadas para trabajar con ese estándar.
- **Búsqueda 2:** ¿Qué es un $ref en un documento OpenAPI?
  - **Fuente:** https://learn.openapis.org/specification/components.html
  - **Qué entendí:** `$ref` se usa para referenciar componentes reutilizables (como los esquemas de datos o respuestas). Evita tener que repetir la misma estructura de JSON en diferentes endpoints, manteniendo el archivo YAML limpio.

**Evidencia:**
<img width="1111" height="414" alt="captura_prism_corriendo" src="https://github.com/user-attachments/assets/e040f1b6-8ffb-4f05-858f-8a6854278f1f" />

<img width="2518" height="1266" alt="captura_peticion_mock" src="https://github.com/user-attachments/assets/c7a99afe-f227-4079-a5fd-cdfd71a7ca54" />


---

## Reflexión
Lo que más me costó fue entender cómo OpenAPI y Prism se conectan para generar el mock server y responder peticiones, ya que nunca lo había usado. Lo destrabé leyendo con paciencia la documentación de Prism, y probando comandos en la consola hasta que respondió el JSON falso.
