# Cómo contribuir

¡Gracias por querer ayudar! Tailor-test es una herramienta libre para cualquiera que prepare un examen.

## Pasos

1. Abre un *issue* contando el error o la idea antes de un cambio grande.
2. Haz un *fork*, crea una rama (`git checkout -b mi-mejora`) y trabaja en ella.
3. Antes de enviar: `npm test` y `npm run build` deben pasar.
4. Abre un *pull request* explicando qué cambia y por qué.

## Convenciones

- **Código** (nombres de variables, funciones, tipos) en inglés; **interfaz y documentación** en español.
- La lógica va en `src/domain/` como funciones puras y con tests. Las pantallas solo muestran y llaman.
- Todo lo que se guarda pasa por los esquemas Zod de `src/domain/types.ts`.
- Cambios de base de datos: nueva versión en `src/data/db.ts`, nunca editar una existente.
- Mensajes de commit breves y en presente: «Añade filtro de dudosas», «Corrige temporizador».
- Sin dependencias nuevas salvo que aporten mucho: la app debe seguir siendo ligera.

## Contenido

No subas preguntas ni material con derechos de autor de terceros (academias, editoriales, exámenes
protegidos). El proyecto de ejemplo usa preguntas originales.
