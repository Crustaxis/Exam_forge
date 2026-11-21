import { TOPIC_KIND_LABELS, type Topic, type TopicKind } from '../domain/types';
import { INTERCHANGE_FORMAT, INTERCHANGE_VERSION } from '../domain/interchange';

/**
 * Generación de preguntas con IA — modo "copiar y pegar".
 *
 * La app construye un prompt que el usuario pega en CUALQUIER chat de IA
 * (gratuito o de pago) y luego pega la respuesta JSON de vuelta. Así la
 * herramienta funciona sin claves de API ni costes para el proyecto.
 * La conexión directa con proveedores (clave propia del usuario) está en el roadmap.
 */

export interface GenerationRequest {
  topic: Pick<Topic, 'name' | 'kind' | 'material'>;
  count: number;
  difficulty: 1 | 2 | 3 | 'mixed';
  optionsPerQuestion: number;
  language: string;
  extraInstructions?: string;
}

const DIFFICULTY_TEXT = {
  1: 'fácil',
  2: 'media',
  3: 'difícil',
  mixed: 'variada (mezcla de fácil, media y difícil)',
} as const;

const KIND_GUIDANCE: Record<TopicKind, string> = {
  verbal:
    'Preguntas de razonamiento verbal: un texto breve (100-200 palabras) seguido de una afirmación o pregunta; la respuesta debe deducirse SOLO del texto, sin conocimientos externos. Incluye distractores plausibles (afirmaciones parcialmente ciertas, que exageran o que el texto no permite concluir).',
  numerical:
    'Preguntas de razonamiento numérico: datos en una tabla escrita en texto (columnas separadas por " | ") y una pregunta que exija porcentajes, ratios, variaciones o reglas de tres. Las opciones incorrectas deben corresponder a errores de cálculo típicos.',
  abstract:
    'Preguntas de razonamiento abstracto descritas en texto: series de letras, números o símbolos con una regla oculta; pide el siguiente elemento. Explica la regla en la explicación.',
  knowledge:
    'Preguntas de conocimientos sobre el material proporcionado. Cada pregunta debe poder responderse con el material; evita preguntas triviales o ambiguas.',
  other: 'Preguntas tipo test sobre el material proporcionado.',
};

export const MAX_MATERIAL_CHARS = 60_000;

export function buildGenerationPrompt(req: GenerationRequest): string {
  const material = req.topic.material.trim();
  const truncated = material.length > MAX_MATERIAL_CHARS;
  const materialText = truncated ? material.slice(0, MAX_MATERIAL_CHARS) : material;
  const letters = 'ABCDEF'.slice(0, req.optionsPerQuestion).split('').join(', ');

  return [
    `Eres un experto en diseñar exámenes tipo test de alta calidad.`,
    ``,
    `TAREA: crea ${req.count} preguntas tipo test en ${req.language} sobre el tema "${req.topic.name}" (${TOPIC_KIND_LABELS[req.topic.kind]}).`,
    ``,
    `REGLAS:`,
    `- ${KIND_GUIDANCE[req.topic.kind]}`,
    `- Cada pregunta tiene exactamente ${req.optionsPerQuestion} opciones (${letters}) y UNA sola respuesta correcta.`,
    `- Dificultad ${DIFFICULTY_TEXT[req.difficulty]}.`,
    `- Reparte la posición de la respuesta correcta entre todas las opciones.`,
    `- Evita "todas las anteriores" y "ninguna de las anteriores".`,
    `- Añade una explicación breve de por qué la respuesta correcta lo es y por qué fallan las demás.`,
    req.extraInstructions?.trim() ? `- ${req.extraInstructions.trim()}` : null,
    ``,
    `FORMATO DE SALIDA: responde SOLO con un bloque JSON válido, sin texto adicional, con esta estructura:`,
    '```json',
    JSON.stringify(
      {
        format: INTERCHANGE_FORMAT,
        version: INTERCHANGE_VERSION,
        questions: [
          {
            question: 'Enunciado de la pregunta',
            options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'].slice(0, req.optionsPerQuestion),
            answer: 1,
            explanation: 'Por qué la opción B es la correcta.',
            difficulty: 2,
          },
        ],
      },
      null,
      2,
    ),
    '```',
    `"answer" es el índice de la opción correcta empezando en 0 (0 = A, 1 = B…). "difficulty": 1 fácil, 2 media, 3 difícil.`,
    ``,
    materialText
      ? `MATERIAL DE ESTUDIO${truncated ? ' (recortado)' : ''}:\n"""\n${materialText}\n"""`
      : `No hay material adjunto: usa tu conocimiento general del tema y sé riguroso.`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}
