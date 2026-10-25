import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import type { QuizQuestion } from '../types';
import { formatClock } from '../data/sections';
import { progress } from '../services/progress';
import { startQuiz, submitQuiz } from '../services/records';
import { go, paths } from '../router';

const TYPE_LABEL = { multiple: 'Çoktan seçmeli', truefalse: 'Doğru / Yanlış', scenario: 'Senaryo' } as const;

/** Sorular sunucudan gelir, cevaplar sunucuda puanlanır; bu sayfa yalnızca seçimleri toplar. */
export function QuizPage() {
  const [items, setItems] = useState<QuizQuestion[] | null>(null);
  const [selected, setSelected] = useState<(number | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [startedIso, setStartedIso] = useState('');
  const startedAt = startedIso ? new Date(startedIso).getTime() : Date.now();
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [loadKey, setLoadKey] = useState(0);
  const [answersKey, setAnswersKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    void (async () => {
      // Önce ilerleme sunucuya yazılır (başka hesaba geçilmişse burada fark edilir). Sınav isteği de
      // ilerlemeyi taşır; sunucu bölümlerin tamamlandığını bu güncel kayıttan denetler.
      await progress.flush();
      const res = await startQuiz(progress.get());
      if (cancelled) return;
      if (!res.data) return setError(res.error);
      const { questions, startedAt: started } = res.data;
      // Sayfa yenilenirse işaretlenen şıklar kaybolmasın.
      const key = `sgf-quiz:${progress.get().user?.userId}:${started}`;
      let saved: (number | null)[] = [];
      try {
        saved = JSON.parse(sessionStorage.getItem(key) ?? '[]');
      } catch {
        // Kayıt okunamazsa boş başlanır.
      }
      setAnswersKey(key);
      setItems(questions);
      setSelected(questions.map((_, i) => (Number.isInteger(saved[i]) ? saved[i] : null)));
      setStartedIso(started);
    })();
    return () => { cancelled = true; };
  }, [loadKey]);

  const choose = (next: (number | null)[]) => {
    setSelected(next);
    try {
      sessionStorage.setItem(answersKey, JSON.stringify(next));
    } catch {
      // Depolama kapalıysa şıklar yalnızca bu sayfa açıkken tutulur.
    }
  };

  useEffect(() => {
    const t = window.setInterval(() => setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000))), 1000);
    return () => window.clearInterval(t);
  }, [startedAt]);

  if (!items) {
    return (
      <div className="page quiz">
        <p className="eyebrow">Final farkındalık sınavı</p>
        {error ? (
          <>
            <p className="form__error" role="alert">{error}</p>
            <p><button className="btn btn--primary" onClick={() => setLoadKey(loadKey + 1)}>Tekrar dene</button></p>
          </>
        ) : <p role="status">Sınav hazırlanıyor…</p>}
      </div>
    );
  }

  const question = items[index];
  const answered = selected.filter((s) => s !== null).length;
  const allAnswered = answered === items.length;

  const submit = async () => {
    setSubmitting(true);
    setError('');
    const res = await submitQuiz(selected as number[], startedIso);
    if (!res.data) {
      setError(res.error);
      return setSubmitting(false);
    }
    const { attempt, completion, review } = res.data;
    progress.update((d) => {
      d.attempts = attempt.attempt;
      d.lastAttempt = attempt;
      d.lastReview = review;
      if (completion) d.completion = completion;
    });
    go(paths.result);
  };

  return (
    <div className="page quiz">
      <p className="eyebrow">Final farkındalık sınavı</p>
      <div className="quiz__top">
        <h1>Soru {index + 1} / {items.length}</h1>
        <span className="quiz__timer" aria-label={`Geçen süre ${formatClock(elapsed)}`}>{formatClock(elapsed)}</span>
      </div>
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={answered} aria-label="Yanıtlanan soru sayısı">
        <span style={{ width: `${(answered / items.length) * 100}%` }} />
      </div>

      <fieldset className="panel question">
        <legend><span className="chip">{TYPE_LABEL[question.type]}</span></legend>
        <p className="question__text">{question.text}</p>
        {question.options.map((text, i) => (
          <label key={text} className={`option option--radio ${selected[index] === i ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name={question.id}
              checked={selected[index] === i}
              onChange={() => choose(selected.map((s, n) => (n === index ? i : s)))}
            />
            <span>{text}</span>
          </label>
        ))}
      </fieldset>

      <nav className="quiz__dots" aria-label="Sorular">
        {items.map((it, i) => (
          <button
            key={it.id}
            className={`${i === index ? 'is-current' : ''} ${selected[i] !== null ? 'is-answered' : ''}`}
            aria-label={`Soru ${i + 1}${selected[i] !== null ? ', yanıtlandı' : ', yanıtlanmadı'}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <div className="module__nav">
        <button className="btn btn--ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ArrowLeft size={16} aria-hidden="true" /> Önceki
        </button>
        {index < items.length - 1 ? (
          <button className="btn btn--primary" onClick={() => setIndex(index + 1)}>
            Sonraki <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button className="btn btn--primary" disabled={!allAnswered || submitting} onClick={submit}>
            <Send size={16} aria-hidden="true" /> Sınavı bitir
          </button>
        )}
      </div>
      {error && <p className="form__error" role="alert">{error} Yanıtlarınız duruyor; “Sınavı bitir”e tekrar basabilirsiniz.</p>}
      {!allAnswered && index === items.length - 1 && (
        <p className="muted" role="status">Sınavı bitirmek için tüm soruları yanıtlayın ({answered} / {items.length}).</p>
      )}
    </div>
  );
}
