import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { EmptyState, Field, Loading, NotFound, Page } from '../components/Layout';
import { TOPIC_KINDS, TOPIC_KIND_LABELS, type ExamTemplate, type TopicKind } from '../domain/types';
import { formatDate, formatNumber, plural } from '../lib/format';
import { startExam } from '../app/startExam';

type Tab = 'temas' | 'examenes' | 'historial';

export function ProjectPage() {
  const { projectId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = (params.get('tab') as Tab | null) ?? 'temas';

  const project = useLiveQuery(() => db.projects.get(projectId).then((p) => p ?? null), [projectId]);

  if (project === undefined) return <Loading />;
  if (project === null) return <NotFound what="el proyecto" />;

  async function onDelete() {
    if (!confirm(`¿Borrar "${project!.name}" con todos sus temas, preguntas e historial? No se puede deshacer.`)) return;
    await repo.deleteProject(projectId);
    navigate('/');
  }

  async function onRename() {
    const name = prompt('Nuevo nombre del proyecto', project!.name);
    if (name?.trim()) await repo.updateProject(projectId, { name });
  }

  return (
    <Page
      title={project.name}
      back="/"
      actions={
        <>
          <button className="app-bar__icon" onClick={onRename} aria-label="Renombrar proyecto">
            ✎
          </button>
          <button className="app-bar__icon" onClick={onDelete} aria-label="Borrar proyecto">
            🗑
          </button>
        </>
      }
    >
      <div className="tabs" role="tablist">
        {(
          [
            ['temas', 'Temas'],
            ['examenes', 'Exámenes'],
            ['historial', 'Historial'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            className="tab"
            aria-selected={tab === key}
            onClick={() => setParams({ tab: key }, { replace: true })}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'temas' && <TopicsTab projectId={projectId} />}
      {tab === 'examenes' && <TemplatesTab projectId={projectId} />}
      {tab === 'historial' && <HistoryTab projectId={projectId} />}
    </Page>
  );
}

function TopicsTab({ projectId }: { projectId: string }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<TopicKind>('knowledge');
  const topics = useLiveQuery(async () => {
    const list = await db.topics.where('projectId').equals(projectId).sortBy('createdAt');
    return Promise.all(
      list.map(async (t) => ({ ...t, questions: await db.questions.where('topicId').equals(t.id).count() })),
    );
  }, [projectId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await repo.createTopic({ projectId, name, kind });
    setName('');
  }

  if (!topics) return <Loading />;
  return (
    <div className="stack">
      {topics.length === 0 ? (
        <EmptyState>
          <p>Aún no hay temas. Un tema agrupa material de estudio y sus preguntas.</p>
          <p className="small">Ejemplos: «Razonamiento verbal», «Tema 3 – Constitución», «Series numéricas».</p>
        </EmptyState>
      ) : (
        <ul className="list">
          {topics.map((t) => (
            <li key={t.id}>
              <Link to={`/p/${projectId}/temas/${t.id}`} className="list-item">
                <div className="list-item__main">
                  <div className="list-item__title">{t.name}</div>
                  <div className="list-item__sub">
                    {TOPIC_KIND_LABELS[t.kind]} · {plural(t.questions, 'pregunta', 'preguntas')}
                  </div>
                </div>
                <span aria-hidden>›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <form className="card stack" onSubmit={onCreate}>
        <h3>Añadir tema</h3>
        <Field label="Nombre">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} placeholder="Nombre del tema" />
        </Field>
        <Field label="Tipo">
          <select value={kind} onChange={(e) => setKind(e.target.value as TopicKind)}>
            {TOPIC_KINDS.map((k) => (
              <option key={k} value={k}>
                {TOPIC_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <div className="row row--end">
          <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
            Añadir tema
          </button>
        </div>
      </form>
    </div>
  );
}

function describeTemplate(t: ExamTemplate): string {
  const parts = [
    plural(t.questionCount, 'pregunta', 'preguntas'),
    t.timeLimitMinutes ? `${t.timeLimitMinutes} min` : 'sin tiempo',
    t.scoring.wrong < 0 ? `fallo ${formatNumber(t.scoring.wrong)}` : 'sin penalización',
  ];
  return parts.join(' · ');
}

function TemplatesTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const templates = useLiveQuery(
    () => db.templates.where('projectId').equals(projectId).sortBy('createdAt'),
    [projectId],
  );

  async function onStart(t: ExamTemplate) {
    setError(null);
    try {
      const attemptId = await startExam(t);
      navigate(`/intento/${attemptId}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!templates) return <Loading />;
  return (
    <div className="stack">
      {error ? <div className="notice notice--error">{error}</div> : null}
      {templates.length === 0 ? (
        <EmptyState>
          <p>Define tipos de examen: número de preguntas, tiempo, penalización por fallo y temas que entran.</p>
          <p className="small">Ej.: «Simulacro verbal: 20 preguntas en 35 min».</p>
        </EmptyState>
      ) : (
        <ul className="list">
          {templates.map((t) => (
            <li key={t.id} className="list-item">
              <div className="list-item__main">
                <div className="list-item__title">{t.name}</div>
                <div className="list-item__sub">{describeTemplate(t)}</div>
              </div>
              <Link to={`/p/${projectId}/examenes/${t.id}`} className="btn btn--sm btn--ghost" aria-label={`Editar ${t.name}`}>
                ✎
              </Link>
              <button className="btn btn--sm btn--primary" onClick={() => onStart(t)}>
                Empezar
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link to={`/p/${projectId}/examenes/nuevo`} className="btn btn--block">
        + Nuevo tipo de examen
      </Link>
    </div>
  );
}

function HistoryTab({ projectId }: { projectId: string }) {
  const attempts = useLiveQuery(
    () => db.attempts.where('projectId').equals(projectId).reverse().sortBy('startedAt'),
    [projectId],
  );
  if (!attempts) return <Loading />;
  if (attempts.length === 0) {
    return (
      <EmptyState>
        <p>Aquí verás tus exámenes realizados y su nota.</p>
      </EmptyState>
    );
  }
  return (
    <ul className="list">
      {attempts.map((a) => {
        const done = a.finishedAt !== null && a.result;
        return (
          <li key={a.id}>
            <Link to={done ? `/intento/${a.id}/resultado` : `/intento/${a.id}`} className="list-item">
              <div className="list-item__main">
                <div className="list-item__title">{a.title}</div>
                <div className="list-item__sub">
                  {formatDate(a.startedAt)} · {plural(a.items.length, 'pregunta', 'preguntas')}
                </div>
              </div>
              {done ? (
                <span
                  className={`badge ${a.result!.passed === false ? 'badge--ko' : a.result!.passed ? 'badge--ok' : 'badge--primary'}`}
                >
                  {formatNumber(a.result!.percent)} %
                </span>
              ) : (
                <span className="badge">En curso</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
