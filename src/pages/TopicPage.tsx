import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { EmptyState, Field, Loading, NotFound, Page } from '../components/Layout';
import { TOPIC_KINDS, TOPIC_KIND_LABELS, type Topic, type TopicKind } from '../domain/types';
import { practiceTemplate } from '../domain/exam';
import { toInterchange } from '../domain/interchange';
import { startExam } from '../app/startExam';
import { downloadJson, readFileAsText, slugify } from '../lib/files';
import { letter, plural } from '../lib/format';

export function TopicPage() {
  const { projectId = '', topicId = '' } = useParams();
  const navigate = useNavigate();
  const topic = useLiveQuery(() => db.topics.get(topicId).then((t) => t ?? null), [topicId]);
  const questions = useLiveQuery(
    () => db.questions.where('topicId').equals(topicId).sortBy('createdAt'),
    [topicId],
  );
  const [error, setError] = useState<string | null>(null);

  if (topic === undefined || questions === undefined) return <Loading />;
  if (topic === null) return <NotFound what="el tema" back={`/p/${projectId}`} />;

  const base = `/p/${projectId}/temas/${topicId}`;

  async function onPractice() {
    setError(null);
    try {
      const id = await startExam({ ...practiceTemplate(projectId, [topicId]), name: `Práctica: ${topic!.name}` });
      navigate(`/intento/${id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onDelete() {
    if (!confirm(`¿Borrar el tema "${topic!.name}" y sus ${questions!.length} preguntas?`)) return;
    await repo.deleteTopic(topicId);
    navigate(`/p/${projectId}`);
  }

  return (
    <Page
      title={topic.name}
      back={`/p/${projectId}`}
      actions={
        <button className="app-bar__icon" onClick={onDelete} aria-label="Borrar tema">
          🗑
        </button>
      }
    >
      <div className="stack">
        {error ? <div className="notice notice--error">{error}</div> : null}

        <button className="btn btn--primary btn--block" onClick={onPractice} disabled={questions.length === 0}>
          ▶ Practicar este tema
        </button>

        <TopicDetails topic={topic} />

        <div className="row row--between">
          <h2 style={{ margin: 0 }}>Preguntas ({questions.length})</h2>
          {questions.length > 0 ? (
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => downloadJson(toInterchange(questions), `${slugify(topic.name)}-preguntas.json`)}
            >
              Exportar
            </button>
          ) : null}
        </div>

        <div className="grid-2">
          <Link to={`${base}/importar?modo=ia`} className="btn">
            ✨ Generar con IA
          </Link>
          <Link to={`${base}/importar?modo=json`} className="btn">
            ⬆ Importar
          </Link>
        </div>
        <Link to={`${base}/preguntas/nueva`} className="btn btn--block">
          + Escribir pregunta
        </Link>

        {questions.length === 0 ? (
          <EmptyState>
            <p>Este tema aún no tiene preguntas.</p>
          </EmptyState>
        ) : (
          <ul className="list">
            {questions.map((q, i) => {
              const correct = q.options.findIndex((o) => o.id === q.correctOptionId);
              return (
                <li key={q.id}>
                  <Link to={`${base}/preguntas/${q.id}`} className="list-item">
                    <div className="list-item__main">
                      <div className="list-item__title" style={{ fontWeight: 500 }}>
                        {i + 1}. {q.stem ? truncate(q.stem, 140) : '[Pregunta con imagen]'}
                      </div>
                      <div className="list-item__sub">
                        Correcta: {letter(correct)} · {plural(q.options.length, 'opción', 'opciones')}
                        {q.source === 'ai' ? ' · IA' : q.source === 'import' ? ' · importada' : ''}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
}

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** Nombre, tipo y material de estudio del tema (plegable). */
function TopicDetails({ topic }: { topic: Topic }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(topic.name);
  const [kind, setKind] = useState<TopicKind>(topic.kind);
  const [material, setMaterial] = useState(topic.material);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(topic.name);
    setKind(topic.kind);
    setMaterial(topic.material);
    // Solo al cambiar de tema: no pisar lo que el usuario está escribiendo.
  }, [topic.id]);

  const dirty = name !== topic.name || kind !== topic.kind || material !== topic.material;

  async function onSave() {
    await repo.updateTopic(topic.id, { name, kind, material });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function onLoadFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    setMaterial((m) => (m.trim() ? `${m}\n\n${text}` : text));
    e.target.value = '';
  }

  return (
    <div className="card stack">
      <button
        className="row row--between btn--ghost"
        style={{ width: '100%', border: 0, background: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <strong>Material de estudio y ajustes</strong>
        <span className="muted small">
          {topic.material ? `${topic.material.length.toLocaleString('es-ES')} caracteres` : 'vacío'} {open ? '▲' : '▼'}
        </span>
      </button>
      {open ? (
        <>
          <Field label="Nombre">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />
          </Field>
          <Field label="Tipo de tema" hint="Orienta a la IA sobre qué tipo de preguntas crear.">
            <select value={kind} onChange={(e) => setKind(e.target.value as TopicKind)}>
              {TOPIC_KINDS.map((k) => (
                <option key={k} value={k}>
                  {TOPIC_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Material"
            hint="Pega aquí tus apuntes o el temario. Es la base para generar preguntas con IA."
          >
            <textarea rows={10} value={material} onChange={(e) => setMaterial(e.target.value)} />
          </Field>
          <div className="row row--between">
            <label className="btn btn--sm">
              Cargar .txt / .md
              <input type="file" accept=".txt,.md,text/plain,text/markdown" hidden onChange={onLoadFile} />
            </label>
            <button className="btn btn--primary btn--sm" onClick={onSave} disabled={!dirty || !name.trim()}>
              {saved ? 'Guardado ✓' : 'Guardar'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
