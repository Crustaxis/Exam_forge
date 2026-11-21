import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Field, Loading, NotFound, Page } from '../components/Layout';
import type { ExamTemplate, FeedbackMode } from '../domain/types';
import { plural } from '../lib/format';

type Draft = Omit<ExamTemplate, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>;

const DEFAULT_DRAFT: Draft = {
  name: '',
  description: '',
  questionCount: 20,
  timeLimitMinutes: 30,
  topicIds: [],
  scoring: { correct: 1, wrong: 0, blank: 0 },
  shuffleQuestions: true,
  shuffleOptions: true,
  feedback: 'end',
  passMarkPercent: null,
};

/** Penalizaciones habituales en oposiciones y pruebas de selección. */
const PENALTY_PRESETS = [
  { label: 'Sin penalización', value: 0 },
  { label: '−1/3 (habitual con 4 opciones)', value: -1 / 3 },
  { label: '−1/4', value: -0.25 },
  { label: '−1/2', value: -0.5 },
  { label: '−1 (un fallo resta un acierto)', value: -1 },
];

export function TemplateEditorPage() {
  const { projectId = '', templateId } = useParams();
  const navigate = useNavigate();
  const back = `/p/${projectId}?tab=examenes`;

  const existing = useLiveQuery(
    async () => (templateId ? ((await db.templates.get(templateId)) ?? null) : null),
    [templateId],
  );
  const topics = useLiveQuery(async () => {
    const list = await db.topics.where('projectId').equals(projectId).sortBy('createdAt');
    return Promise.all(
      list.map(async (t) => ({ ...t, questions: await db.questions.where('topicId').equals(t.id).count() })),
    );
  }, [projectId]);

  const [draft, setDraft] = useState<Draft | null>(templateId ? null : DEFAULT_DRAFT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateId && existing) {
      const { id: _id, projectId: _p, createdAt: _c, updatedAt: _u, ...rest } = existing;
      setDraft(rest);
    }
  }, [templateId, existing]);

  if (templateId && existing === null) return <NotFound what="el tipo de examen" back={back} />;
  if (!draft || !topics) return <Loading />;

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const available = topics
    .filter((t) => draft.topicIds.length === 0 || draft.topicIds.includes(t.id))
    .reduce((sum, t) => sum + t.questions, 0);
  const presetMatch = PENALTY_PRESETS.find((p) => Math.abs(p.value - draft.scoring.wrong) < 1e-9);

  function toggleTopic(id: string) {
    const set = new Set(draft!.topicIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update({ topicIds: [...set] });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await repo.saveTemplate({ ...draft!, ...(templateId ? { id: templateId } : {}), projectId });
      navigate(back);
    } catch {
      setError('Revisa los campos: falta el nombre o algún valor está fuera de rango.');
    }
  }

  async function onDelete() {
    if (!templateId || !confirm('¿Borrar este tipo de examen? El historial se conserva.')) return;
    await repo.deleteTemplate(templateId);
    navigate(back);
  }

  return (
    <Page
      title={templateId ? 'Editar tipo de examen' : 'Nuevo tipo de examen'}
      back={back}
      actions={
        templateId ? (
          <button className="app-bar__icon" onClick={onDelete} aria-label="Borrar tipo de examen">
            🗑
          </button>
        ) : null
      }
    >
      <form className="stack" onSubmit={onSubmit}>
        <Field label="Nombre">
          <input
            type="text"
            value={draft.name}
            maxLength={120}
            placeholder="Ej.: Simulacro razonamiento verbal"
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>

        <div className="grid-2">
          <Field label="Número de preguntas" hint={`Disponibles ahora: ${available}`}>
            <input
              type="number"
              min={1}
              max={500}
              value={draft.questionCount}
              onChange={(e) => update({ questionCount: Math.max(1, Number(e.target.value) || 1) })}
            />
          </Field>
          <Field label="Tiempo (minutos)" hint="Vacío = sin límite">
            <input
              type="number"
              min={1}
              max={600}
              value={draft.timeLimitMinutes ?? ''}
              placeholder="Sin límite"
              onChange={(e) => update({ timeLimitMinutes: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
            />
          </Field>
        </div>

        <fieldset className="card stack" style={{ margin: 0 }}>
          <legend className="field__label">Temas que entran</legend>
          {topics.length === 0 ? (
            <p className="muted small">Este proyecto aún no tiene temas.</p>
          ) : (
            <>
              <p className="muted small" style={{ margin: 0 }}>
                {draft.topicIds.length === 0 ? 'Todos los temas (no has marcado ninguno).' : 'Solo los temas marcados.'}
              </p>
              {topics.map((t) => (
                <label key={t.id} className="check">
                  <input type="checkbox" checked={draft.topicIds.includes(t.id)} onChange={() => toggleTopic(t.id)} />
                  <span>
                    {t.name} <span className="muted small">({plural(t.questions, 'pregunta', 'preguntas')})</span>
                  </span>
                </label>
              ))}
            </>
          )}
        </fieldset>

        <fieldset className="card stack" style={{ margin: 0 }}>
          <legend className="field__label">Puntuación</legend>
          <Field label="Penalización por fallo">
            <select
              value={presetMatch ? String(presetMatch.value) : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') update({ scoring: { ...draft.scoring, wrong: Number(e.target.value) } });
              }}
            >
              {PENALTY_PRESETS.map((p) => (
                <option key={p.label} value={String(p.value)}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Personalizada</option>
            </select>
          </Field>
          <div className="grid-2">
            <Field label="Puntos por acierto">
              <input
                type="number"
                step="any"
                value={draft.scoring.correct}
                onChange={(e) => update({ scoring: { ...draft.scoring, correct: Number(e.target.value) } })}
              />
            </Field>
            <Field label="Puntos por fallo">
              <input
                type="number"
                step="any"
                value={Math.round(draft.scoring.wrong * 10000) / 10000}
                onChange={(e) => update({ scoring: { ...draft.scoring, wrong: Number(e.target.value) } })}
              />
            </Field>
          </div>
          <Field label="Nota de corte (%)" hint="Vacío = sin aprobado/suspenso">
            <input
              type="number"
              min={0}
              max={100}
              value={draft.passMarkPercent ?? ''}
              placeholder="Sin corte"
              onChange={(e) => update({ passMarkPercent: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </Field>
        </fieldset>

        <fieldset className="card stack" style={{ margin: 0 }}>
          <legend className="field__label">Desarrollo</legend>
          <Field label="Corrección">
            <select value={draft.feedback} onChange={(e) => update({ feedback: e.target.value as FeedbackMode })}>
              <option value="end">Al terminar (simulacro real)</option>
              <option value="immediate">Al momento, pregunta a pregunta (aprendizaje)</option>
            </select>
          </Field>
          <label className="check">
            <input type="checkbox" checked={draft.shuffleQuestions} onChange={(e) => update({ shuffleQuestions: e.target.checked })} />
            Barajar el orden de las preguntas
          </label>
          <label className="check">
            <input type="checkbox" checked={draft.shuffleOptions} onChange={(e) => update({ shuffleOptions: e.target.checked })} />
            Barajar el orden de las opciones
          </label>
        </fieldset>

        {error ? <div className="notice notice--error">{error}</div> : null}
        <button type="submit" className="btn btn--primary btn--block" disabled={!draft.name.trim()}>
          Guardar tipo de examen
        </button>
      </form>
    </Page>
  );
}
