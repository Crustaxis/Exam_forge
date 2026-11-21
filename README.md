# Tailor-test · Tests a medida

**Tailor-test** es una app web libre y gratuita para preparar exámenes tipo test de cualquier materia:
razonamiento verbal, numérico y abstracto, temarios de oposiciones, asignaturas, certificaciones…
Se instala en el móvil como una app (PWA), funciona sin conexión y **no necesita registro**: tus datos se
quedan en tu dispositivo.

> 🇬🇧 *Tailor-test is a free, open-source, installable web app (PWA) to practise multiple-choice exams on any
> subject. Organise projects and topics, add questions by hand, import them, or generate them with any AI chat,
> and take timed mock exams with custom scoring. Data stays on your device. UI currently in Spanish; contributions
> welcome.*

## Qué puedes hacer

- **Proyectos**: uno por cada examen u oposición que prepares.
- **Temas** dentro de cada proyecto, con su material de estudio (apuntes, temario) y su banco de preguntas.
- **Preguntas tipo test** (2–6 opciones, una correcta, explicación opcional, imágenes para figuras o tablas):
  - escribiéndolas a mano,
  - importándolas desde un archivo JSON,
  - **generándolas con IA**: la app prepara el encargo a partir de tu material; lo pegas en la IA que uses
    (ChatGPT, Gemini, Claude… vale la versión gratuita) y pegas la respuesta de vuelta.
- **Tipos de examen**: número de preguntas, tiempo, temas que entran, penalización por fallo (−1/3, −1/4…),
  nota de corte, corrección al final (simulacro) o al momento (aprendizaje).
- **Hacer exámenes** con temporizador, preguntas marcadas como dudosas y guardado automático.
- **Resultados** con revisión de fallos y explicaciones, e **historial** por proyecto.
- **Copias de seguridad** para no perder nada y pasar tus tests a otro dispositivo.

## Empezar a desarrollar

Requisitos: [Node.js](https://nodejs.org) 22 o superior.

```bash
npm install
npm run dev        # servidor local en http://localhost:5173
npm test           # tests unitarios
npm run build      # versión de producción en dist/
```

Documentación técnica:

- [Arquitectura y decisiones](docs/ARQUITECTURA.md)
- [Formato de preguntas (JSON)](docs/FORMATO-PREGUNTAS.md)
- [Hoja de ruta](docs/ROADMAP.md)
- [Cómo contribuir](CONTRIBUTING.md)

## Licencia

[MIT](LICENSE): puedes usar, copiar, modificar y distribuir Tailor-test libremente.
