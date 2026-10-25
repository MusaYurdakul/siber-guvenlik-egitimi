import { useEffect, useMemo, useRef, useState } from 'react';
import type { TrainingSection } from '../types';
import { narrationSegments } from '../data/sections';

// Anlatım oynatıcı soyutlaması. Arayüz yalnızca `NarrationPlayer` sözleşmesini bilir:
//  - AudioFilePlayer: TTS betiğinin ürettiği bölüm MP3'ünü çalar (hangi sağlayıcıyla üretildiğinden bağımsız).
//  - SpeechPlayer: MP3 yoksa veya yüklenemezse tarayıcının yerleşik Türkçe sesiyle okur (yedek).
export interface NarrationState {
  mode: 'audio' | 'speech';
  playing: boolean;
  time: number;
  duration: number;
  ended: boolean;
}

export interface NarrationPlayer {
  play(): void;
  pause(): void;
  seek(time: number): void;
  setRate(rate: number): void;
  setVolume(volume: number): void;
  destroy(): void;
}

/** Hız ve ses tercihi bölümler arasında korunur. */
export const narrationPrefs = { rate: 1, volume: 1 };

type Emit = (patch: Partial<NarrationState>) => void;

class AudioFilePlayer implements NarrationPlayer {
  private audio = new Audio();
  private dead = false;

  constructor(src: string, start: number, rawEmit: Emit, onError: () => void) {
    const a = this.audio;
    // Kapatılan oynatıcının geç gelen olayları (ör. kaynak boşaltılırken) duruma yansımamalı.
    const emit: Emit = (patch) => { if (!this.dead) rawEmit(patch); };
    a.preload = 'metadata';
    a.src = src;
    a.addEventListener('loadedmetadata', () => {
      if (start > 0 && start < a.duration - 1) a.currentTime = start;
      if (Number.isFinite(a.duration)) emit({ duration: a.duration });
    });
    a.addEventListener('timeupdate', () => emit({ time: a.currentTime }));
    a.addEventListener('play', () => emit({ playing: true, ended: false }));
    a.addEventListener('pause', () => emit({ playing: false }));
    a.addEventListener('ended', () => emit({ playing: false, ended: true }));
    a.addEventListener('error', () => { if (!this.dead) onError(); });
  }
  play() { void this.audio.play().catch(() => undefined); }
  pause() { this.audio.pause(); }
  seek(time: number) { this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || time)); }
  setRate(rate: number) { this.audio.playbackRate = rate; }
  setVolume(volume: number) { this.audio.volume = volume; }
  destroy() { this.dead = true; this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); }
}

class SpeechPlayer implements NarrationPlayer {
  private index = 0;
  private rate = 1;
  private volume = 1;
  private timer = 0;
  private segmentStartedAt = 0;
  private playing = false;

  constructor(private segments: string[], private cues: number[], private duration: number, private emit: Emit) {}

  private speak() {
    speechSynthesis.cancel();
    if (this.index >= this.segments.length) {
      this.stopTimer();
      this.playing = false;
      this.emit({ playing: false, ended: true, time: this.duration });
      return;
    }
    const u = new SpeechSynthesisUtterance(this.segments[this.index]);
    u.lang = 'tr-TR';
    u.voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('tr')) ?? null;
    u.rate = 0.95 * this.rate;
    u.volume = this.volume;
    const current = this.index;
    u.onend = () => {
      if (this.playing && this.index === current) { this.index++; this.speak(); }
    };
    this.segmentStartedAt = performance.now();
    speechSynthesis.speak(u);
  }
  private stopTimer() { window.clearInterval(this.timer); }
  play() {
    if (this.index >= this.segments.length) this.index = 0;
    this.playing = true;
    this.emit({ playing: true, ended: false });
    this.speak();
    this.stopTimer();
    this.timer = window.setInterval(() => {
      const start = this.cues[this.index] ?? this.duration;
      const end = this.cues[this.index + 1] ?? this.duration;
      const elapsed = ((performance.now() - this.segmentStartedAt) / 1000) * this.rate;
      this.emit({ time: Math.min(start + elapsed, end) });
    }, 500);
  }
  pause() {
    this.playing = false;
    this.stopTimer();
    speechSynthesis.cancel();
    this.emit({ playing: false });
  }
  seek(time: number) {
    const next = this.cues.findIndex((c) => c > time);
    this.index = Math.max(0, (next === -1 ? this.cues.length : next) - 1);
    this.emit({ time: this.cues[this.index], ended: false });
    if (this.playing) this.speak();
  }
  setRate(rate: number) { this.rate = rate; if (this.playing) this.speak(); }
  setVolume(volume: number) { this.volume = volume; }
  destroy() { this.pause(); }
}

/** Bölüm anlatımını yönetir; hangi anlatım parçasının (başlık, paragraf, ekran mesajı) okunduğunu da bildirir. */
export function useNarration(section: TrainingSection, startAt: number) {
  const [state, setState] = useState<NarrationState>({
    mode: 'audio', playing: false, time: startAt, duration: section.estimatedDuration, ended: false,
  });
  const playerRef = useRef<NarrationPlayer | null>(null);
  const settings = { current: narrationPrefs };

  useEffect(() => {
    const emit: Emit = (patch) => setState((s) => ({ ...s, ...patch }));
    setState({ mode: 'audio', playing: false, time: startAt, duration: section.estimatedDuration, ended: false });
    const apply = (p: NarrationPlayer) => {
      p.setRate(settings.current.rate);
      p.setVolume(settings.current.volume);
      playerRef.current = p;
    };
    const fallback = () => {
      playerRef.current?.destroy();
      if (!('speechSynthesis' in window)) return;
      emit({ mode: 'speech', playing: false, duration: section.estimatedDuration });
      apply(new SpeechPlayer(narrationSegments(section), section.cues, section.estimatedDuration, emit));
    };
    apply(new AudioFilePlayer(section.audio, startAt, emit, fallback));
    return () => playerRef.current?.destroy();
    // Yalnızca bölüm değiştiğinde yeniden kurulur; startAt başlangıç konumudur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  const controls = useMemo(
    () => ({
      toggle: (playing: boolean) => (playing ? playerRef.current?.pause() : playerRef.current?.play()),
      pause: () => playerRef.current?.pause(),
      seek: (t: number) => playerRef.current?.seek(t),
      setRate: (r: number) => { settings.current.rate = r; playerRef.current?.setRate(r); },
      setVolume: (v: number) => { settings.current.volume = v; playerRef.current?.setVolume(v); },
    }),
    [],
  );

  let segmentIndex = 0;
  for (let i = 0; i < section.cues.length; i++) if (state.time >= section.cues[i] - 0.05) segmentIndex = i;
  return { state, controls, segmentIndex };
}
