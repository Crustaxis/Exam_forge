import { describe, expect, it } from 'vitest';
import { formatDuration, letter, plural } from './format';

describe('letter', () => {
  it('convierte el índice en la letra de la opción', () => {
    expect(letter(0)).toBe('A');
    expect(letter(5)).toBe('F');
  });

  it('usa un número si no hay letra disponible', () => {
    expect(letter(6)).toBe('7');
  });
});

describe('formatDuration', () => {
  it('muestra minutos y segundos por debajo de una hora', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65_000)).toBe('1:05');
  });

  it('añade las horas cuando hacen falta', () => {
    expect(formatDuration(3_661_000)).toBe('1:01:01');
  });

  it('no muestra tiempos negativos', () => {
    expect(formatDuration(-5_000)).toBe('0:00');
  });
});

describe('plural', () => {
  it('elige singular o plural según la cantidad', () => {
    expect(plural(1, 'pregunta', 'preguntas')).toBe('1 pregunta');
    expect(plural(0, 'pregunta', 'preguntas')).toBe('0 preguntas');
    expect(plural(3, 'pregunta', 'preguntas')).toBe('3 preguntas');
  });
});
