import { describe, expect, it } from 'vitest';
import { parseQuestionsJson } from './interchange';

// Comprueba automáticamente cada banco de preguntas de la comunidad (carpeta bancos/).
// Así, quien aporte un banco sabe en el propio PR (por la CI) si alguna pregunta es inválida.
const banks = import.meta.glob<string>('../../bancos/*.json', { eager: true, query: '?raw', import: 'default' });

describe('bancos de preguntas de la comunidad', () => {
  it('hay al menos un banco', () => {
    expect(Object.keys(banks).length).toBeGreaterThan(0);
  });

  for (const [path, raw] of Object.entries(banks)) {
    const name = path.split('/').pop()!;

    it(`${name}: todas las preguntas son válidas`, () => {
      const { questions, errors } = parseQuestionsJson(raw);
      expect(errors).toEqual([]);
      expect(questions.length).toBeGreaterThan(0);
    });

    it(`${name}: el nombre del archivo va en minúsculas y con guiones`, () => {
      expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.json$/);
    });
  }
});
