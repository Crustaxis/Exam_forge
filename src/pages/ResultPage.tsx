import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Loading, NotFound, Page } from '../components/Layout';
import { QuestionView } from '../components/QuestionView';
import { startExam } from '../app/startExam';
import { formatDuration, formatNumber } from '../lib/format';
import type { AttemptItem } from '../domain/types';

type Filter = 'all' | 'wrong' | 'blank' | 'flagged';

const isWrong = (i: AttemptItem) => i.answerOptionId !== null && i.answerOptionId !== i.correctOptionId;

export function ResultPage() {
  const { attemptId = '' } = useParams();
  const navigate = useNavigate();
  const attempt = useLiveQuery(() => db.attempts.get(attemptId).then((a) => a ?? null), [attemptId]);
  const template = useLiveQuery(
    async () => (attempt?.templateId ? ((await db.templates.get(attempt.templateId)) ?? null) : null),
    [attempt?.templateId],
  );
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);

  if (attempt === undefined) return <Loading />;
  if (attempt === null) return <NotFound what="el resultado" />;
  if (!attempt.result || attempt.finishedAt === null) return <Navigate to={`/intento/${attempt.id}`} replace />;

  const r = attempt.result;
  const back = `/p/${attempt.projectId}?tab=historial`;
  const duration = attempt.finishedAt - attempt.startedAt;
  const items = attempt.items.filter((i) =>
    filter === 'wrong' ? isWrong(i) : filter === 'blank' ? i.answerOptionId === null : filter === 'flagged' ? i.flagged : true,
  );

  async function onRepeat() {
    setError(null);
    try {
      const source = template ?? {
        projectId: attempt!.projectId,
        name: attempt!.title,
        description: '',
        questionCount: attempt!.items.length,
        timeLimitMinutes: attempt!.timeLimitMinutes,
        topicIds: [...new Set(attempt!.items.map((i) => i.topicId))],
        scoring: attempt!.scoring,
        shuffleQuestions: true,
        shuffleOptions: true,
        feedback: attempt!.feedback,
        passMarkPercent: attempt!.passMarkPercent,
      };
      const id = await startExam(source);
      navigate(`/intento/${id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onDelete() {
    if (!confirm('¿Borrar este resultado del historial?')) return;
    await repo.deleteAttempt(attempt!.id);
    navigate(back);
  }

  return (
    <Page
      title="Resultado"
      back={back}
      actions={
        <button className="app-bar__icon" onClick={onDelete} aria-label="Borrar del historial">
          🗑
        </button>
      }
    >
      <div className="stack">
        <div className="card stack center">
          <div className="muted">{attempt.title}</div>
          <div className="score-big">{formatNumber(r.percent)} %</div>
          <div>
            {formatNumber(r.score)} / {formatNumber(r.maxScore)} puntos
            {r.passed !== null ? (
              <span className={`badge ${r.passed ? 'badge--ok' : 'badge--ko'}`} style={{ marginLeft: 8 }}>
                {r.passed ? 'Aprobado' : 'Suspenso'}
              </span>
            ) : null}
          </div>
          <div className="stats">
            <div>
              <div className="stats__n" style={{ color: 'var(--c-success)' }}>{r.correct}</div>
              <div className="small muted">aciertos</div>
            </div>
            <div>
              <div className="stats__n" style={{ color: 'var(--c-danger)' }}>{r.wrong}</div>
              <div className="small muted">fallos</div>
            </div>
            <div>
              <div className="stats__n">{r.blank}</div>
              <div className="small muted">en blanco</div>
            </div>
          </div>
          <div className="small muted">
            Tiempo: {formatDuration(duration)}
            {attempt.items.length ? ` · ${formatDuration(duration / attempt.items.length)} por pregunta` : ''}
          </div>
        </div>

        {error ? <div className="notice notice--error">{error}</div> : null}
        <div className="grid-2">
          <button className="btn btn--primary" onClick={onRepeat}>
            ↻ Otro igual
          </button>
          <Link to={`/p/${attempt.projectId}`} className="btn">
            Volver al proyecto
          </Link>
        </div>

        <h2>Revisión</h2>
        <div className="tabs" role="tablist">
          {(
            [
              ['all', `Todas (${attempt.items.length})`],
              ['wrong', `Fallos (${r.wrong})`],
              ['blank', `Blanco (${r.blank})`],
              ['flagged', `Dudosas (${attempt.items.filter((i) => i.flagged).length})`],
            ] as const
          ).map(([key, label]) => (
            <button key={key} role="tab" className="tab small" aria-selected={filter === key} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="muted center">Nada que mostrar con este filtro.</p>
        ) : (
          items.map((item) => {
            const n = attempt.items.indexOf(item) + 1;
            return (
              <div key={`${item.questionId}-${n}`} className="card">
                <div className="row row--between small muted" style={{ marginBottom: '0.5rem' }}>
                  <span>Pregunta {n}</span>
                  <span>
                    {item.flagged ? '⚑ ' : ''}
                    {formatDuration(item.timeSpentMs)}
                  </span>
                </div>
                <QuestionView item={item} revealed />
              </div>
            );
          })
        )}
      </div>
    </Page>
  );
}
