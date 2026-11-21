import { z } from 'zod';
import { db as defaultDb, type TailorDb } from './db';
import {
  attemptSchema,
  examTemplateSchema,
  projectSchema,
  questionSchema,
  topicSchema,
} from '../domain/types';

/**
 * Copia de seguridad completa. Como los datos viven solo en el dispositivo,
 * exportar es la forma de no perderlos y de pasarlos a otro móvil u ordenador.
 */
export const BACKUP_FORMAT = 'tailor-test/backup';
export const BACKUP_VERSION = 1;

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.number(),
  projects: z.array(projectSchema),
  topics: z.array(topicSchema),
  questions: z.array(questionSchema),
  templates: z.array(examTemplateSchema),
  attempts: z.array(attemptSchema),
});
export type Backup = z.infer<typeof backupSchema>;

export async function exportBackup(db: TailorDb = defaultDb): Promise<Backup> {
  const [projects, topics, questions, templates, attempts] = await Promise.all([
    db.projects.toArray(),
    db.topics.toArray(),
    db.questions.toArray(),
    db.templates.toArray(),
    db.attempts.toArray(),
  ]);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    projects,
    topics,
    questions,
    templates,
    attempts,
  };
}

export interface RestoreSummary {
  projects: number;
  topics: number;
  questions: number;
  templates: number;
  attempts: number;
}

/**
 * Restaura una copia. Modo "merge": añade y sobrescribe por id sin borrar lo que ya hay.
 * Lanza un error legible si el archivo no es una copia válida.
 */
export async function restoreBackup(raw: string, db: TailorDb = defaultDb): Promise<RestoreSummary> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('El archivo no es una copia de seguridad de Tailor-test compatible.');
  }
  const data = parsed.data;
  await db.transaction('rw', [db.projects, db.topics, db.questions, db.templates, db.attempts], async () => {
    await db.projects.bulkPut(data.projects);
    await db.topics.bulkPut(data.topics);
    await db.questions.bulkPut(data.questions);
    await db.templates.bulkPut(data.templates);
    await db.attempts.bulkPut(data.attempts);
  });
  return {
    projects: data.projects.length,
    topics: data.topics.length,
    questions: data.questions.length,
    templates: data.templates.length,
    attempts: data.attempts.length,
  };
}
