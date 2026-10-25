import { ArrowRight, Award, Clock, Layers, ShieldCheck } from 'lucide-react';
import { TRAINING, durations, formatMinutes, trainingSections } from '../data/sections';
import { firstIncomplete, overallPercent, useProgress } from '../services/progress';
import { go, paths } from '../router';
import { FourSteps } from '../components/FourSteps';

export function WelcomePage() {
  const p = useProgress();
  const started = p.completedSections.length > 0 || p.activeSeconds > 0;

  const resume = () => {
    if (p.completion) return go(paths.result);
    const next = firstIncomplete(p);
    go(next ? (started ? paths.section(next) : paths.intro) : paths.summary);
  };

  return (
    <div className="welcome">
      <section className="hero">
        <p className="eyebrow"><ShieldCheck size={16} aria-hidden="true" /> Kurum içi farkındalık eğitimi</p>
        <h1>{TRAINING.title}</h1>
        <p className="hero__lead">
          Bilgi güvenliği herkesin sorumluluğudur. Bu eğitim; sesli anlatım, görseller, kısa sahneler ve
          bir final sınavıyla güvenli davranışları adım adım ele alır.
        </p>
        <ul className="stats">
          <li><Layers size={18} aria-hidden="true" /><strong>{trainingSections.length}</strong> bölüm</li>
          <li><Clock size={18} aria-hidden="true" /><strong>≈ {formatMinutes(durations.total)}</strong> toplam</li>
          <li><Award size={18} aria-hidden="true" /><strong>%{TRAINING.passRate * 100}</strong> geçme puanı</li>
        </ul>
        <FourSteps size="md" />
      </section>

      <section className="panel welcome__form">
        <h2>Hoş geldiniz, {p.user?.userName}</h2>
        {started ? (
          <p>Eğitim ilerlemeniz: %{overallPercent(p)} · {p.completedSections.length} / {trainingSections.length} bölüm tamamlandı.</p>
        ) : (
          <p>Eğitimi tek seferde bitirmeniz gerekmez; ilerlemeniz hesabınıza kaydedilir ve kaldığınız yerden devam edebilirsiniz.</p>
        )}
        <button className="btn btn--primary btn--lg" onClick={resume}>
          {p.completion ? 'Tamamlama ekranını aç' : started ? 'Kaldığım yerden devam et' : 'Eğitime başla'} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
