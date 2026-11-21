# Formato de preguntas (JSON) — versión 1

Es el formato para importar y exportar preguntas, y el que se pide a la IA. Está pensado para que lo pueda
escribir cualquiera.

```json
{
  "format": "tailor-test/questions",
  "version": 1,
  "questions": [
    {
      "question": "Si 3 kg cuestan 12 €, ¿cuánto cuestan 5 kg?",
      "options": ["18 €", "20 €", "24 €", "15 €"],
      "answer": 1,
      "explanation": "12 / 3 = 4 €/kg → 5 × 4 = 20 €.",
      "difficulty": 1,
      "tags": ["proporciones"]
    }
  ]
}
```

| Campo | Obligatorio | Descripción |
|---|---|---|
| `question` | Sí | Enunciado. Puede incluir saltos de línea (textos, tablas escritas con `|`). |
| `options` | Sí | Entre 2 y 6 opciones de texto. |
| `answer` | Sí | La correcta: índice desde 0 (`1`), letra (`"B"`) o el texto exacto de la opción (`"20 €"`). |
| `explanation` | No | Se muestra al corregir. |
| `difficulty` | No | `1` fácil, `2` media (por defecto), `3` difícil. |
| `tags` | No | Etiquetas libres. |

Tolerancias al importar:

- Se admite directamente el array de preguntas, sin el objeto que lo envuelve.
- Si el JSON viene dentro de texto o de un bloque ```` ```json ````(típico de las IA), se extrae solo.
- Las preguntas inválidas se descartan indicando el motivo; las válidas se importan igualmente.

Limitación de la v1: las imágenes de las preguntas no se exportan en este formato (sí en la copia de
seguridad completa).
