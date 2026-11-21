import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { Page } from '../components/Layout';
import { exportBackup, restoreBackup } from '../data/backup';
import { createDemoProject } from '../data/demo';
import { downloadJson, readFileAsText } from '../lib/files';

const REPO_URL = 'https://github.com/Crustaxis/tailor-test';

export function SettingsPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function onExport() {
    const backup = await exportBackup();
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(backup, `tailor-test-copia-${date}.json`);
    setMessage({ kind: 'ok', text: 'Copia descargada. Guárdala en un lugar seguro (Drive, correo, USB…).' });
  }

  async function onRestore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const s = await restoreBackup(await readFileAsText(file));
      setMessage({
        kind: 'ok',
        text: `Restaurado: ${s.projects} proyectos, ${s.topics} temas, ${s.questions} preguntas, ${s.templates} tipos de examen y ${s.attempts} resultados.`,
      });
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message });
    }
  }

  async function onDemo() {
    const id = await createDemoProject();
    navigate(`/p/${id}`);
  }

  return (
    <Page title="Ajustes" back="/">
      <div className="stack">
        {message ? <div className={`notice notice--${message.kind === 'ok' ? 'ok' : 'error'}`}>{message.text}</div> : null}

        <section className="card stack">
          <h2>Copia de seguridad</h2>
          <p className="small muted">
            Todo se guarda solo en este dispositivo y navegador. Si borras los datos del navegador o cambias de
            móvil, lo pierdes: exporta una copia de vez en cuando. También sirve para pasar tus tests a otro dispositivo.
          </p>
          <div className="grid-2">
            <button className="btn btn--primary" onClick={onExport}>
              ⬇ Exportar copia
            </button>
            <label className="btn">
              ⬆ Restaurar copia
              <input type="file" accept=".json,application/json" hidden onChange={onRestore} />
            </label>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            Restaurar añade los datos de la copia sin borrar los actuales.
          </p>
        </section>

        <section className="card stack">
          <h2>Instalar en el móvil</h2>
          <p className="small">
            <strong>Android (Chrome):</strong> menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».
            <br />
            <strong>iPhone (Safari):</strong> botón Compartir → «Añadir a pantalla de inicio».
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            Una vez instalada funciona sin conexión.
          </p>
        </section>

        <section className="card stack">
          <h2>Proyecto de ejemplo</h2>
          <p className="small muted">Crea un proyecto con preguntas de muestra para probar la app.</p>
          <button className="btn" onClick={onDemo}>
            Crear proyecto de ejemplo
          </button>
        </section>

        <section className="card stack" id="formato">
          <h2>Formato de preguntas (JSON)</h2>
          <p className="small">
            Para importar preguntas, escribe (o pide a una IA) un JSON así. <code>answer</code> admite el índice
            empezando en 0, la letra (<code>"B"</code>) o el texto exacto de la opción.
          </p>
          <pre className="code card" style={{ overflowX: 'auto', margin: 0 }}>
            {`{
  "format": "tailor-test/questions",
  "version": 1,
  "questions": [
    {
      "question": "¿Cuánto es 15 % de 200?",
      "options": ["15", "25", "30", "35"],
      "answer": 2,
      "explanation": "200 × 0,15 = 30",
      "difficulty": 1
    }
  ]
}`}
          </pre>
        </section>

        <section className="card stack">
          <h2>Acerca de</h2>
          <p className="small">
            <strong>Tailor-test</strong> es software libre y gratuito (licencia MIT), sin anuncios ni registro.
            Código, sugerencias y errores en{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            Versión {__APP_VERSION__}
          </p>
        </section>
      </div>
    </Page>
  );
}
