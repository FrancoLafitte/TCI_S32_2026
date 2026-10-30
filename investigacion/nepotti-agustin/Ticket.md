### 1. ¿Qué significa que fetch sea asincrónico? ¿Qué pasaría con la página si no lo fuera?

Significa que permite hacer una petición a una API sin detener la ejecución del resto del código. Si no fuera asincrónico, la página podría quedar bloqueada mientras espera la respuesta del servidor.

### 2. ¿Por qué respuesta.json() también devuelve una promesa?

Porque convertir la respuesta recibida en un objeto de JavaScript es un proceso que puede llevar tiempo. Por eso devuelve una promesa que se resuelve cuando los datos están listos para utilizarse.

### 3. ¿Qué relación hay entre una SPA y fetch? ¿Por qué la SPA necesita pedir datos así?

Una SPA permite actualizar el contenido de una página sin recargarla completamente. fetch permite solicitar datos a una API de forma asincrónica, haciendo posible que la SPA muestre información nueva sin interrumpir el funcionamiento de la página.

## 4.5 Preguntas guía

### 1. ¿Qué relación ves entre el patrón "separar datos de la vista" que usaste en el taller de incidencia (clase del 14/09) y el estado de React?

En ambos casos se busca separar la información de la forma en que se muestra. En React el estado permite alacenar datos que pueden cambiar y actualizar la vista automaticamente cuando se modifican.

### 2. ¿Por qué el interface IncidenciaProps evita errores? ¿Dónde "vive" esa verificación: en el navegador o en el editor?

Porque señala en el editor que hemos pasado un tipo de dato erroneo. Mas allá de esto en el navegador este cambio será aceptado. TypeScript solo marca en el error mas no lo prohibe de ser ejecutado.

### 3. ¿Qué hace Vite que antes hacías a mano (o con un script de <head>)?

Vite se encarga de preparar y ejecutar el proyecto. Gestiona los modulos y sus importaciones y actualiza automaticamente la pagina cuando modificamos el código (hot reload). Antes se tena que vincular manualmente los archivos .js con el html a traves de etiquetas script.

## 5.5 Preguntas guía

### 1. ¿Por qué conviene definir el contrato antes de codificar frontend y backend? ¿Qué desastre evita?

Porque permite establecer de antemano cómo se van a comunicar el frontend y el backend, qué datos se van a enviar y qué respuestas se esperan. Esto evita que ambas partes se desarrollen de maneras incompatibles y después haya que modificar el código.

### 2. ¿Cómo ayuda un mock server a que dos personas (una en frontend, otra en backend) trabajen en paralelo?

Un mock server permite simular las respuestas de una API sin necesidad de tener el backend desarrollado. De esta manera, quien trabaja en el frontend puede probar las consultas y las respuestas mientras otra persona desarrolla el backend real.

### 3. ¿Qué relación hay entre el contrato OpenAPI y las reglas de negocio (RN-STOCK, RN-UMBRAL) que ya documentaste en la M1?

Las reglas de negocio establecen las condiciones que debe cumplir el sistema, mientras que el contrato OpenAPI define cómo se comunica esa información mediante la API. Por ejemplo, una regla puede establecer cuándo el stock es insuficiente, y el contrato puede definir cómo se devuelve esa información al frontend.

El contrato describe las respuestas posibles, pero no implementa las reglas de negocio.

## Reflexión.

Lo que mas me costó fue mas que nada entender el funcionamiento de typescript. La ia lo facilitó bastante. Me pareció muy buena funcionalidad del hot reload. La parte de apis costó comprenderla pero fue salindo por prueba y errror.