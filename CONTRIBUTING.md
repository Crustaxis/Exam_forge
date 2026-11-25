# Cómo contribuir

¡Gracias por querer ayudar! Tailor-test es una herramienta libre para cualquiera que prepare un examen.
**No hace falta pedir permiso ni ser colaborador del repositorio**: cualquier persona con cuenta de GitHub
puede proponer cambios con un *fork* y un *pull request* (PR).

> 🇬🇧 English speakers: see [CONTRIBUTING.en.md](CONTRIBUTING.en.md) if it exists, or just open an issue in
> English — it's welcome.

> 🐣 ¿Primera vez en GitHub? Empieza por la [guía rápida de 5 minutos](docs/PRIMERA-CONTRIBUCION.md).

## ¿Por dónde empiezo?

- **Programar**: busca los *issues* con la etiqueta
  [`good first issue`](https://github.com/Crustaxis/Exam_producer/labels/good%20first%20issue). Están pensados
  para una primera contribución y explican qué archivo tocar.
- **Sin programar**: los *issues* con la etiqueta
  [`sin código`](https://github.com/Crustaxis/Exam_producer/labels/sin%20c%C3%B3digo) se hacen desde el
  navegador: bancos de preguntas, traducciones, documentación.
- Comenta en el *issue* «me lo pido» para que nadie más lo empiece a la vez.

## Opción A — Desde el navegador (sin instalar nada)

Sirve para documentación, bancos de preguntas y cambios pequeños.

1. Abre el archivo en GitHub y pulsa el lápiz ✏️ (*Edit this file*). Para un archivo nuevo, entra en la
   carpeta y pulsa **Add file → Create new file**.
2. GitHub te dirá que no tienes permiso de escritura y **creará automáticamente tu copia (*fork*)**. Es
   normal: así funciona para todo el mundo.
3. Haz el cambio, escribe abajo una frase de qué cambias y pulsa **Propose changes**.
4. Pulsa **Create pull request**, rellena la plantilla y envíalo. Listo.

## Opción B — En tu ordenador

Requisitos: [Git](https://git-scm.com) y [Node.js](https://nodejs.org) 22 o superior.

1. Pulsa **Fork** (arriba a la derecha) para crear tu copia en tu cuenta.
2. Clona **tu copia**, no la original:

   ```bash
   git clone https://github.com/TU-USUARIO/Exam_producer.git
   cd Exam_producer
   npm install
   git checkout -b mi-mejora
   ```

3. Haz el cambio y comprueba que todo pasa:

   ```bash
   npm test
   npm run build
   ```

4. Sube la rama a tu copia (`git push -u origin mi-mejora`). GitHub te mostrará un botón
   **Compare & pull request**: púlsalo, rellena la plantilla y envíalo.

¿Tu copia se ha quedado atrás? En tu fork, pulsa **Sync fork → Update branch**.

Para cambios grandes, abre primero un *issue* contando la idea, así hablamos antes de que inviertas tiempo.

## Qué pasa después

- Reviso los PR lo antes posible (normalmente en 1–2 días). Si pido cambios, súbelos a la misma rama y el
  PR se actualiza solo.
- Cuando se fusiona, apareces en la lista de contribuidores del README. ¡Gracias!

## Convenciones

- **Código** (nombres de variables, funciones, tipos) en inglés; **interfaz y documentación** en español.
- La lógica va en `src/domain/` como funciones puras y con tests. Las pantallas solo muestran y llaman.
- Todo lo que se guarda pasa por los esquemas Zod de `src/domain/types.ts`.
- Cambios de base de datos: nueva versión en `src/data/db.ts`, nunca editar una existente.
- Mensajes de commit breves y en presente: «Añade filtro de dudosas», «Corrige temporizador».
- Sin dependencias nuevas salvo que aporten mucho: la app debe seguir siendo ligera.
- Puedes usar herramientas de IA, pero revisa y entiende lo que envías: eres responsable de tu PR.

## Contenido

No subas preguntas ni material con derechos de autor de terceros (academias, editoriales, exámenes
protegidos). Las preguntas de [`bancos/`](bancos/README.md) deben ser **originales** y se publican con la
misma licencia MIT que el resto del proyecto.

## Normas de convivencia

Este proyecto sigue un [código de conducta](CODE_OF_CONDUCT.md). Trata a los demás con respeto.
