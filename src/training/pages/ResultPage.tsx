import { ArrowRight, Award, CircleCheck, CircleX, Printer, RotateCcw } from 'lucide-react';
import { TRAINING, formatMinutes, trainingSections } from '../data/sections';
import { useProgress } from '../services/progress';
import { go, paths } from '../router';
import { FourSteps } from '../components/FourSteps';

const dateTime = (iso: string) => new Date(iso).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });

export function ResultPage() {
  const p = useProgress();
  const attempt = p.lastAttempt;
  if (!attempt) return null;
  const completion = p.completion;
  const required = Math.ceil(attempt.total * TRAINING.passRate);
  const wrongSections = [...new Set(attempt.answers.filter((a) => !a.correct).map((a) => a.sectionId))].sort((a, b) => a - b);

  return (
    <div className="page result">
      {completion ? (
        <section className="certificate" aria-labelledby="done-title">
          <Award size={52} aria-hidden="true" />
          <h1 id="done-title">Bilgi Güvenliği ve Siber Güvenlik Farkındalık Eğitimi Başarıyla Tamamlandı</h1>
          <p className="certificate__name">{completion.userName}</p>
          <dl className="facts">
            <div><dt>Tamamlanma tarihi</dt><dd>{dateTime(completion.completedAt)}</dd></div>
            <div><dt>Sınav skoru</dt><dd>%{completion.score}</dd></div>
            <div><dt>Başarı durumu</dt><dd>Başarılı</dd></div>
            <div><dt>Deneme sayısı</dt><dd>{completion.attempt}</dd></div>
            <div><dt>Eğitim süresi</dt><dd>{formatMinutes(completion.trainingDurationSec)}</dd></div>
            <div><dt>Kullanıcı</dt><dd>{completion.userId}</dd></div>
          </dl>
          <FourSteps size="lg" />
          <p className="certificate__motto">Durun. Doğrulayın. Koruyun. Bildirin.</p>
          <div className="module__nav no-print">
            <button className="btn btn--primary" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Yazdır / PDF olarak kaydet</button>
          </div>
          <p className="muted no-print" role="status">Sınavınız sunucuda puanlandı ve tamamlama kaydınız oluşturuldu.</p>
          <details className="no-print">
            <summary>Tamamlama kaydı (JSON)</summary>
            <pre>{JSON.stringify(completion, null, 2)}</pre>
          </details>
        </section>
      ) : (
        <section className="panel fail" aria-labelledby="fail-title">
          <CircleX size={44} aria-hidden="true" />
          <h1 id="fail-title">Bu denemede geçme puanına ulaşılamadı</h1>
          <p className="lead">
            {attempt.total} sorudan {attempt.correctCount} doğru (%{attempt.score}). Başarı için en az {required} doğru (%{TRAINING.passRate * 100}) gerekir.
          </p>
          <h2>Tekrar etmeniz önerilen konular</h2>
          <ul className="topic-list">
            {wrongSections.map((id) => (
              <li key={id}>
                <span>Bölüm {id}: {trainingSections[id - 1].title}</span>
                <a className="btn btn--ghost" href={paths.section(id)}>Bölüme dön <ArrowRight size={14} aria-hidden="true" /></a>
              </li>
            ))}
          </ul>
          <button className="btn btn--primary btn--lg" onClick={() => go(paths.quiz)}>
            <RotateCcw size={16} aria-hidden="true" /> Sınavı tekrar çöz
          </button>
          <p className="muted">Tekrar sınavında soru sırası ve sorular değişir. Bu deneme: {attempt.attempt}.</p>
        </section>
      )}

      <section className="panel no-print">
        <h2>Yanıtlarınız — {attempt.correctCount} / {attempt.total} doğru</h2>
        <ol className="review">
          {(p.lastReview ?? []).map((q) => {
            const correct = q.selectedIndex === q.correctIndex;
            return (
              <li key={q.questionId} className={correct ? 'is-correct' : 'is-wrong'}>
                <p className="review__q">
                  {correct ? <CircleCheck size={18} aria-label="Doğru" /> : <CircleX size={18} aria-label="Yanlış" />} {q.text}
                </p>
                {!correct && <p>Yanıtınız: {q.selectedIndex === null ? '—' : q.options[q.selectedIndex]}</p>}
                <p><strong>Doğru cevap:</strong> {q.options[q.correctIndex]}</p>
                <p className="muted">{q.explanation} <a href={paths.section(q.sectionId)}>Bölüm {q.sectionId}</a></p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
