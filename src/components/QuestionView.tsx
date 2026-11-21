import type { AttemptItem } from '../domain/types';
import { letter } from '../lib/format';

interface Props {
  item: AttemptItem;
  /** Mostrar correcta/incorrecta y la explicación. */
  revealed: boolean;
  onAnswer?: (optionId: string) => void;
}

/** Enunciado + opciones. Se usa tanto al hacer el examen como al revisarlo. */
export function QuestionView({ item, revealed, onAnswer }: Props) {
  return (
    <div>
      {item.stem ? <div className="stem">{item.stem}</div> : null}
      {item.image ? <img src={item.image} alt="Imagen de la pregunta" className="stem-image" /> : null}

      <div className="options" role="radiogroup" aria-label="Opciones">
        {item.options.map((o, i) => {
          const selected = item.answerOptionId === o.id;
          const isCorrect = o.id === item.correctOptionId;
          let cls = 'option';
          if (revealed && isCorrect) cls += ' option--correct';
          else if (revealed && selected) cls += ' option--wrong';
          else if (selected) cls += ' option--selected';
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cls}
              disabled={revealed || !onAnswer}
              onClick={() => onAnswer?.(o.id)}
            >
              <span className="option__letter">{letter(i)}</span>
              <span className="option__body">
                {o.text}
                {o.image ? <img src={o.image} alt={`Opción ${letter(i)}`} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {revealed ? (
        <div className={`notice ${item.answerOptionId === item.correctOptionId ? 'notice--ok' : item.answerOptionId === null ? '' : 'notice--error'}`}>
          <strong>
            {item.answerOptionId === null
              ? 'En blanco. '
              : item.answerOptionId === item.correctOptionId
                ? '¡Correcto! '
                : 'Incorrecto. '}
          </strong>
          {item.answerOptionId !== item.correctOptionId ? (
            <span>La respuesta correcta es la {letter(item.options.findIndex((o) => o.id === item.correctOptionId))}. </span>
          ) : null}
          {item.explanation ? <div className="pre" style={{ marginTop: '0.4rem', color: 'var(--c-text)' }}>{item.explanation}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
