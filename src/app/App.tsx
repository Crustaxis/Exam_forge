import { HashRouter, Route, Routes } from 'react-router';
import { HomePage } from '../pages/HomePage';
import { ProjectPage } from '../pages/ProjectPage';
import { TopicPage } from '../pages/TopicPage';
import { QuestionEditorPage } from '../pages/QuestionEditorPage';
import { ImportPage } from '../pages/ImportPage';
import { TemplateEditorPage } from '../pages/TemplateEditorPage';
import { ExamPage } from '../pages/ExamPage';
import { ResultPage } from '../pages/ResultPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFound } from '../components/Layout';

/**
 * HashRouter (#/ruta) para que funcione en cualquier hosting estático
 * (GitHub Pages incluido) sin configurar redirecciones.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ajustes" element={<SettingsPage />} />
        <Route path="/p/:projectId" element={<ProjectPage />} />
        <Route path="/p/:projectId/temas/:topicId" element={<TopicPage />} />
        <Route path="/p/:projectId/temas/:topicId/importar" element={<ImportPage />} />
        <Route path="/p/:projectId/temas/:topicId/preguntas/nueva" element={<QuestionEditorPage />} />
        <Route path="/p/:projectId/temas/:topicId/preguntas/:questionId" element={<QuestionEditorPage />} />
        <Route path="/p/:projectId/examenes/nuevo" element={<TemplateEditorPage />} />
        <Route path="/p/:projectId/examenes/:templateId" element={<TemplateEditorPage />} />
        <Route path="/intento/:attemptId" element={<ExamPage />} />
        <Route path="/intento/:attemptId/resultado" element={<ResultPage />} />
        <Route path="*" element={<NotFound what="esta página" />} />
      </Routes>
    </HashRouter>
  );
}
