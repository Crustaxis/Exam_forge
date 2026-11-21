import { describe, expect, it } from 'vitest';
import {
  answerItem,
  buildAttempt,
  finishAttempt,
  pickQuestions,
  practiceTemplate,
  scoreItems,
} from './exam';
import { seededRng } from './random';
import { makeQuestion } from '../test/fixtures';
import type { AttemptItem } from './types';

const bank = [
  ...Array.from({ length: 20 }, (_, i) => makeQuestion('t1', i)),
  ...Array.from({ length: 3 }, (_, i) => makeQuestion('t2', i)),
];

describe('pickQuestions', () => {
  it('reparte entre temas aunque uno tenga muchas más preguntas', () => {
    const picked = pickQuestions(bank, 6, seededRng(1));
    expect(picked).toHaveLength(6);
    expect(picked.filter((q) => q.topicId === 't2')).toHaveLength(3);
  });

  it('no repite preguntas y no pasa del banco disponible', () => {
    const picked = pickQuestions(bank, 100, seededRng(2));
    expect(picked).toHaveLength(bank.length);
    expect(new Set(picked.map((q) => q.id)).size).toBe(bank.length);
  });
});

describe('buildAttempt', () => {
  it('filtra por temas de la plantilla', () => {
    const attempt = buildAttempt(practiceTemplate('p1', ['t2'], 10), bank, { rng: seededRng(3) });
    expect(attempt.items).toHaveLength(3);
    expect(attempt.items.every((i) => i.topicId === 't2')).toBe(true);
  });

  it('mantiene la respuesta correcta al barajar opciones', () => {
    const attempt = buildAttempt(practiceTemplate('p1', [], 23), bank, { rng: seededRng(4) });
    for (const item of attempt.items) {
      expect(item.options.some((o) => o.id === item.correctOptionId)).toBe(true);
    }
  });

  it('es reproducible con la misma semilla', () => {
    const a = buildAttempt(practiceTemplate('p1', [], 5), bank, { rng: seededRng(9), now: 0 });
    const b = buildAttempt(practiceTemplate('p1', [], 5), bank, { rng: seededRng(9), now: 0 });
    expect(a.items.map((i) => i.questionId)).toEqual(b.items.map((i) => i.questionId));
  });
});

describe('scoreItems', () => {
  const item = (answer: string | null): AttemptItem => ({
    questionId: 'q',
    topicId: 't',
    stem: 's',
    options: [],
    correctOptionId: 'ok',
    explanation: '',
    answerOptionId: answer,
    flagged: false,
    timeSpentMs: 0,
  });

  it('aplica penalización por fallo (estilo oposición -1/3)', () => {
    const items = [item('ok'), item('ok'), item('ok'), item('bad'), item(null)];
    const r = scoreItems(items, { correct: 1, wrong: -1 / 3, blank: 0 }, 50);
    expect(r).toMatchObject({ correct: 3, wrong: 1, blank: 1, maxScore: 5 });
    expect(r.score).toBeCloseTo(2.67, 2);
    expect(r.percent).toBeCloseTo(53.4, 1);
    expect(r.passed).toBe(true);
  });

  it('sin nota de corte, passed es null', () => {
    expect(scoreItems([item('ok')], { correct: 1, wrong: 0, blank: 0 }).passed).toBeNull();
  });
});

describe('answerItem / finishAttempt', () => {
  it('en corrección inmediata no deja cambiar la respuesta', () => {
    let attempt = buildAttempt(practiceTemplate('p1', [], 1), bank, { rng: seededRng(5) });
    const [first, second] = attempt.items[0]!.options;
    attempt = answerItem(attempt, 0, first!.id);
    attempt = answerItem(attempt, 0, second!.id);
    expect(attempt.items[0]!.answerOptionId).toBe(first!.id);
  });

  it('al terminar calcula el resultado y bloquea respuestas', () => {
    let attempt = buildAttempt({ ...practiceTemplate('p1', [], 2), feedback: 'end' }, bank, {
      rng: seededRng(6),
    });
    attempt = answerItem(attempt, 0, attempt.items[0]!.correctOptionId);
    attempt = finishAttempt(attempt, 1000);
    expect(attempt.result).toMatchObject({ correct: 1, blank: 1 });
    const after = answerItem(attempt, 1, attempt.items[1]!.correctOptionId);
    expect(after.items[1]!.answerOptionId).toBeNull();
  });
});
