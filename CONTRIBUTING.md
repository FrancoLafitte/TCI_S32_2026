# CONTRIBUTING

## Introducción

Este documento establece las reglas y el flujo de trabajo que deben seguir los integrantes del equipo al realizar cambios en el proyecto.

El equipo utiliza el modelo **Feature Branch Flow**, establecido por la cátedra para el desarrollo del TCI.

---

## Flujo de trabajo

El desarrollo se realiza mediante ramas independientes para cada cambio o funcionalidad.

La regla principal es:

> **Una feature = una rama = un Pull Request.**

Cada integrante debe crear una rama a partir de `main` actualizado, realizar allí sus cambios y luego solicitar su incorporación mediante un Pull Request.

El flujo general es:

1. Actualizar `main`.
2. Crear una rama para el cambio.
3. Realizar los cambios necesarios.
4. Crear uno o más commits siguiendo la convención establecida.
5. Subir la rama al repositorio remoto.
6. Crear un Pull Request hacia `main`.
7. Solicitar la revisión de un compañero.
8. Realizar las correcciones solicitadas, si las hubiera.
9. Obtener al menos una aprobación.
10. Un compañero realiza el merge del Pull Request.
11. Actualizar nuevamente `main` antes de comenzar una nueva tarea.

---

## Creación de ramas

Las ramas deben crearse a partir de una versión actualizada de `main`.

Primero:

```bash
git checkout main
git pull upstream main
git pull origin main