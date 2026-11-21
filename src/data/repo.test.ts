import { beforeEach, describe, expect, it } from 'vitest';
import { TailorDb } from './db';
import { createRepo } from './repo';
import { exportBackup, restoreBackup } from './backup';
import { newId } from '../domain/random';

let db: TailorDb;
let repo: ReturnType<typeof createRepo>;

beforeEach(async () => {
  db = new TailorDb(`test-${newId()}`);
  repo = createRepo(db);
});

async function seed() {
  const project = await repo.createProject({ name: 'Oposición de prueba' });
  const topic = await repo.createTopic({ projectId: project.id, name: 'Tema 1', kind: 'knowledge' });
  const a = newId();
  const b = newId();
  await repo.saveQuestion({
    projectId: project.id,
    topicId: topic.id,
    stem: '¿Pregunta?',
    options: [
      { id: a, text: 'Sí' },
      { id: b, text: 'No' },
    ],
    correctOptionId: a,
    explanation: '',
    difficulty: 2,
    tags: [],
    source: 'manual',
  });
  const template = await repo.saveTemplate({
    projectId: project.id,
    name: 'Simulacro',
    description: '',
    questionCount: 10,
    timeLimitMinutes: 20,
    topicIds: [topic.id],
    scoring: { correct: 1, wrong: -0.25, blank: 0 },
    shuffleQuestions: true,
    shuffleOptions: true,
    feedback: 'end',
    passMarkPercent: 50,
  });
  return { project, topic, template };
}

describe('repo', () => {
  it('rechaza preguntas cuya respuesta correcta no es una opción', async () => {
    const { project, topic } = await seed();
    await expect(
      repo.saveQuestion({
        projectId: project.id,
        topicId: topic.id,
        stem: 'Mal',
        options: [
          { id: 'x', text: '1' },
          { id: 'y', text: '2' },
        ],
        correctOptionId: 'z',
        explanation: '',
        difficulty: 2,
        tags: [],
        source: 'manual',
      }),
    ).rejects.toThrow();
  });

  it('borrar un tema elimina sus preguntas y lo quita de los tipos de examen', async () => {
    const { topic, template } = await seed();
    await repo.deleteTopic(topic.id);
    expect(await db.questions.count()).toBe(0);
    expect((await db.templates.get(template.id))!.topicIds).toEqual([]);
  });

  it('borrar un proyecto lo elimina todo en cascada', async () => {
    const { project } = await seed();
    await repo.deleteProject(project.id);
    expect(await db.topics.count()).toBe(0);
    expect(await db.questions.count()).toBe(0);
    expect(await db.templates.count()).toBe(0);
  });
});

describe('backup', () => {
  it('exporta y restaura en otra base de datos', async () => {
    await seed();
    const backup = await exportBackup(db);
    const other = new TailorDb(`test-${newId()}`);
    const summary = await restoreBackup(JSON.stringify(backup), other);
    expect(summary).toMatchObject({ projects: 1, topics: 1, questions: 1, templates: 1 });
    expect(await other.questions.count()).toBe(1);
  });

  it('rechaza archivos que no son copias', async () => {
    await expect(restoreBackup('{"hola":1}', db)).rejects.toThrow(/copia de seguridad/);
  });
});
