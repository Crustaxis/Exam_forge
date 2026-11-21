import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Loading, NotFound } from '../components/Layout';
import { QuestionView } from '../components/QuestionView';
import { addTimeSpent, answerItem, attemptDeadline, finishAttempt, toggleFlag } from '../domain/exam';
import type { Attempt } from '../domain/types';
import { formatDuration } from '../lib/format';

export function ExamPage() {
  const { attemptId = '' } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null | undefined>(undefined);
  const [now, setNow] = useState(Date.now());
  const [showGrid, setShowGrid] = useState(false);
  const enteredAt = useRef(Date.now());

  // Carga inicial (una sola vez: a partir de aquí el estado local manda y se guarda en cada cambio).
  useEffect(() => {
    db.attempts.get(attemptId).then((a) => setAttempt(a ?? null));
  }, [attemptId]);

  // Guardado automático: si se cierra la app, el examen sigue donde estaba.
  useEffect(() => {
    if (attempt) void repo.saveAttempt(attempt);
  }, [attempt]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const latest = useRef(attempt);
  latest.current = attempt;
  const finishing = useRef(false);

  // Se guarda ANTES de actualizar el estado, para que la pantalla de resultados lo lea ya terminado.
  const finish = useCallback(async () => {
    const a = latest.current;
    if (!a || a.finishedAt !== null || finishing.current) return;
    finishing.current = true;
    const done = finishAttempt(addTimeSpent(a, a.currentIndex, Date.now() - enteredAt.current));
    await repo.saveAttempt(done);
    setAttempt(done);
  }, []);

  const goTo = useCallback((index: number) => {
    setAttempt((a) => {
      if (!a || index < 0 || index >= a.items.length || index === a.currentIndex) return a;
      const spent = Date.now() - enteredAt.current;
      enteredAt.current = Date.now();
      return { ...addTimeSpent(a, a.currentIndex, spent), currentIndex: index };
    });
    setShowGrid(false);
    window.scrollTo({ top: 0 });
  }, []);

  const deadline = attempt ? attemptDeadline(attempt) : null;
  const remaining = deadline === null ? null : deadline - now;

  // Fin automático al agotarse el tiempo.
  useEffect(() => {
    if (attempt && attempt.finishedAt === null && remaining !== null && remaining <= 0) void finish();
  }, [attempt, remaining, finish]);

  // Atajos de teclado (escritorio): A–F o 1–6 responden; flechas navegan.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!attempt || attempt.finishedAt !== null || e.target instanceof HTMLInputElement) return;
      const item = attempt.items[attempt.currentIndex];
      if (!item) return;
      const key = e.key.toUpperCase();
      const idx = 'ABCDEF'.indexOf(key) !== -1 ? 'ABCDEF'.indexOf(key) : '123456'.indexOf(key);
      if (idx !== -1 && item.options[idx]) {
        setAttempt((a) => (a ? answerItem(a, a.currentIndex, item.options[idx]!.id) : a));
      } else if (e.key === 'ArrowRight') goTo(attempt.currentIndex + 1);
      else if (e.key === 'ArrowLeft') goTo(attempt.currentIndex - 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attempt, goTo]);

  if (attempt === undefined) return <Loading />;
  if (attempt === null) return <NotFound what="el examen" />;
  if (attempt.finishedAt !== null) return <Navigate to={`/intento/${attempt.id}/resultado`} replace />;

  const index = attempt.currentIndex;
  const item = attempt.items[index];
  if (!item) return <NotFound what="la pregunta" />;
  const total = attempt.items.length;
  const answered = attempt.items.filter((i) => i.answerOptionId !== null).length;
  const isLast = index === total - 1;
  const revealed = attempt.feedback === 'immediate' && item.answerOptionId !== null;

  function onFinishClick() {
    const blank = total - answered;
    const msg = blank > 0 ? `Te quedan ${blank} preguntas sin responder. ¿Terminar igualmente?` : '¿Terminar el examen?';
    if (confirm(msg)) void finish();
  }

  function onExit() {
    navigate(`/p/${attempt!.projectId}?tab=historial`);
  }

  return (
    <>
      <header className="app-bar">
        <button className="app-bar__icon" onClick={onExit} aria-label="Salir (se guarda el progreso)">
          ✕
        </button>
        <span className="app-bar__title">{attempt.title}</span>
        <button className="btn btn--sm" style={{ background: 'transparent', borderColor: 'currentColor', color: 'inherit' }} onClick={onFinishClick}>
          Terminar
        </button>
      </header>
      <main className="page">
        <div className="exam-top">
          <span>
            Pregunta {index + 1} / {total}
          </span>
          {remaining !== null ? (
            <span className={`timer ${remaining < 60_000 ? 'timer--low' : ''}`} aria-live="off">
              ⏱ {formatDuration(remaining)}
            </span>
          ) : null}
          <button
            className={`btn btn--sm ${item.flagged ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setAttempt((a) => (a ? toggleFlag(a, index) : a))}
            aria-pressed={item.flagged}
          >
            ⚑ {item.flagged ? 'Marcada' : 'Dudosa'}
          </button>
        </div>
        <div className="progress" aria-hidden>
          <div className="progress__bar" style={{ width: `${(answered / total) * 100}%` }} />
        </div>

        <QuestionView
          item={item}
          revealed={revealed}
          onAnswer={(optionId) => setAttempt((a) => (a ? answerItem(a, index, optionId) : a))}
        />

        {attempt.feedback === 'end' && item.answerOptionId !== null ? (
          <button className="btn btn--sm btn--ghost" onClick={() => setAttempt((a) => (a ? answerItem(a, index, null) : a))}>
            Dejar en blanco
          </button>
        ) : null}

        {showGrid ? (
          <div className="card stack" style={{ marginTop: '1rem' }}>
            <div className="row row--between">
              <strong>
                {answered} de {total} respondidas
              </strong>
              <button className="btn btn--sm btn--primary" onClick={onFinishClick}>
                Terminar
              </button>
            </div>
            <div className="qgrid">
              {attempt.items.map((it, i) => (
                <button
                  key={it.questionId + i}
                  className={[
                    'qgrid__cell',
                    it.answerOptionId !== null ? 'qgrid__cell--answered' : '',
                    i === index ? 'qgrid__cell--current' : '',
                    it.flagged ? 'qgrid__cell--flag' : '',
                  ].join(' ')}
                  onClick={() => goTo(i)}
                  aria-label={`Ir a la pregunta ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              El punto amarillo indica preguntas marcadas como dudosas.
            </p>
          </div>
        ) : null}
      </main>

      <nav className="bottom-bar">
        <div className="bottom-bar__inner">
          <button className="btn" onClick={() => goTo(index - 1)} disabled={index === 0}>
            ← Anterior
          </button>
          <button className="btn btn--ghost" style={{ flex: '0 0 auto' }} onClick={() => setShowGrid((s) => !s)} aria-expanded={showGrid}>
            ☰
          </button>
          {isLast ? (
            <button className="btn btn--primary" onClick={onFinishClick}>
              Terminar
            </button>
          ) : (
            <button className="btn btn--primary" onClick={() => goTo(index + 1)}>
              Siguiente →
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
