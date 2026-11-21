import { useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { Field, Loading, NotFound, Page } from '../components/Layout';
import { parseQuestionsJson, resolveAnswerIndex, toQuestions, type ParsedImport } from '../domain/interchange';
import { buildGenerationPrompt, MAX_MATERIAL_CHARS, type GenerationRequest } from '../ai/prompt';
import { copyToClipboard, readFileAsText } from '../lib/files';
import { letter } from '../lib/format';

type Mode = 'ia' | 'json';

export function ImportPage() {
  const { projectId = '', topicId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const mode: Mode = params.get('modo') === 'json' ? 'json' : 'ia';
  const back = `/p/${projectId}/temas/${topicId}`;

  const topic = useLiveQuery(() => db.topics.get(topicId).then((t) => t ?? null), [topicId]);
  const [raw, setRaw] = useState('');
  const [saving, setSaving] = useState(false);

  const parsed: ParsedImport | null = useMemo(() => (raw.trim() ? parseQuestionsJson(raw) : null), [raw]);

  if (topic === undefined) return <Loading />;
  if (topic === null) return <NotFound what="el tema" back={back} />;

  async function onSave() {
    if (!parsed || parsed.questions.length === 0) return;
    setSaving(true);
    const questions = toQuestions(parsed.questions, {
      projectId,
      topicId,
      source: mode === 'ia' ? 'ai' : 'import',
    });
    await repo.addQuestions(questions);
    navigate(back);
  }

  return (
    <Page title={mode === 'ia' ? 'Generar con IA' : 'Importar preguntas'} back={back}>
      <div className="stack">
        <div className="tabs" role="tablist">
          <button role="tab" className="tab" aria-selected={mode === 'ia'} onClick={() => setParams({ modo: 'ia' }, { replace: true })}>
            ✨ Con IA
          </button>
          <button role="tab" className="tab" aria-selected={mode === 'json'} onClick={() => setParams({ modo: 'json' }, { replace: true })}>
            ⬆ Archivo / JSON
          </button>
        </div>

        {mode === 'ia' ? (
          <PromptBuilder topic={topic} />
        ) : (
          <JsonSource onLoaded={setRaw} />
        )}

        <div className="card stack">
          <h3>{mode === 'ia' ? '2. Pega aquí la respuesta de la IA' : 'Contenido'}</h3>
          <textarea
            rows={8}
            className="code"
            placeholder={mode === 'ia' ? 'Pega la respuesta completa; se extrae el JSON automáticamente.' : 'Pega el JSON con las preguntas.'}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          {parsed ? <ImportPreview parsed={parsed} /> : null}
          <button
            className="btn btn--primary btn--block"
            disabled={!parsed || parsed.questions.length === 0 || saving}
            onClick={onSave}
          >
            {parsed && parsed.questions.length > 0
              ? `Guardar ${parsed.questions.length} preguntas en «${topic.name}»`
              : 'Guardar preguntas'}
          </button>
        </div>

        <p className="muted small center">
          Formato aceptado: <Link to="/ajustes#formato">ver formato de preguntas</Link>
        </p>
      </div>
    </Page>
  );
}

function PromptBuilder({ topic }: { topic: { name: string; kind: GenerationRequest['topic']['kind']; material: string } }) {
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<GenerationRequest['difficulty']>('mixed');
  const [optionsPerQuestion, setOptions] = useState(4);
  const [language, setLanguage] = useState('español');
  const [extra, setExtra] = useState('');
  const [copied, setCopied] = useState<boolean | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const prompt = useMemo(
    () =>
      buildGenerationPrompt({
        topic,
        count,
        difficulty,
        optionsPerQuestion,
        language,
        extraInstructions: extra,
      }),
    [topic, count, difficulty, optionsPerQuestion, language, extra],
  );

  async function onCopy() {
    setCopied(await copyToClipboard(prompt));
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div className="card stack">
      <h3>1. Prepara el encargo para la IA</h3>
      <p className="small muted">
        Copia el texto y pégalo en la IA que uses (ChatGPT, Gemini, Claude, Le Chat…; vale la versión gratuita).
        No hace falta clave ni cuenta en Tailor-test.
      </p>
      {!topic.material.trim() ? (
        <div className="notice notice--warn small">
          Este tema no tiene material de estudio. La IA usará su conocimiento general; para preguntas fieles a tu
          temario, pega tus apuntes en «Material de estudio» del tema.
        </div>
      ) : topic.material.length > MAX_MATERIAL_CHARS ? (
        <div className="notice notice--warn small">
          El material es muy largo; se enviarán los primeros {MAX_MATERIAL_CHARS.toLocaleString('es-ES')} caracteres.
          Divide el tema en partes para cubrirlo entero.
        </div>
      ) : null}
      <div className="grid-2">
        <Field label="Número de preguntas">
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          />
        </Field>
        <Field label="Opciones por pregunta">
          <select value={optionsPerQuestion} onChange={(e) => setOptions(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dificultad">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value === 'mixed' ? 'mixed' : (Number(e.target.value) as 1 | 2 | 3))}>
            <option value="mixed">Variada</option>
            <option value={1}>Fácil</option>
            <option value={2}>Media</option>
            <option value={3}>Difícil</option>
          </select>
        </Field>
        <Field label="Idioma de las preguntas">
          <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
        </Field>
      </div>
      <Field label="Instrucciones adicionales (opcional)">
        <input
          type="text"
          value={extra}
          placeholder="Ej.: céntrate en plazos y artículos concretos"
          onChange={(e) => setExtra(e.target.value)}
        />
      </Field>
      <div className="row">
        <button className="btn btn--primary grow" onClick={onCopy}>
          {copied === true ? 'Copiado ✓' : copied === false ? 'No se pudo copiar' : '📋 Copiar encargo'}
        </button>
        <button className="btn btn--ghost" onClick={() => setShowPrompt((s) => !s)}>
          {showPrompt ? 'Ocultar' : 'Ver'}
        </button>
      </div>
      {showPrompt || copied === false ? (
        <textarea readOnly rows={10} className="code" value={prompt} onFocus={(e) => e.target.select()} />
      ) : null}
    </div>
  );
}

function JsonSource({ onLoaded }: { onLoaded: (text: string) => void }) {
  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onLoaded(await readFileAsText(file));
  }
  return (
    <div className="card stack">
      <p className="small muted">
        Carga un archivo <code>.json</code> exportado de Tailor-test o escrito por ti, o pega su contenido abajo.
      </p>
      <label className="btn btn--block">
        Elegir archivo…
        <input type="file" accept=".json,application/json,text/plain" hidden onChange={onFile} />
      </label>
    </div>
  );
}

function ImportPreview({ parsed }: { parsed: ParsedImport }) {
  const preview = parsed.questions.slice(0, 3);
  return (
    <div className="stack">
      {parsed.questions.length > 0 ? (
        <div className="notice notice--ok small">
          {parsed.questions.length} preguntas válidas.
          {parsed.errors.length ? ` ${parsed.errors.length} se descartarán:` : ''}
        </div>
      ) : null}
      {parsed.errors.length ? (
        <div className="notice notice--error small">
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {parsed.errors.slice(0, 8).map((e) => (
              <li key={e}>{e}</li>
            ))}
            {parsed.errors.length > 8 ? <li>… y {parsed.errors.length - 8} más</li> : null}
          </ul>
        </div>
      ) : null}
      {preview.map((q, i) => {
        const correct = resolveAnswerIndex(q.answer, q.options);
        return (
          <div key={i} className="small" style={{ borderLeft: '3px solid var(--c-border)', paddingLeft: '0.75rem' }}>
            <div className="pre">{q.question.length > 200 ? `${q.question.slice(0, 200)}…` : q.question}</div>
            <div className="muted">
              {q.options.map((o, j) => (
                <span key={j} style={{ fontWeight: j === correct ? 700 : 400, marginRight: 8 }}>
                  {letter(j)}) {o}
                </span>
              ))}
            </div>
          </div>
        );
      })}
      {parsed.questions.length > preview.length ? (
        <p className="muted small">… y {parsed.questions.length - preview.length} más.</p>
      ) : null}
    </div>
  );
}
