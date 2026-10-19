# Investigación — [Meccico, Santiago Carlos] (Legajo 33926)

## Parte A — JS asincrónico + fetch + SPA

### Preguntas guía
1. ¿Qué significa que fetch sea asincrónico? ¿Qué pasaría con la página si no lo fuera?
   > Significa que la petición de red se ejecuta en segundo plano sin interrumpir ni bloquear el hilo de ejecución principal de JavaScript. Si fetch fuera síncrono, el navegador se congelaría por completo mientras espera la respuesta del servidor: el usuario no podría hacer scroll, clickear botones ni interactuar con la interfaz hasta que la petición finalice.

2. ¿Por qué respuesta.json() también devuelve una promesa?
   > Porque el cuerpo de la respuesta HTTP se recibe como un flujo de datos (stream) que llega progresivamente por la red. `respuesta.json()` necesita esperar a que se descarguen todos los paquetes del cuerpo y luego parsear el texto a formato JSON, lo cual es un proceso asincrónico que toma tiempo antes de retornar el objeto listo.

3. ¿Qué relación hay entre una SPA y fetch? ¿Por qué la SPA "necesita" pedir datos así?
   > En una SPA (Single Page Application), el navegador carga el HTML inicial una sola vez y no vuelve a recargar la página completa. Por lo tanto, para mostrar o actualizar información nueva, la SPA necesita solicitar al servidor únicamente datos crudos (habitualmente JSON) en segundo plano y redibujar el DOM dinámicamente. `fetch` es la herramienta nativa que hace posible esta comunicación asincrónica sin refrescar la página.

### Búsquedas
| Qué busqué | Fuente (URL) | Qué entendí |
|---|---|---|
| ¿Qué es una SPA (Single Page Application) y en qué se diferencia de una MPA? | https://developer.mozilla.org/es/docs/Glossary/SPA | Una SPA carga una única página HTML y actualiza la interfaz dinámicamente mediante peticiones de datos en segundo plano sin recargar todo el sitio, a diferencia de una MPA tradicional donde cada acción solicita una nueva página HTML completa al servidor. |
| ¿Qué es una promesa (Promise) en JavaScript y para qué sirve? ¿Qué problema resuelve? | https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Promise | Es un objeto que representa el resultado eventual (exitoso o fallido) de una operación asincrónica. Resuelve el problema del "callback hell" (anidamiento inmanejable de callbacks), permitiendo encadenar flujos asincrónicos limpios con `.then()`, manejar errores con `.catch()` y usar `async/await`. |
| ¿Por qué fetch devuelve una promesa y no el dato directamente? | https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch | Porque una petición por red involucra latencia y tiempos de respuesta variables. Devolver una promesa permite que JavaScript continúe ejecutando otras tareas sin bloquear la interfaz mientras el servidor responde. |
| ¿Qué diferencia hay entre XMLHttpRequest (lo viejo) y fetch (lo actual)? | https://es.javascript.info/fetch | `XMLHttpRequest` es una API antigua basada en eventos complejos y callbacks que resulta verbosa y propensa a errores. `fetch` es el estándar moderno basado en Promesas, con una sintaxis mucho más limpia, directa y compatible nativamente con `async/await`. |

### Evidencia
![fetch con then](img/a1_fetch_then.png)
*Evidencia A1: uso de fetch con then y manejo de la respuesta.*

![async/await](img/a2_async_await.png)
*Evidencia A2: implementación equivalente con async/await.*

![404 con respuesta.ok](img/a3_404.png)
*Evidencia A3: validación de respuesta.ok y manejo de errores HTTP.*

## Parte B — React + TypeScript + Vite

### Preguntas guía
1. ¿Relación entre separar datos de la vista (taller 14/09) y el estado de React?
   > 

2. ¿Por qué IncidenciaProps evita errores? ¿Dónde vive esa verificación?
   > 

3. ¿Qué hace Vite que antes hacías a mano?
   > 

### Búsquedas
| Qué busqué | Fuente (URL) | Qué entendí |
|---|---|---|
| ¿Qué es un componente? | https://react.dev/learn/your-first-component | |
| ¿Props vs estado? | https://react.dev/learn/passing-props-to-a-component | |

### Evidencia
![scaffold localhost:5173](img/b1_scaffold.png)
*Evidencia B1: proyecto generado con Vite y levantado en localhost:5173.*

![componente Incidencia](img/b2_incidencia.png)
*Evidencia B2: componente Incidencia con estructura y props tipadas.*

![error de tipos](img/b3_error_tipos.png)
*Evidencia B3: error de tipos detectado por TypeScript al pasar datos incorrectos.*

## Parte C — Contrato OpenAPI + Prism

### Preguntas guía
1. ¿Por qué definir el contrato antes de codificar? ¿Qué desastre evita?
   > 

2. ¿Cómo ayuda un mock server a trabajar en paralelo?
   > 

3. ¿Relación entre el contrato y las reglas de negocio (RN-STOCK, RN-UMBRAL)?
   > 

### Búsquedas
| Qué busqué | Fuente (URL) | Qué entendí |
|---|---|---|
| ¿Qué es un contrato de API? | https://swagger.io/resources/articles/what-is-api-contract/ | |
| ¿OpenAPI vs Swagger? | https://swagger.io/specification/ | |

### Evidencia
![prism mock corriendo](img/c1_prism.png)
*Evidencia C1: servidor mock de Prism levantado y respondiendo peticiones.*

![curl al mock](img/c2_curl.png)
*Evidencia C2: consulta con curl al mock para verificar la respuesta del contrato.*

## Reflexión (máx. 5 líneas)
> 
