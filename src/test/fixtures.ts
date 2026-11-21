import type { Question } from '../domain/types';

export function makeQuestion(topicId: string, n: number, projectId = 'p1'): Question {
  return {
    id: `${topicId}-q${n}`,
    projectId,
    topicId,
    stem: `Pregunta ${n} del tema ${topicId}`,
    options: [
      { id: `${topicId}-q${n}-a`, text: 'A' },
      { id: `${topicId}-q${n}-b`, text: 'B' },
      { id: `${topicId}-q${n}-c`, text: 'C' },
      { id: `${topicId}-q${n}-d`, text: 'D' },
    ],
    correctOptionId: `${topicId}-q${n}-b`,
    explanation: '',
    difficulty: 2,
    tags: [],
    source: 'manual',
    createdAt: 0,
    updatedAt: 0,
  };
}
