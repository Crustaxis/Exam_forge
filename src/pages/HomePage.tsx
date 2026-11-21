import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { repo } from '../data/repo';
import { createDemoProject } from '../data/demo';
import { EmptyState, Loading, Page } from '../components/Layout';
import { plural } from '../lib/format';

export function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const projects = useLiveQuery(async () => {
    const list = await db.projects.orderBy('updatedAt').reverse().toArray();
    return Promise.all(
      list.map(async (p) => ({
        ...p,
        topics: await db.topics.where('projectId').equals(p.id).count(),
        questions: await db.questions.where('projectId').equals(p.id).count(),
      })),
    );
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const project = await repo.createProject({ name });
    setName('');
    setCreating(false);
    navigate(`/p/${project.id}`);
  }

  return (
    <Page
      title="Tailor-test"
      actions={
        <Link to="/ajustes" className="app-bar__icon" aria-label="Ajustes">
          ⚙
        </Link>
      }
    >
      <div className="stack">
        {projects === undefined ? (
          <Loading />
        ) : projects.length === 0 ? (
          <div className="card stack">
            <h2>Tests a medida 🎯</h2>
            <p>
              Crea un <strong>proyecto</strong> por cada examen u oposición que prepares. Dentro, organiza tus{' '}
              <strong>temas</strong>, añade preguntas tipo test (a mano, importándolas o generándolas con la IA que
              prefieras) y define <strong>tipos de examen</strong> con su tiempo y su puntuación.
            </p>
            <p className="muted small">
              Tus datos se guardan solo en este dispositivo. Haz copias de seguridad desde Ajustes.
            </p>
            <button
              type="button"
              className="btn"
              onClick={async () => navigate(`/p/${await createDemoProject()}`)}
            >
              Probar con un proyecto de ejemplo
            </button>
          </div>
        ) : (
          <ul className="list">
            {projects.map((p) => (
              <li key={p.id}>
                <Link to={`/p/${p.id}`} className="list-item">
                  <div className="list-item__main">
                    <div className="list-item__title">{p.name}</div>
                    <div className="list-item__sub">
                      {plural(p.topics, 'tema', 'temas')} · {plural(p.questions, 'pregunta', 'preguntas')}
                    </div>
                  </div>
                  <span aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {creating || projects?.length === 0 ? (
          <form className="card stack" onSubmit={onCreate}>
            <label className="field">
              <span className="field__label">Nuevo proyecto</span>
              <input
                type="text"
                autoFocus={creating}
                placeholder="Ej.: Oposición Administrativo 2027"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </label>
            <div className="row row--end">
              {projects && projects.length > 0 ? (
                <button type="button" className="btn btn--ghost" onClick={() => setCreating(false)}>
                  Cancelar
                </button>
              ) : null}
              <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
                Crear proyecto
              </button>
            </div>
          </form>
        ) : projects ? (
          <EmptyState>
            <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
              + Nuevo proyecto
            </button>
          </EmptyState>
        ) : null}
      </div>
    </Page>
  );
}
