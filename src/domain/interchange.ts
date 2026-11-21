import { z } from 'zod';
import { MAX_OPTIONS, MIN_OPTIONS, questionSchema, type Question, type QuestionSource } from './types';
import { newId } from './random';

/**
 * Formato de intercambio de preguntas (ver docs/FORMATO-PREGUNTAS.md).
 *
 * Pensado para que lo escriba una persona o una IA sin esfuerzo:
 *   { "format": "tailor-test/questions", "version": 1, "questions": [ … ] }
 * También se acepta directamente el array de preguntas.
 */
export const INTERCHANGE_FORMAT = 'tailor-test/questions';
export const INTERCHANGE_VERSION = 1;

const LETTERS = 'ABCDEF';

const interchangeQuestionSchema = z.object({
  question: z.string().trim().min(1, 'Falta el enunciado ("question")'),
  options: z
    .array(z.string().trim().min(1, 'Hay una opción vacía'))
    .min(MIN_OPTIONS, `Hacen falta al menos ${MIN_OPTIONS} opciones`)
    .max(MAX_OPTIONS, `Máximo ${MAX_OPTIONS} opciones`),
  /** Índice desde 0, letra ("B") o el texto exacto de la opción correcta. */
  answer: z.union([z.number().int(), z.string().trim().min(1)]),
  explanation: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  tags: z.array(z.string()).optional(),
});
export type InterchangeQuestion = z.infer<typeof interchangeQuestionSchema>;

export interface ParsedImport {
  questions: InterchangeQuestion[];
  errors: string[];
}

/** Extrae el JSON de una respuesta que puede venir con texto o bloques ```json alrededor. */
export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.search(/[[{]/);
  if (start === -1) return raw.trim();
  const open = raw[start];
  const close = open === '[' ? ']' : '}';
  const end = raw.lastIndexOf(close);
  return end > start ? raw.slice(start, end + 1) : raw.slice(start);
}

/** Convierte "answer" en el índice de la opción correcta, o null si no se puede. */
export function resolveAnswerIndex(answer: number | string, options: string[]): number | null {
  if (typeof answer === 'number') return answer >= 0 && answer < options.length ? answer : null;
  const trimmed = answer.trim();
  if (/^[A-Fa-f]$/.test(trimmed)) {
    const idx = LETTERS.indexOf(trimmed.toUpperCase());
    return idx < options.length ? idx : null;
  }
  if (/^\d+$/.test(trimmed)) {
    const idx = Number(trimmed);
    return idx < options.length ? idx : null;
  }
  const byText = options.findIndex((o) => o.trim().toLowerCase() === trimmed.toLowerCase());
  return byText === -1 ? null : byText;
}

export function parseQuestionsJson(raw: string): ParsedImport {
  let data: unknown;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    return { questions: [], errors: ['El texto no es un JSON válido.'] };
  }

  const list: unknown = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && 'questions' in data
      ? (data as { questions: unknown }).questions
      : null;

  if (!Array.isArray(list)) {
    return {
      questions: [],
      errors: ['No se encuentra la lista de preguntas (se espera un array o un objeto con "questions").'],
    };
  }

  const questions: InterchangeQuestion[] = [];
  const errors: string[] = [];
  list.forEach((item, i) => {
    const parsed = interchangeQuestionSchema.safeParse(item);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((iss) => iss.message).join('; ');
      errors.push(`Pregunta ${i + 1}: ${msg}`);
      return;
    }
    if (resolveAnswerIndex(parsed.data.answer, parsed.data.options) === null) {
      errors.push(`Pregunta ${i + 1}: la respuesta "${parsed.data.answer}" no corresponde a ninguna opción`);
      return;
    }
    questions.push(parsed.data);
  });
  return { questions, errors };
}

export function toQuestions(
  items: readonly InterchangeQuestion[],
  target: { projectId: string; topicId: string; source: QuestionSource },
  now: number = Date.now(),
): Question[] {
  return items.map((item) => {
    const options = item.options.map((text) => ({ id: newId(), text }));
    const answerIdx = resolveAnswerIndex(item.answer, item.options) ?? 0;
    return questionSchema.parse({
      id: newId(),
      projectId: target.projectId,
      topicId: target.topicId,
      stem: item.question,
      options,
      correctOptionId: options[answerIdx]?.id,
      explanation: item.explanation ?? '',
      difficulty: item.difficulty ?? 2,
      tags: item.tags ?? [],
      source: target.source,
      createdAt: now,
      updatedAt: now,
    });
  });
}

/** Exporta preguntas al formato de intercambio (las imágenes no se incluyen en v1). */
export function toInterchange(questions: readonly Question[]) {
  return {
    format: INTERCHANGE_FORMAT,
    version: INTERCHANGE_VERSION,
    questions: questions.map((q) => ({
      question: q.stem,
      options: q.options.map((o) => o.text),
      answer: Math.max(
        0,
        q.options.findIndex((o) => o.id === q.correctOptionId),
      ),
      explanation: q.explanation || undefined,
      difficulty: q.difficulty,
      tags: q.tags.length ? q.tags : undefined,
    })),
  };
}
