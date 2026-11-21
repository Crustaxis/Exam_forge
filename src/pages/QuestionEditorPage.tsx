import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Field, Loading, NotFound, Page } from '../components/Layout';
import { MAX_OPTIONS, MIN_OPTIONS, type Question, type QuestionOption } from '../domain/types';
import { newId } from '../domain/random';
import { imageFileToDataUrl } from '../lib/files';
import { letter } from '../lib/format';

interface Draft {
  stem: string;
  image?: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
  tags: string;
}

function emptyDraft(): Draft {
  const options = Array.from({ length: 4 }, () => ({ id: newId(), text: '' }));
  return { stem: '', options, correctOptionId: options[0]!.id, explanation: '', difficulty: 2, tags: '' };
}

function toDraft(q: Question): Draft {
  return {
    stem: q.stem,
    ...(q.image ? { image: q.image } : {}),
    options: q.options,
    correctOptionId: q.correctOptionId,
    explanation: q.explanation,
    difficulty: q.difficulty,
    tags: q.tags.join(', '),
  };
}

export function QuestionEditorPage() {
  const { projectId = '', topicId = '', questionId } = useParams();
  const navigate = useNavigate();
  const back = `/p/${projectId}/temas/${topicId}`;
  const existing = useLiveQuery(
    async () => (questionId ? ((await db.questions.get(questionId)) ?? null) : null),
    [questionId],
  );
  const [draft, setDraft] = useState<Draft | null>(questionId ? null : emptyDraft());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questionId && existing) setDraft(toDraft(existing));
  }, [questionId, existing]);

  if (questionId && existing === null) return <NotFound what="la pregunta" back={back} />;
  if (!draft) return <Loading />;

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updateOption = (id: string, patch: Partial<QuestionOption>) =>
    update({ options: draft.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });

  function removeOption(id: string) {
    const options = draft!.options.filter((o) => o.id !== id);
    update({
      options,
      correctOptionId: draft!.correctOptionId === id ? options[0]!.id : draft!.correctOptionId,
    });
  }

  async function pickImage(e: ChangeEvent<HTMLInputElement>, apply: (dataUrl: string) => void) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      apply(await imageFileToDataUrl(file));
    } catch {
      setError('No se pudo cargar la imagen.');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await repo.saveQuestion({
        ...(questionId ? { id: questionId } : {}),
        projectId,
        topicId,
        stem: draft!.stem.trim(),
        ...(draft!.image ? { image: draft!.image } : {}),
        options: draft!.options.map((o) => ({ ...o, text: o.text.trim() })),
        correctOptionId: draft!.correctOptionId,
        explanation: draft!.explanation.trim(),
        difficulty: draft!.difficulty,
        tags: draft!.tags.split(',').map((t) => t.trim()).filter(Boolean),
        source: existing?.source ?? 'manual',
      });
      navigate(back);
    } catch (err) {
      const issues = (err as { issues?: { message: string }[] }).issues;
      setError(issues?.map((i) => i.message).join(' · ') ?? 'Revisa la pregunta: faltan datos.');
    }
  }

  async function onDelete() {
    if (!questionId || !confirm('¿Borrar esta pregunta?')) return;
    await repo.deleteQuestion(questionId);
    navigate(back);
  }

  return (
    <Page
      title={questionId ? 'Editar pregunta' : 'Nueva pregunta'}
      back={back}
      actions={
        questionId ? (
          <button className="app-bar__icon" onClick={onDelete} aria-label="Borrar pregunta">
            🗑
          </button>
        ) : null
      }
    >
      <form className="stack" onSubmit={onSubmit}>
        <Field label="Enunciado" hint="Para razonamiento verbal o numérico puedes incluir el texto o la tabla aquí.">
          <textarea rows={6} value={draft.stem} onChange={(e) => update({ stem: e.target.value })} />
        </Field>

        <div className="row">
          <label className="btn btn--sm">
            🖼 {draft.image ? 'Cambiar imagen' : 'Añadir imagen'}
            <input type="file" accept="image/*" hidden onChange={(e) => pickImage(e, (image) => update({ image }))} />
          </label>
          {draft.image ? (
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => update({ image: undefined })}>
              Quitar imagen
            </button>
          ) : null}
        </div>
        {draft.image ? <img src={draft.image} alt="Imagen del enunciado" className="thumb" /> : null}

        <fieldset className="card stack" style={{ margin: 0 }}>
          <legend className="field__label">Opciones (marca la correcta)</legend>
          {draft.options.map((o, i) => (
            <div key={o.id} className="stack" style={{ borderTop: i ? '1px solid var(--c-border)' : 0, paddingTop: i ? '0.75rem' : 0 }}>
              <div className="row">
                <label className="check" title="Respuesta correcta">
                  <input
                    type="radio"
                    name="correct"
                    checked={draft.correctOptionId === o.id}
                    onChange={() => update({ correctOptionId: o.id })}
                    aria-label={`Marcar ${letter(i)} como correcta`}
                  />
                  <strong>{letter(i)}</strong>
                </label>
                <input
                  type="text"
                  className="grow"
                  style={{ width: 'auto', flex: 1 }}
                  value={o.text}
                  onChange={(e) => updateOption(o.id, { text: e.target.value })}
                  placeholder={`Opción ${letter(i)}`}
                />
              </div>
              <div className="row">
                <label className="btn btn--sm btn--ghost">
                  🖼
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => pickImage(e, (image) => updateOption(o.id, { image }))}
                  />
                </label>
                {o.image ? (
                  <>
                    <img src={o.image} alt={`Imagen opción ${letter(i)}`} className="thumb" style={{ maxHeight: 60 }} />
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      onClick={() => updateOption(o.id, { image: undefined })}
                    >
                      Quitar
                    </button>
                  </>
                ) : null}
                <span className="grow" />
                {draft.options.length > MIN_OPTIONS ? (
                  <button type="button" className="btn btn--sm btn--ghost" onClick={() => removeOption(o.id)}>
                    Eliminar opción
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {draft.options.length < MAX_OPTIONS ? (
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => update({ options: [...draft.options, { id: newId(), text: '' }] })}
            >
              + Añadir opción
            </button>
          ) : null}
        </fieldset>

        <Field label="Explicación (opcional)" hint="Se muestra al corregir. Muy útil para aprender de los fallos.">
          <textarea rows={3} value={draft.explanation} onChange={(e) => update({ explanation: e.target.value })} />
        </Field>

        <div className="grid-2">
          <Field label="Dificultad">
            <select
              value={draft.difficulty}
              onChange={(e) => update({ difficulty: Number(e.target.value) as 1 | 2 | 3 })}
            >
              <option value={1}>Fácil</option>
              <option value={2}>Media</option>
              <option value={3}>Difícil</option>
            </select>
          </Field>
          <Field label="Etiquetas" hint="Separadas por comas">
            <input type="text" value={draft.tags} onChange={(e) => update({ tags: e.target.value })} />
          </Field>
        </div>

        {error ? <div className="notice notice--error">{error}</div> : null}

        <button type="submit" className="btn btn--primary btn--block">
          Guardar pregunta
        </button>
      </form>
    </Page>
  );
}
