# Investigación — [Farias, Ignacio] (Legajo 33650)

## Parte A — JS asincrónico + fetch + SPA

### Preguntas guía
1. ¿Qué significa que fetch sea asincrónico? ¿Qué pasaría si no lo fuera?
   > Significa que realiza una peticion a un servidor sin detener la ejecucion del resto del programa mientras espera respuesta. Si no fuera asincronico la pagina quedaría bloqueada esperando respuesta del servidor y quedaría congelada durante una petición lenta.
2. ¿Por qué respuesta.json() también devuelve una promesa?
   > Porque convertir la respuesta en JSON implica leer y procesar el contenido que llegó desde el servidor. Ese proceso puede tomar tiempo, por lo que response.json() devuelve una Promise que se resuelve cuando los datos ya fueron procesados y están disponibles como un objeto JavaScript.
3. ¿Qué relación hay entre una SPA y fetch?
   > Una SPA es una app web que carga una pagina principal y luego actualiza o refresca su contenido sin tener que cargar toda la pagina cada vez que el usuario hace algo. Fetch permita que la SPA se comunique con un servidor o una API para obtener o enviar datos sin recargar la pagina completa.

### Búsquedas
| Qué busqué | Fuente (URL) | Qué entendí |
|---|---|---|
| ¿Qué es una SPA? |https://developer.mozilla.org/es/docs/Glossary/SPA |Una SPA actualiza el contenido de una página sin realizar una recarga completa cada vez que cambia la información. |
| ¿Qué es una Promise? | https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Promise| Una Promise representa el resultado eventual de una operación asincrónica, que puede resolverse o rechazarse.|

### Evidencia
![fetch con then](capturas/a1_fetch_then.png)
*Evidencia A1: uso de fetch con then y manejo de la respuesta.*

![async/await](capturas/a2_async_await.png)
*Evidencia A2: implementación equivalente con async/await.*

![404 con respuesta.ok](capturas/a3_404.png)
*Evidencia A3: validación de respuesta.ok y manejo de errores HTTP.*

## Parte B — React + TypeScript + Vite

### Preguntas guía
1. ¿Relación entre separar datos de la vista (taller 14/09) y el estado de React?
Separar los datos de la vista significa evitar que la información esté mezclada directamente con el código que muestra la interfaz. En React, el estado permite guardar datos que pueden cambiar y hacer que el componente se vuelva a renderizar cuando esos datos cambian.

De esta manera, la vista muestra el estado actual de los datos sin tener que modificar manualmente el HTML cada vez que cambia la información.
2. ¿Por qué IncidenciaProps evita errores? ¿Dónde vive esa verificación?
IncidenciaProps permite definir qué propiedades debe recibir el componente Incidencia y qué tipo de dato tiene cada una.

Por ejemplo, si una propiedad debería ser un string y se intenta pasar un number, TypeScript puede detectar el error antes de ejecutar el programa.

La verificación vive principalmente en TypeScript, durante el análisis y compilación del código, y no en React en sí.
3. ¿Qué hace Vite que antes hacías a mano?
Vite automatiza varias tareas necesarias para desarrollar una aplicación web. Se encarga de crear la estructura inicial del proyecto, ejecutar el servidor de desarrollo, actualizar los cambios rápidamente y preparar el proyecto para producción.

Antes muchas de estas tareas había que configurarlas manualmente utilizando diferentes herramientas.

### Búsquedas
| Qué busqué | Fuente (URL) | Qué entendí |
|---|---|---|
| ¿Qué es un componente? |https://react.dev/learn/your-first-component | Un componente es una parte reutilizable de la interfaz que puede recibir datos y devolver elementos visuales.|
| ¿Props vs estado? |https://react.dev/learn/passing-props-to-a-component |Las props son datos que recibe un componente desde afuera, mientras que el estado representa información que el componente puede mantener y modificar. |

### Evidencia
![scaffold localhost:5173](capturas/b1_scaffold.png)
*Evidencia B1: proyecto generado con Vite y levantado en localhost:5173.*

![componente Incidencia](capturas/b2_incidencia.png)
*Evidencia B2: componente Incidencia con estructura y props tipadas.*

![error de tipos](capturas/b3_error_tipos.png)
*Evidencia B3: error de tipos detectado por TypeScript al pasar datos incorrectos.*

## Parte C — Contrato OpenAPI + Prism

### Preguntas guía
1. ¿Por qué definir el contrato antes de codificar? ¿Qué desastre evita?
Definir el contrato antes de programar permite acordar cómo va a funcionar la API: qué endpoints existen, qué datos recibe y qué respuestas devuelve.

Esto evita que frontend y backend trabajen con formatos diferentes y después haya que rehacer código para que ambos sean compatibles.
2. ¿Cómo ayuda un mock server a trabajar en paralelo?
Un mock server permite simular el comportamiento de la API aunque el backend todavía no esté terminado.

Por ejemplo, el frontend puede realizar peticiones a Prism y recibir respuestas similares a las que devolverá la API real. De esta forma, frontend y backend pueden trabajar al mismo tiempo sin tener que esperar a que el otro termine.
3. ¿Relación entre el contrato y las reglas de negocio (RN-STOCK, RN-UMBRAL)?
El contrato define cómo se comunica la aplicación con la API, mientras que las reglas de negocio definen qué debe hacer el sistema ante determinadas situaciones.

Por ejemplo, RN-STOCK o RN-UMBRAL pueden determinar cuándo una incidencia es válida o cuándo debe generarse una determinada respuesta. El contrato puede documentar los datos y respuestas relacionados con esas reglas, pero no reemplaza a las reglas de negocio.

### Búsquedas
| Qué busqué | Fuente (URL) | Qué entendí |
|---|---|---|
| ¿Qué es un contrato de API? | https://swagger.io/resources/articles/what-is-api-contract/| Es una definición acordada de cómo los distintos componentes se comunican mediante una API, incluyendo sus operaciones, datos y respuestas.|
| ¿OpenAPI vs Swagger? |https://swagger.io/specification/ |OpenAPI es una especificación estándar para describir APIs. Swagger es el conjunto de herramientas que permite trabajar con esa especificación. |

### Evidencia
![prism mock corriendo](capturas/c1_prism.png)
*Evidencia C1: servidor mock de Prism levantado y respondiendo peticiones.*

![curl al mock](capturas/c2_curl.png)
*Evidencia C2: consulta con curl al mock para verificar la respuesta del contrato.*

## Reflexión (máx. 5 líneas)
Lo que más me costó fue entender cómo se relacionaban las distintas herramientas y conceptos, especialmente las Promises, fetch y el funcionamiento de una SPA. Lo pude destrabar probando ejemplos pequeños y viendo qué ocurría con then() y async/await. También me ayudó comprobar las peticiones utilizando el mock server de Prism y curl, ya que pude ver directamente cómo se comunicaban las partes de la aplicación.