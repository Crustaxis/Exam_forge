import { db } from '../data/db';
import { repo } from '../data/repo';
import { buildAttempt, eligibleQuestions, type TemplateForAttempt } from '../domain/exam';

/**
 * Crea un intento a partir de un tipo de examen y lo guarda.
 * Devuelve el id del intento, o lanza un error legible si no hay preguntas.
 */
export async function startExam(template: TemplateForAttempt): Promise<string> {
  const questions = await db.questions.where('projectId').equals(template.projectId).toArray();
  const pool = eligibleQuestions(template, questions);
  if (pool.length === 0) {
    throw new Error('No hay preguntas en los temas seleccionados. Añade o genera preguntas primero.');
  }
  const attempt = buildAttempt(template, questions);
  await repo.saveAttempt(attempt);
  return attempt.id;
}
