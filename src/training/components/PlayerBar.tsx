import { useState } from 'react';
import { Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { narrationPrefs, type NarrationState } from '../services/narration';
import { formatClock } from '../data/sections';

interface Props {
  title: string;
  state: NarrationState;
  /** Tüm eğitimde kalan içerik süresi (sn). */
  remainingTotal: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onRate: (rate: number) => void;
  onVolume: (volume: number) => void;
}

const RATES = [1, 1.25, 1.5];

export function PlayerBar({ title, state, remainingTotal, onToggle, onSeek, onRate, onVolume }: Props) {
  const [rate, setRate] = useState(narrationPrefs.rate);
  const [volume, setVolume] = useState(narrationPrefs.volume);
  const [muted, setMuted] = useState(false);
  const changeVolume = (v: number, mute = false) => {
    setVolume(v);
    setMuted(mute);
    onVolume(mute ? 0 : v);
  };

  return (
    <div className="player" role="region" aria-label="Sesli anlatım oynatıcısı">
      <input
        className="player__seek"
        type="range"
        min={0}
        max={Math.max(1, Math.round(state.duration))}
        value={Math.round(state.time)}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Anlatım konumu"
        aria-valuetext={`${formatClock(state.time)} / ${formatClock(state.duration)}`}
        style={{ '--pct': `${(state.time / Math.max(1, state.duration)) * 100}%` } as React.CSSProperties}
      />
      <div className="player__row">
        <div className="player__main">
          <button className="icon-btn" onClick={() => onSeek(Math.max(0, state.time - 10))} aria-label="10 saniye geri">
            <RotateCcw size={18} aria-hidden="true" />
          </button>
          <button className="icon-btn icon-btn--primary" onClick={onToggle} aria-label={state.playing ? 'Duraklat' : 'Oynat'}>
            {state.playing ? <Pause size={22} aria-hidden="true" /> : <Play size={22} aria-hidden="true" />}
          </button>
          <button className="icon-btn" onClick={() => onSeek(Math.min(state.duration, state.time + 10))} aria-label="10 saniye ileri">
            <RotateCw size={18} aria-hidden="true" />
          </button>
          <span className="player__time">{formatClock(state.time)} / {formatClock(state.duration)}</span>
        </div>
        <div className="player__title">
          <strong>{title}</strong>
          <span>
            Eğitimde kalan: {formatClock(remainingTotal)}
            {state.mode === 'speech' && ' · Tarayıcı sesi (yedek)'}
          </span>
        </div>
        <div className="player__side">
          <div className="player__rates" role="group" aria-label="Oynatma hızı">
            {RATES.map((r) => (
              <button key={r} className={r === rate ? 'is-active' : undefined} aria-pressed={r === rate} onClick={() => { setRate(r); onRate(r); }}>
                {r}x
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={() => changeVolume(volume, !muted)} aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}>
            {muted || volume === 0 ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
          </button>
          <input
            className="player__volume"
            type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label="Ses seviyesi"
          />
        </div>
      </div>
    </div>
  );
}
