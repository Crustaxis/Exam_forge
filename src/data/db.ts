import Dexie, { type EntityTable } from 'dexie';
import type { Attempt, ExamTemplate, Project, Question, Topic } from '../domain/types';

/**
 * Base de datos local (IndexedDB) — todo se guarda en el dispositivo del usuario.
 * No hay servidor ni cuentas: privacidad por diseño y coste cero de hosting.
 *
 * Para cambiar el esquema, añade una nueva versión con this.version(N+1)
 * y su .upgrade() si hace falta migrar datos. Nunca modifiques una versión publicada.
 */
export class TailorDb extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  topics!: EntityTable<Topic, 'id'>;
  questions!: EntityTable<Question, 'id'>;
  templates!: EntityTable<ExamTemplate, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;

  constructor(name = 'tailor-test') {
    super(name);
    this.version(1).stores({
      projects: 'id, updatedAt',
      topics: 'id, projectId',
      questions: 'id, projectId, topicId',
      templates: 'id, projectId',
      attempts: 'id, projectId, templateId, startedAt',
    });
  }
}

export const db = new TailorDb();
