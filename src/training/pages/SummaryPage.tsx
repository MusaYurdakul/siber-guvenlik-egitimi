import { ArrowRight } from 'lucide-react';
import { TRAINING, formatMinutes, durations, trainingSections } from '../data/sections';
import { interactionScore, useProgress } from '../services/progress';
import { go, paths } from '../router';
import { FourSteps } from '../components/FourSteps';

export function SummaryPage() {
  const p = useProgress();
  const mini = interactionScore(p);
  return (
    <div className="page">
      <p className="eyebrow">Eğitim özeti</p>
      <h1>Tüm bölümleri tamamladınız</h1>
      <p className="lead">Şüpheli bir olayla karşılaştığınızda dört adımı hatırlayın.</p>
      <FourSteps size="lg" />

      <section className="panel">
        <h2>Bölümlerin ekran mesajları</h2>
        <ol className="summary-list">
          {trainingSections.map((s) => (
            <li key={s.id}>
              <a href={paths.section(s.id)}>{s.title}</a>
              <p>{s.keyMessage}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel panel--row">
        <div>
          <h2>Final farkındalık sınavı</h2>
          <p>
            {TRAINING.questionCount} soru · yaklaşık {formatMinutes(durations.quiz)} · geçme puanı %{TRAINING.passRate * 100}.
            {mini.total > 0 && ` Bölüm içi etkileşimlerde ${mini.total} sorudan ${mini.correct} doğru yanıt verdiniz (sınav puanına dâhil değildir).`}
          </p>
        </div>
        <button className="btn btn--primary btn--lg" onClick={() => go(paths.quiz)}>
          {p.attempts > 0 ? 'Sınavı tekrar çöz' : 'Sınava başla'} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
