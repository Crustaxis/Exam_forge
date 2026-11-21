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
