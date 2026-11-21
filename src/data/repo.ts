import { db as defaultDb, type TailorDb } from './db';
import {
  examTemplateSchema,
  projectSchema,
  questionSchema,
  topicSchema,
  type Attempt,
  type ExamTemplate,
  type Project,
  type Question,
  type Topic,
} from '../domain/types';
import { newId } from '../domain/random';

/**
 * Operaciones de datos. Toda escritura pasa por los esquemas zod para que
 * nunca se guarde nada inválido. Las pantallas no tocan Dexie directamente
 * para escribir: usan estas funciones.
 */

type NewProject = Pick<Project, 'name'> & Partial<Pick<Project, 'description'>>;
type NewTopic = Pick<Topic, 'projectId' | 'name' | 'kind'> & Partial<Pick<Topic, 'material'>>;
type NewTemplate = Omit<ExamTemplate, 'id' | 'createdAt' | 'updatedAt'>;
type NewQuestion = Omit<Question, 'id' | 'createdAt' | 'updatedAt'>;

export function createRepo(db: TailorDb = defaultDb) {
  return {
    // ---------- Proyectos ----------
    async createProject(input: NewProject): Promise<Project> {
      const now = Date.now();
      const project = projectSchema.parse({ ...input, id: newId(), createdAt: now, updatedAt: now });
      await db.projects.add(project);
      return project;
    },

    async updateProject(id: string, patch: Partial<NewProject>): Promise<void> {
      const current = await db.projects.get(id);
      if (!current) throw new Error('Proyecto no encontrado');
      await db.projects.put(projectSchema.parse({ ...current, ...patch, updatedAt: Date.now() }));
    },

    /** Borra el proyecto y todo su contenido (temas, preguntas, tipos de examen e historial). */
    async deleteProject(id: string): Promise<void> {
      await db.transaction('rw', [db.projects, db.topics, db.questions, db.templates, db.attempts], async () => {
        await db.topics.where('projectId').equals(id).delete();
        await db.questions.where('projectId').equals(id).delete();
        await db.templates.where('projectId').equals(id).delete();
        await db.attempts.where('projectId').equals(id).delete();
        await db.projects.delete(id);
      });
    },

    // ---------- Temas ----------
    async createTopic(input: NewTopic): Promise<Topic> {
      const now = Date.now();
      const topic = topicSchema.parse({ ...input, id: newId(), createdAt: now, updatedAt: now });
      await db.topics.add(topic);
      await touchProject(db, input.projectId);
      return topic;
    },

    async updateTopic(id: string, patch: Partial<Omit<NewTopic, 'projectId'>>): Promise<void> {
      const current = await db.topics.get(id);
      if (!current) throw new Error('Tema no encontrado');
      await db.topics.put(topicSchema.parse({ ...current, ...patch, updatedAt: Date.now() }));
    },

    async deleteTopic(id: string): Promise<void> {
      await db.transaction('rw', [db.topics, db.questions, db.templates], async () => {
        await db.questions.where('topicId').equals(id).delete();
        await db.topics.delete(id);
        // Quita el tema de los tipos de examen que lo usaban.
        const templates = await db.templates.filter((t) => t.topicIds.includes(id)).toArray();
        for (const t of templates) {
          await db.templates.put({ ...t, topicIds: t.topicIds.filter((x) => x !== id) });
        }
      });
    },

    // ---------- Preguntas ----------
    async saveQuestion(input: NewQuestion & { id?: string }): Promise<Question> {
      const now = Date.now();
      const existing = input.id ? await db.questions.get(input.id) : undefined;
      const question = questionSchema.parse({
        ...input,
        id: input.id ?? newId(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      await db.questions.put(question);
      return question;
    },

    async addQuestions(questions: Question[]): Promise<void> {
      const valid = questions.map((q) => questionSchema.parse(q));
      await db.questions.bulkAdd(valid);
    },

    async deleteQuestion(id: string): Promise<void> {
      await db.questions.delete(id);
    },

    // ---------- Tipos de examen ----------
    async saveTemplate(input: NewTemplate & { id?: string }): Promise<ExamTemplate> {
      const now = Date.now();
      const existing = input.id ? await db.templates.get(input.id) : undefined;
      const template = examTemplateSchema.parse({
        ...input,
        id: input.id ?? newId(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      await db.templates.put(template);
      return template;
    },

    async deleteTemplate(id: string): Promise<void> {
      await db.templates.delete(id);
    },

    // ---------- Intentos ----------
    async saveAttempt(attempt: Attempt): Promise<void> {
      await db.attempts.put(attempt);
    },

    async deleteAttempt(id: string): Promise<void> {
      await db.attempts.delete(id);
    },
  };
}

async function touchProject(db: TailorDb, projectId: string) {
  await db.projects.update(projectId, { updatedAt: Date.now() });
}

export const repo = createRepo();
export type Repo = ReturnType<typeof createRepo>;
