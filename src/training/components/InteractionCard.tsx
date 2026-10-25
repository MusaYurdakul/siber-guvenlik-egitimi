import { CircleCheck, CircleX, MousePointerClick } from 'lucide-react';
import type { Interaction } from '../types';
import { MockEmailView } from './VisualCard';

interface Props {
  interaction: Interaction;
  answer?: { selectedId: string; correct: boolean };
  onAnswer: (selectedId: string) => void;
}

/** Bölüm içi mini etkileşim: kullanıcı seçer, ardından kaynak metne dayalı kısa açıklama gösterilir. */
export function InteractionCard({ interaction, answer, onAnswer }: Props) {
  const hasEmails = interaction.options.some((o) => o.email);
  return (
    <section className="interaction" aria-labelledby={`${interaction.id}-title`}>
      <header>
        <span className="chip chip--interactive"><MousePointerClick size={13} aria-hidden="true" /> Siz olsanız?</span>
        <h3 id={`${interaction.id}-title`}>{interaction.title}</h3>
        <p>{interaction.scenario}</p>
      </header>
      <div className={`interaction__options ${hasEmails ? 'is-emails' : ''}`} role="group" aria-label="Seçenekler">
        {interaction.options.map((o) => {
          const selected = answer?.selectedId === o.id;
          const isCorrect = o.id === interaction.correctId;
          const cls = !answer ? '' : isCorrect ? 'is-correct' : selected ? 'is-wrong' : 'is-muted';
          return (
            <button key={o.id} className={`option ${cls}`} disabled={Boolean(answer)} aria-pressed={selected} onClick={() => onAnswer(o.id)}>
              <span className="option__label">{o.label}</span>
              {o.email && <MockEmailView email={o.email} flagged={Boolean(answer) && isCorrect} />}
              {answer && isCorrect && <CircleCheck className="option__mark" size={18} aria-label="Doğru cevap" />}
              {answer && selected && !isCorrect && <CircleX className="option__mark" size={18} aria-label="Seçiminiz" />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {answer && (
          <p className={`interaction__feedback ${answer.correct ? 'is-correct' : 'is-wrong'}`}>
            <strong>{answer.correct ? 'Doğru.' : 'Doğru davranış bu değil.'}</strong> {interaction.explanation}
          </p>
        )}
      </div>
    </section>
  );
}
