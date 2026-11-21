import { repo as defaultRepo, type Repo } from './repo';
import { toQuestions, type InterchangeQuestion } from '../domain/interchange';

/**
 * Proyecto de ejemplo para probar la app al instante.
 * Preguntas originales escritas para Tailor-test (sin material de terceros).
 */
const VERBAL: InterchangeQuestion[] = [
  {
    question:
      'Texto: «El teletrabajo se extendió con rapidez durante 2020. Algunas empresas han mantenido modelos híbridos, mientras que otras han pedido a su plantilla volver a la oficina a tiempo completo. Los estudios sobre su efecto en la productividad muestran resultados dispares según el sector.»\n\nAfirmación: «El teletrabajo aumenta la productividad en todos los sectores.»',
    options: ['Verdadero', 'Falso', 'No se puede saber con el texto'],
    answer: 1,
    explanation:
      'El texto dice que los resultados son dispares según el sector, lo que contradice que aumente la productividad en TODOS. Por eso es falso, no simplemente "no se puede saber".',
    difficulty: 2,
  },
  {
    question:
      'Texto: «La biblioteca municipal amplió su horario en enero. Desde entonces abre también los sábados por la tarde.»\n\nAfirmación: «Antes de enero la biblioteca no abría los sábados por la tarde.»',
    options: ['Verdadero', 'Falso', 'No se puede saber con el texto'],
    answer: 0,
    explanation: '"Amplió su horario" y "desde entonces abre también" implican que antes no abría en esa franja.',
    difficulty: 1,
  },
  {
    question:
      'Texto: «El consejo aprobó el presupuesto con el voto favorable de la mayoría de sus miembros. Dos consejeros se abstuvieron.»\n\nAfirmación: «Ningún consejero votó en contra.»',
    options: ['Verdadero', 'Falso', 'No se puede saber con el texto'],
    answer: 2,
    explanation:
      'El texto informa de votos a favor y de dos abstenciones, pero no dice si hubo votos en contra. No podemos afirmarlo ni negarlo.',
    difficulty: 2,
  },
];

const NUMERICAL: InterchangeQuestion[] = [
  {
    question:
      'Ventas de una tienda (miles de €):\n\nTrimestre | 2025 | 2026\nT1 | 120 | 132\nT2 | 150 | 141\n\n¿Cuál fue la variación porcentual de las ventas del T1 entre 2025 y 2026?',
    options: ['+8 %', '+10 %', '+12 %', '−10 %'],
    answer: 1,
    explanation: '(132 − 120) / 120 = 12 / 120 = 0,10 → +10 %.',
    difficulty: 1,
  },
  {
    question:
      'Ventas de una tienda (miles de €):\n\nTrimestre | 2025 | 2026\nT1 | 120 | 132\nT2 | 150 | 141\n\n¿Qué porcentaje de las ventas del primer semestre de 2026 corresponde al T2?',
    options: ['48,3 %', '50,0 %', '51,6 %', '53,2 %'],
    answer: 2,
    explanation: 'Semestre 2026 = 132 + 141 = 273. 141 / 273 ≈ 0,5165 → 51,6 %.',
    difficulty: 2,
  },
  {
    question: 'Un producto cuesta 80 € tras aplicarle un descuento del 20 %. ¿Cuál era su precio original?',
    options: ['96 €', '100 €', '104 €', '64 €'],
    answer: 'B',
    explanation: 'Precio × 0,8 = 80 → Precio = 80 / 0,8 = 100 €. Error típico: sumar el 20 % a 80 (96 €).',
    difficulty: 2,
  },
];

const ABSTRACT: InterchangeQuestion[] = [
  {
    question: '¿Qué número continúa la serie?\n\n2, 6, 12, 20, 30, …',
    options: ['36', '40', '42', '44'],
    answer: 2,
    explanation: 'Las diferencias son 4, 6, 8, 10 → la siguiente es 12: 30 + 12 = 42. (También: n × (n + 1).)',
    difficulty: 2,
  },
  {
    question: '¿Qué letra continúa la serie?\n\nA, C, F, J, …',
    options: ['M', 'N', 'O', 'P'],
    answer: 2,
    explanation: 'Saltos de +2, +3, +4 → el siguiente es +5: J → O.',
    difficulty: 2,
  },
];

export async function createDemoProject(repo: Repo = defaultRepo): Promise<string> {
  const project = await repo.createProject({
    name: 'Proyecto de ejemplo',
    description: 'Proyecto de muestra para explorar Tailor-test. Puedes borrarlo cuando quieras.',
  });
  const topics = [
    { name: 'Razonamiento verbal', kind: 'verbal' as const, questions: VERBAL },
    { name: 'Razonamiento numérico', kind: 'numerical' as const, questions: NUMERICAL },
    { name: 'Series (razonamiento abstracto)', kind: 'abstract' as const, questions: ABSTRACT },
  ];
  for (const t of topics) {
    const topic = await repo.createTopic({ projectId: project.id, name: t.name, kind: t.kind });
    await repo.addQuestions(toQuestions(t.questions, { projectId: project.id, topicId: topic.id, source: 'import' }));
  }
  await repo.saveTemplate({
    projectId: project.id,
    name: 'Simulacro mixto',
    description: '',
    questionCount: 8,
    timeLimitMinutes: 10,
    topicIds: [],
    scoring: { correct: 1, wrong: -1 / 3, blank: 0 },
    shuffleQuestions: true,
    shuffleOptions: false,
    feedback: 'end',
    passMarkPercent: 50,
  });
  return project.id;
}
