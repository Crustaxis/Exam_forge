import type {
  Attempt,
  AttemptItem,
  AttemptResult,
  ExamTemplate,
  Question,
  Scoring,
} from './types';
import { defaultRng, newId, shuffle, type Rng } from './random';

/** Plantilla de práctica rápida de un tema: 10 preguntas, sin tiempo, corrección al momento. */
export function practiceTemplate(
  projectId: string,
  topicIds: string[],
  questionCount = 10,
): Omit<ExamTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    projectId,
    name: 'Práctica rápida',
    description: '',
    questionCount,
    timeLimitMinutes: null,
    topicIds,
    scoring: { correct: 1, wrong: 0, blank: 0 },
    shuffleQuestions: true,
    shuffleOptions: true,
    feedback: 'immediate',
    passMarkPercent: null,
  };
}

/** Preguntas elegibles para una plantilla (filtra por temas; vacío = todas). */
export function eligibleQuestions(
  template: Pick<ExamTemplate, 'topicIds'>,
  questions: readonly Question[],
): Question[] {
  if (template.topicIds.length === 0) return [...questions];
  const allowed = new Set(template.topicIds);
  return questions.filter((q) => allowed.has(q.topicId));
}

/**
 * Selecciona preguntas repartiéndolas de forma equilibrada entre los temas
 * (round-robin) para que un tema con muchas preguntas no acapare el examen.
 */
export function pickQuestions(
  pool: readonly Question[],
  count: number,
  rng: Rng = defaultRng,
): Question[] {
  const byTopic = new Map<string, Question[]>();
  for (const q of shuffle(pool, rng)) {
    const list = byTopic.get(q.topicId) ?? [];
    list.push(q);
    byTopic.set(q.topicId, list);
  }
  const queues = shuffle([...byTopic.values()], rng);
  const picked: Question[] = [];
  while (picked.length < count && queues.some((q) => q.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) picked.push(next);
      if (picked.length >= count) break;
    }
  }
  return picked;
}

export type TemplateForAttempt = Omit<ExamTemplate, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export function buildAttempt(
  template: TemplateForAttempt,
  questions: readonly Question[],
  options: { rng?: Rng; now?: number } = {},
): Attempt {
  const rng = options.rng ?? defaultRng;
  const now = options.now ?? Date.now();
  const pool = eligibleQuestions(template, questions);
  let picked = pickQuestions(pool, template.questionCount, rng);
  if (template.shuffleQuestions) picked = shuffle(picked, rng);

  const items: AttemptItem[] = picked.map((q) => ({
    questionId: q.id,
    topicId: q.topicId,
    stem: q.stem,
    ...(q.image ? { image: q.image } : {}),
    options: template.shuffleOptions ? shuffle(q.options, rng) : [...q.options],
    correctOptionId: q.correctOptionId,
    explanation: q.explanation,
    answerOptionId: null,
    flagged: false,
    timeSpentMs: 0,
  }));

  return {
    id: newId(),
    projectId: template.projectId,
    templateId: template.id ?? null,
    title: template.name,
    timeLimitMinutes: template.timeLimitMinutes,
    scoring: template.scoring,
    feedback: template.feedback,
    passMarkPercent: template.passMarkPercent,
    items,
    currentIndex: 0,
    startedAt: now,
    finishedAt: null,
    result: null,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function scoreItems(
  items: readonly AttemptItem[],
  scoring: Scoring,
  passMarkPercent: number | null = null,
): AttemptResult {
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  for (const item of items) {
    if (item.answerOptionId === null) blank++;
    else if (item.answerOptionId === item.correctOptionId) correct++;
    else wrong++;
  }
  const score = round2(correct * scoring.correct + wrong * scoring.wrong + blank * scoring.blank);
  const maxScore = round2(items.length * scoring.correct);
  const percent = maxScore > 0 ? round2((score / maxScore) * 100) : 0;
  return {
    correct,
    wrong,
    blank,
    score,
    maxScore,
    percent,
    passed: passMarkPercent === null ? null : percent >= passMarkPercent,
  };
}

/** Fecha límite (ms) de un intento con tiempo, o null. */
export function attemptDeadline(attempt: Pick<Attempt, 'startedAt' | 'timeLimitMinutes'>): number | null {
  return attempt.timeLimitMinutes === null
    ? null
    : attempt.startedAt + attempt.timeLimitMinutes * 60_000;
}

export function answerItem(attempt: Attempt, index: number, optionId: string | null): Attempt {
  const item = attempt.items[index];
  if (!item || attempt.finishedAt !== null) return attempt;
  // En modo corrección inmediata, la respuesta queda fijada al primer clic.
  if (attempt.feedback === 'immediate' && item.answerOptionId !== null) return attempt;
  const items = attempt.items.map((it, i) => (i === index ? { ...it, answerOptionId: optionId } : it));
  return { ...attempt, items };
}

export function toggleFlag(attempt: Attempt, index: number): Attempt {
  const items = attempt.items.map((it, i) => (i === index ? { ...it, flagged: !it.flagged } : it));
  return { ...attempt, items };
}

export function addTimeSpent(attempt: Attempt, index: number, ms: number): Attempt {
  if (ms <= 0) return attempt;
  const items = attempt.items.map((it, i) =>
    i === index ? { ...it, timeSpentMs: it.timeSpentMs + ms } : it,
  );
  return { ...attempt, items };
}

/**
 * Tiempo real dedicado a un intento: la suma del tiempo de cada pregunta.
 * No usa `finishedAt - startedAt` porque eso contaría también el tiempo con la app cerrada
 * (si dejas un examen a medias y lo terminas al día siguiente, saldrían 24 h).
 */
export function attemptTimeSpent(attempt: Pick<Attempt, 'items'>): number {
  return attempt.items.reduce((total, item) => total + item.timeSpentMs, 0);
}

export function finishAttempt(attempt: Attempt, now: number = Date.now()): Attempt {
  if (attempt.finishedAt !== null) return attempt;
  return {
    ...attempt,
    finishedAt: now,
    result: scoreItems(attempt.items, attempt.scoring, attempt.passMarkPercent),
  };
}
