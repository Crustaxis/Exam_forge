import { z } from 'zod';

/**
 * Modelo de datos de Tailor-test.
 *
 * Convención: identificadores de código en inglés (facilita contribuciones
 * internacionales); textos de la interfaz y documentación en español.
 *
 * Jerarquía:
 *   Project (proyecto: una oposición, un examen, una asignatura)
 *     ├── Topic (tema: material de estudio + banco de preguntas)
 *     │     └── Question (pregunta tipo test, siempre con UNA respuesta correcta)
 *     ├── ExamTemplate (tipo de examen: nº preguntas, tiempo, puntuación…)
 *     └── Attempt (intento/realización de un examen, con su corrección)
 */

export const TOPIC_KINDS = ['verbal', 'numerical', 'abstract', 'knowledge', 'other'] as const;
export type TopicKind = (typeof TOPIC_KINDS)[number];

export const TOPIC_KIND_LABELS: Record<TopicKind, string> = {
  verbal: 'Razonamiento verbal',
  numerical: 'Razonamiento numérico',
  abstract: 'Razonamiento abstracto',
  knowledge: 'Conocimientos / temario',
  other: 'Otro',
};

export const QUESTION_SOURCES = ['manual', 'import', 'ai'] as const;
export type QuestionSource = (typeof QUESTION_SOURCES)[number];

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

const id = z.string().min(1);
const timestamp = z.number().int().nonnegative();
/** Imagen incrustada como data URL (p. ej. figuras de razonamiento abstracto o tablas). */
const imageDataUrl = z.string().startsWith('data:image/');

export const projectSchema = z.object({
  id,
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).default(''),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Project = z.infer<typeof projectSchema>;

export const topicSchema = z.object({
  id,
  projectId: id,
  name: z.string().trim().min(1).max(160),
  kind: z.enum(TOPIC_KINDS),
  /** Material de estudio en texto plano/Markdown; base para generar preguntas. */
  material: z.string().default(''),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Topic = z.infer<typeof topicSchema>;

export const optionSchema = z.object({
  id,
  text: z.string().default(''),
  image: imageDataUrl.optional(),
});
export type QuestionOption = z.infer<typeof optionSchema>;

export const questionSchema = z
  .object({
    id,
    projectId: id,
    topicId: id,
    stem: z.string().default(''),
    image: imageDataUrl.optional(),
    options: z.array(optionSchema).min(MIN_OPTIONS).max(MAX_OPTIONS),
    correctOptionId: id,
    explanation: z.string().default(''),
    /** 1 = fácil, 2 = media, 3 = difícil */
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
    tags: z.array(z.string()).default([]),
    source: z.enum(QUESTION_SOURCES).default('manual'),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .refine((q) => q.options.some((o) => o.id === q.correctOptionId), {
    message: 'La respuesta correcta debe ser una de las opciones',
    path: ['correctOptionId'],
  })
  .refine((q) => q.stem.trim() !== '' || q.image !== undefined, {
    message: 'La pregunta necesita enunciado o imagen',
    path: ['stem'],
  })
  .refine((q) => q.options.every((o) => o.text.trim() !== '' || o.image !== undefined), {
    message: 'Cada opción necesita texto o imagen',
    path: ['options'],
  });
export type Question = z.infer<typeof questionSchema>;

export const scoringSchema = z.object({
  /** Puntos por acierto */
  correct: z.number().default(1),
  /** Puntos por fallo (normalmente 0 o negativo, p. ej. -0.33) */
  wrong: z.number().default(0),
  /** Puntos por pregunta en blanco */
  blank: z.number().default(0),
});
export type Scoring = z.infer<typeof scoringSchema>;

export const FEEDBACK_MODES = ['end', 'immediate'] as const;
export type FeedbackMode = (typeof FEEDBACK_MODES)[number];

export const examTemplateSchema = z.object({
  id,
  projectId: id,
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).default(''),
  questionCount: z.number().int().min(1).max(500),
  /** null = sin límite de tiempo */
  timeLimitMinutes: z.number().int().min(1).max(600).nullable(),
  /** Temas de los que se sacan preguntas; vacío = todos los del proyecto */
  topicIds: z.array(id).default([]),
  scoring: scoringSchema,
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  feedback: z.enum(FEEDBACK_MODES).default('end'),
  /** Porcentaje de la puntuación máxima necesario para aprobar; null = sin corte */
  passMarkPercent: z.number().min(0).max(100).nullable().default(null),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type ExamTemplate = z.infer<typeof examTemplateSchema>;

/** Copia congelada de la pregunta: el historial no cambia si luego editas o borras la pregunta. */
export const attemptItemSchema = z.object({
  questionId: id,
  topicId: id,
  stem: z.string(),
  image: imageDataUrl.optional(),
  /** Opciones en el orden en que se mostraron */
  options: z.array(optionSchema),
  correctOptionId: id,
  explanation: z.string(),
  answerOptionId: id.nullable(),
  flagged: z.boolean(),
  /** Milisegundos dedicados a la pregunta (aprox.) */
  timeSpentMs: z.number().nonnegative(),
});
export type AttemptItem = z.infer<typeof attemptItemSchema>;

export const attemptResultSchema = z.object({
  correct: z.number().int(),
  wrong: z.number().int(),
  blank: z.number().int(),
  score: z.number(),
  maxScore: z.number(),
  percent: z.number(),
  passed: z.boolean().nullable(),
});
export type AttemptResult = z.infer<typeof attemptResultSchema>;

export const attemptSchema = z.object({
  id,
  projectId: id,
  templateId: id.nullable(),
  title: z.string(),
  timeLimitMinutes: z.number().nullable(),
  scoring: scoringSchema,
  feedback: z.enum(FEEDBACK_MODES),
  passMarkPercent: z.number().nullable(),
  items: z.array(attemptItemSchema),
  currentIndex: z.number().int().nonnegative(),
  startedAt: timestamp,
  finishedAt: timestamp.nullable(),
  result: attemptResultSchema.nullable(),
});
export type Attempt = z.infer<typeof attemptSchema>;
