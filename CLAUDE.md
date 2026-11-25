# Tailor-test — notas para agentes de IA

App web PWA, libre y gratuita, para practicar exámenes tipo test. Sin backend: datos en IndexedDB.
Lee `docs/ARQUITECTURA.md` antes de cambios de estructura.

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm test` — Vitest (dominio y datos)
- `npm run build` — typecheck + build (debe pasar antes de cada commit)

## Reglas

- Identificadores en inglés; textos de interfaz y documentación en español.
- Lógica nueva → función pura en `src/domain/` con su test. Las páginas no contienen reglas de negocio.
- Escrituras en la base de datos solo a través de `src/data/repo.ts` (valida con Zod).
- Esquema de Dexie: añadir versión nueva, nunca editar una existente.
- Mobile-first; reutiliza las clases de `src/styles.css` antes de crear estilos nuevos.
- Nada de servicios de pago ni servidores propios: la app debe poder publicarse como estática.
- El autor está aprendiendo (ciclo DAM): explica en los PR el porqué de cada decisión.

## «Haz el siguiente punto pendiente»

Cuando te pidan eso (o algo parecido: «siguiente tarea», «el siguiente de la lista»):

1. Abre `docs/TAREAS.md` y toma la **primera** casilla sin marcar (`- [ ]`). Haz solo esa.
2. Antes de empezar, comprueba con `gh api repos/Crustaxis/Exam_producer/pulls` que no haya ya un PR abierto
   para esa tarea; si lo hay, pasa a la siguiente.
3. Crea una rama nueva desde `main` actualizado (p. ej. `docs/...`, `feat/...`, `test/...`, `chore/...`).
4. Haz el cambio siguiendo las reglas de arriba; `npm test` y `npm run build` deben pasar.
5. En el mismo commit, marca la tarea en `docs/TAREAS.md` como `[x]` con el número del PR.
6. Abre el PR contra `main` con un cuerpo breve: qué cambia y por qué. No lo fusiones: lo revisa el autor.
7. Responde con el enlace al PR y cuál es la siguiente tarea de la lista.

Si la lista se acaba, propón 10 tareas pequeñas nuevas y añádelas al final en ese mismo PR.
