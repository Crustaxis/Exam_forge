import { describe, expect, it } from 'vitest';
import { extractJson, parseQuestionsJson, resolveAnswerIndex, toInterchange, toQuestions } from './interchange';

describe('resolveAnswerIndex', () => {
  const opts = ['París', 'Roma', 'Berlín'];
  it('acepta índice, letra, número en texto y texto de la opción', () => {
    expect(resolveAnswerIndex(1, opts)).toBe(1);
    expect(resolveAnswerIndex('c', opts)).toBe(2);
    expect(resolveAnswerIndex('0', opts)).toBe(0);
    expect(resolveAnswerIndex('roma', opts)).toBe(1);
  });
  it('rechaza respuestas fuera de rango', () => {
    expect(resolveAnswerIndex(5, opts)).toBeNull();
    expect(resolveAnswerIndex('D', opts)).toBeNull();
  });
});

describe('parseQuestionsJson', () => {
  it('extrae el JSON de una respuesta de IA con texto y bloque ```json', () => {
    const raw = 'Aquí tienes:\n```json\n{"questions":[{"question":"¿2+2?","options":["3","4"],"answer":"B"}]}\n```\n¡Suerte!';
    const { questions, errors } = parseQuestionsJson(raw);
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(1);
  });

  it('acepta un array directo e informa de las preguntas inválidas sin descartar las buenas', () => {
    const raw = JSON.stringify([
      { question: 'Buena', options: ['a', 'b'], answer: 0 },
      { question: 'Sin opciones suficientes', options: ['a'], answer: 0 },
      { question: 'Respuesta imposible', options: ['a', 'b'], answer: 'Z' },
    ]);
    const { questions, errors } = parseQuestionsJson(raw);
    expect(questions).toHaveLength(1);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/^Pregunta 2/);
  });

  it('devuelve error legible si no es JSON', () => {
    expect(parseQuestionsJson('hola').errors[0]).toMatch(/JSON/);
  });

  it('extractJson tolera texto antes y después sin bloque de código', () => {
    expect(extractJson('blabla [1,2] fin')).toBe('[1,2]');
  });
});

describe('toQuestions / toInterchange', () => {
  it('ida y vuelta conserva enunciado, opciones y respuesta', () => {
    const { questions: parsed } = parseQuestionsJson(
      JSON.stringify([{ question: '¿Capital de Italia?', options: ['París', 'Roma'], answer: 'Roma', explanation: 'Es Roma.' }]),
    );
    const qs = toQuestions(parsed, { projectId: 'p', topicId: 't', source: 'ai' });
    expect(qs[0]!.options.find((o) => o.id === qs[0]!.correctOptionId)!.text).toBe('Roma');
    expect(qs[0]!.source).toBe('ai');
    const out = toInterchange(qs);
    expect(out.questions[0]).toMatchObject({ question: '¿Capital de Italia?', answer: 1, explanation: 'Es Roma.' });
  });
});
