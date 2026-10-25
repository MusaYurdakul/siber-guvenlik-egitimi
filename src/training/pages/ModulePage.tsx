import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleCheck, Clock, Headphones, MonitorPlay, Play, ScrollText } from 'lucide-react';
import type { TrainingSection } from '../types';
import { durations, formatClock, formatMinutes, sectionSceneSeconds, trainingSections } from '../data/sections';
import { progress, sectionRequirements, sectionStats, useProgress } from '../services/progress';
import { useNarration } from '../services/narration';
import { go, paths } from '../router';
import { VisualCard } from '../components/VisualCard';
import { ScenePlayer } from '../components/ScenePlayer';
import { InteractionCard } from '../components/InteractionCard';
import { PlayerBar } from '../components/PlayerBar';
import { FourSteps } from '../components/FourSteps';

export function ModulePage({ section }: { section: TrainingSection }) {
  const p = useProgress();
  const [startAt] = useState(() => {
    const pos = sectionStats(progress.get(), section.id).position;
    return pos < section.estimatedDuration - 3 ? pos : 0;
  });
  const { state, controls, segmentIndex } = useNarration(section, startAt);
  const [listenOnly, setListenOnly] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastTime = useRef(startAt);
  const pendingListened = useRef(0);
  const segmentRefs = useRef<(HTMLElement | null)[]>([]);

  // Dinlenen süre: yalnızca oynatma sırasında kesintisiz ilerleyen saniyeler sayılır (ileri sarma sayılmaz).
  useEffect(() => {
    const delta = state.time - lastTime.current;
    if (state.playing && delta > 0 && delta < 3) pendingListened.current += delta;
    lastTime.current = state.time;
  }, [state.time, state.playing]);

  // Saniyede bir: etkin süreyi, dinlenen süreyi ve kalınan konumu kaydet.
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      progress.update((d) => {
        const s = (d.sections[section.id] ??= { position: 0, listened: 0, active: 0 });
        s.active += 1;
        s.listened += pendingListened.current;
        s.position = lastTime.current;
        d.currentSection = section.id;
      });
      pendingListened.current = 0;
    }, 1000);
    return () => window.clearInterval(tick);
  }, [section.id]);

  useEffect(() => {
    if (!state.playing || !autoScroll) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = segmentRefs.current[segmentIndex];
    if (!el) return;
    // Üst çubuğun hemen altına hizala (scrollIntoView, gömülü görünümlerde dış çerçeveyi de kaydırabiliyor).
    const top = el.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  }, [segmentIndex, state.playing, autoScroll]);

  const req = sectionRequirements(p, section.id);
  const done = p.completedSections.includes(section.id);
  const isLast = section.id === trainingSections.length;
  const keySegment = section.paragraphs.length + 1;
  const remainingTotal =
    trainingSections.filter((s) => !p.completedSections.includes(s.id) && s.id !== section.id).reduce((n, s) => n + s.estimatedDuration, 0) +
    Math.max(0, state.duration - state.time);

  const complete = () => {
    controls.pause();
    progress.update((d) => {
      if (!d.completedSections.includes(section.id)) d.completedSections.push(section.id);
      d.currentSection = Math.min(section.id + 1, trainingSections.length);
    });
    go(isLast ? paths.summary : paths.section(section.id + 1));
  };

  return (
    <article className="module">
      <header className="module__head" ref={(el) => { segmentRefs.current[0] = el; }}>
        <p className="eyebrow">Bölüm {section.id} / {trainingSections.length}</p>
        <h1>{section.title}</h1>
        <p className="module__desc">{section.description}</p>
        <div className="module__meta">
          <span><Clock size={15} aria-hidden="true" /> Anlatım {formatClock(section.estimatedDuration)}{!section.durationIsMeasured && ' (tahmini)'}</span>
          {section.animations.length > 0 && (
            <span><MonitorPlay size={15} aria-hidden="true" /> {section.animations.length} kısa sahne · {formatClock(sectionSceneSeconds(section))}</span>
          )}
          {done && <span className="is-done"><CircleCheck size={15} aria-hidden="true" /> Tamamlandı</span>}
        </div>
        <div className="module__toggles">
          <button className="btn btn--primary" onClick={() => controls.toggle(state.playing)}>
            <Play size={16} aria-hidden="true" /> {state.playing ? 'Anlatımı duraklat' : state.time > 1 ? 'Anlatıma devam et' : 'Anlatımı başlat'}
          </button>
          <button className="btn btn--ghost" aria-pressed={listenOnly} onClick={() => setListenOnly(!listenOnly)}>
            {listenOnly ? <ScrollText size={16} aria-hidden="true" /> : <Headphones size={16} aria-hidden="true" />}
            {listenOnly ? 'Metni göster' : 'Yalnızca dinle'}
          </button>
          <label className="check">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} /> Anlatımı takip et
          </label>
        </div>
      </header>

      {section.paragraphs.map((text, i) => {
        const seg = i + 1;
        return (
          <div key={i} className="module__block">
            <div
              className={`para ${segmentIndex === seg && state.time > 0 ? 'is-active' : ''} ${listenOnly ? 'is-collapsed' : ''}`}
              ref={(el) => { segmentRefs.current[seg] = el; }}
            >
              <button className="para__play" onClick={() => { controls.seek(section.cues[seg]); if (!state.playing) controls.toggle(false); }}
                aria-label={`${i + 1}. paragrafı dinle (${formatClock(section.cues[seg])})`}>
                <Play size={13} aria-hidden="true" />
                <span>{formatClock(section.cues[seg])}</span>
              </button>
              {listenOnly ? <p className="para__hidden">Paragraf {i + 1} — metin gizli, anlatım dinleniyor.</p> : <p>{text}</p>}
            </div>
            {section.visuals.filter((v) => v.paragraphIndex === i).map((v) => <VisualCard key={v.id} visual={v} />)}
            {section.animations.filter((a) => a.paragraphIndex === i).map((a) => (
              <ScenePlayer
                key={a.id}
                scene={a}
                watched={p.scenesWatched.includes(a.id)}
                onPlay={controls.pause}
                onWatched={() => progress.update((d) => { if (!d.scenesWatched.includes(a.id)) d.scenesWatched.push(a.id); })}
              />
            ))}
            {section.interactions.filter((x) => x.paragraphIndex === i).map((x) => (
              <InteractionCard
                key={x.id}
                interaction={x}
                answer={p.interactions[x.id]}
                onAnswer={(selectedId) => {
                  controls.pause();
                  progress.update((d) => { d.interactions[x.id] = { selectedId, correct: selectedId === x.correctId }; });
                }}
              />
            ))}
          </div>
        );
      })}

      {isLast && <FourSteps size="lg" />}

      <aside
        className={`key-message ${segmentIndex === keySegment ? 'is-active' : ''}`}
        ref={(el) => { segmentRefs.current[keySegment] = el; }}
        aria-label="Ekran mesajı"
      >
        <span className="key-message__tag">Ekran mesajı</span>
        <p>{section.keyMessage}</p>
      </aside>

      <section className="highlights" aria-labelledby="highlights-title">
        <h2 id="highlights-title">Bu bölümden akılda kalanlar</h2>
        <ul>{section.highlights.map((h) => <li key={h}><CircleCheck size={17} aria-hidden="true" /> {h}</li>)}</ul>
        {!isLast && <FourSteps size="sm" />}
      </section>

      <footer className="module__footer">
        {!done && !req.ready && (
          <div className="module__gate" role="status">
            <div className="meter" aria-hidden="true"><span style={{ width: `${req.engagement * 100}%` }} /></div>
            <p>
              {!req.engaged && 'Bölümü tamamlamak için anlatımı dinleyin veya metni okuyun. '}
              {req.pendingInteractions.length > 0 && `Yanıt bekleyen etkileşim: ${req.pendingInteractions.map((x) => `“${x.title}”`).join(', ')}.`}
            </p>
          </div>
        )}
        <div className="module__nav">
          {section.id > 1 && (
            <button className="btn btn--ghost" onClick={() => go(paths.section(section.id - 1))}>
              <ArrowLeft size={16} aria-hidden="true" /> Önceki bölüm
            </button>
          )}
          <button className="btn btn--primary btn--lg" disabled={!done && !req.ready} onClick={complete}>
            {done ? (isLast ? 'Eğitim özetine geç' : 'Sonraki bölüm') : isLast ? 'Bölümü tamamla ve özete geç' : 'Bölümü tamamla ve devam et'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="module__total">Toplam içerik süresi: {formatMinutes(durations.content)} · Final sınavı: yaklaşık {formatMinutes(durations.quiz)}</p>
      </footer>

      <PlayerBar
        title={`Bölüm ${section.id}: ${section.title}`}
        state={state}
        remainingTotal={remainingTotal}
        onToggle={() => controls.toggle(state.playing)}
        onSeek={controls.seek}
        onRate={controls.setRate}
        onVolume={controls.setVolume}
      />
    </article>
  );
}
