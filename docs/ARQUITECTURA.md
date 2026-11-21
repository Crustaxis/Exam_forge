# Arquitectura

## Principios

1. **Gratis para siempre y para todos.** Sin servidor propio: la app es estática y se publica gratis
   (GitHub Pages). No hay costes que obliguen a cobrar ni a poner anuncios.
2. **Los datos son del usuario.** Todo se guarda en el dispositivo (IndexedDB). Sin cuentas ni registro.
   Las copias de seguridad son archivos JSON que el usuario controla.
3. **Primero el móvil.** Diseño pensado para pantalla pequeña y uso con el pulgar; instalable (PWA) y
   usable sin conexión.
4. **IA opcional y sin coste para el proyecto.** La generación con IA funciona copiando y pegando en
   cualquier chat de IA. Conectar proveedores con la clave propia del usuario es un paso posterior.
5. **Siempre tipo test.** Una pregunta = enunciado (texto y/o imagen) + 2–6 opciones + una correcta.

## Tecnologías

| Pieza | Elección | Por qué |
|---|---|---|
| Lenguaje | TypeScript (estricto) | Errores detectados antes de ejecutar; fácil para nuevos colaboradores |
| Interfaz | React 19 | Ecosistema enorme, mucha documentación en español |
| Empaquetado | Vite | Rápido y sencillo |
| PWA | vite-plugin-pwa (Workbox) | Instalación y funcionamiento sin conexión |
| Rutas | React Router (`HashRouter`) | Funciona en cualquier hosting estático sin configurar redirecciones |
| Datos | Dexie (IndexedDB) | Base de datos real en el navegador, con consultas reactivas |
| Validación | Zod | Un único esquema valida lo que se guarda, lo que se importa y las copias |
| Tests | Vitest + fake-indexeddb | Lógica y datos probados sin navegador |

## Estructura

```
src/
  domain/      Lógica pura, sin React ni base de datos (lo más importante y lo más testeado)
    types.ts        Modelo de datos y esquemas Zod
    exam.ts         Montar un examen, responder, puntuar
    interchange.ts  Formato JSON de importación/exportación de preguntas
    random.ts       Barajado y aleatoriedad reproducible
  ai/          Generación de preguntas con IA (de momento: construcción del encargo/prompt)
  data/        Persistencia: base de datos, operaciones (repo), copias, proyecto de ejemplo
  app/         Router y acciones que combinan datos y lógica (p. ej. empezar un examen)
  pages/       Una pantalla por archivo
  components/  Piezas de interfaz reutilizables
  lib/         Utilidades de navegador y formato
```

Regla de dependencias: `pages → app → data → domain`. El dominio no importa nada de las demás capas.

## Modelo de datos

```
Project (proyecto)
 ├─ Topic (tema: nombre, tipo, material de estudio)
 │   └─ Question (enunciado, imagen?, opciones[2..6], correcta, explicación, dificultad, etiquetas, origen)
 ├─ ExamTemplate (tipo de examen: nº preguntas, tiempo, temas, puntuación, nota de corte, modo de corrección)
 └─ Attempt (intento: copia congelada de las preguntas, respuestas, tiempos y resultado)
```

Decisiones:

- **Los intentos guardan una copia de las preguntas.** Si después editas o borras una pregunta, el historial
  no cambia.
- **Reparto equilibrado entre temas.** Al montar un examen se toman preguntas por turnos de cada tema, para
  que un tema con 500 preguntas no se coma uno con 20.
- **Guardado continuo.** Cada respuesta se guarda al momento: cerrar la app no pierde el examen en curso.
- **Imágenes como data URL** reducidas a 1200 px, dentro de la propia pregunta (simple y se incluye en las
  copias de seguridad).
- **Tipos de tema** (`verbal`, `numerical`, `abstract`, `knowledge`, `other`): orientan a la IA sobre qué
  clase de preguntas generar.

## Cambiar el esquema de la base de datos

Las versiones de Dexie se declaran en `src/data/db.ts`. Nunca modifiques una versión ya publicada: añade
`this.version(N + 1)` con los nuevos índices y, si hace falta, un `.upgrade()` que migre los datos. Las
copias de seguridad llevan su propio número de versión (`BACKUP_VERSION`).

## Publicación

Cada push a `main` ejecuta los tests y, si pasan, publica la app en GitHub Pages
(`.github/workflows/deploy.yml`). La ruta base se calcula con el nombre del repositorio.
