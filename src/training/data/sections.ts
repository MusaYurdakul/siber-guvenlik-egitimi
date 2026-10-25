import type { SectionSource, TrainingSection } from '../types';
import source from './source.json';
import slugs from './slugs.json';
import manifest from './audio-manifest.json';
import { sectionMeta } from './sectionMeta';
import { visuals } from './visuals';
import { scenes } from './scenes';
import { interactions } from './interactions';

export const TRAINING = {
  id: 'cyber-security-awareness',
  version: '1.0.0',
  title: 'Bilgi Güvenliği ve Siber Güvenlik Farkındalık Eğitimi',
  sourceDocument: source.documentTitle,
  passRate: 0.8,
  questionCount: 15,
  /** Soru başına öngörülen süre (sn); sınav süresi tahmini için. */
  secondsPerQuestion: 40,
  /** Mini etkileşim başına öngörülen süre (sn). */
  secondsPerInteraction: 45,
} as const;

/** Ses üretilmediğinde kullanılan tahmini okuma hızı (karakter/sn). */
const CHARS_PER_SECOND = 14;

type ManifestEntry = { file: string; duration: number; cues: number[] };
const audioManifest = manifest as { sections: Record<string, ManifestEntry>; provider?: string; voice?: string };

/** Anlatım parçaları: başlık, belgedeki paragraflar, ekran mesajı. */
export function narrationSegments(s: SectionSource): string[] {
  return [`Bölüm ${s.id}. ${s.title}.`, ...s.paragraphs, s.keyMessage];
}

function build(s: SectionSource): TrainingSection {
  const slug = (slugs as Record<string, string>)[String(s.id)];
  const measured = audioManifest.sections[String(s.id)];
  const segments = narrationSegments(s);
  let cues: number[];
  let duration: number;
  if (measured) {
    cues = measured.cues;
    duration = measured.duration;
  } else {
    let t = 0;
    cues = segments.map((seg) => {
      const start = t;
      t += seg.length / CHARS_PER_SECOND;
      return start;
    });
    duration = t;
  }
  const meta = sectionMeta[s.id];
  return {
    ...s,
    slug,
    description: meta.description,
    sourceText: s.paragraphs.join('\n\n'),
    audio: `/audio/${measured?.file ?? `${String(s.id).padStart(2, '0')}-${slug}.mp3`}`,
    estimatedDuration: duration,
    durationIsMeasured: Boolean(measured),
    cues,
    visuals: visuals.filter((v) => v.sectionId === s.id),
    animations: scenes.filter((a) => a.sectionId === s.id),
    keyMessages: [s.keyMessage],
    highlights: meta.highlights,
    interactions: interactions.filter((i) => i.sectionId === s.id),
    quizTags: meta.quizTags,
  };
}

export const trainingSections: TrainingSection[] = (source.sections as SectionSource[]).map(build);

export const audioInfo = { provider: audioManifest.provider ?? null, voice: audioManifest.voice ?? null };

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Eğitimin süre dökümü (saniye). Anlatım süresi, ses üretildiyse gerçek MP3 sürelerinden hesaplanır. */
export const durations = {
  narration: sum(trainingSections.map((s) => s.estimatedDuration)),
  scenes: sum(scenes.flatMap((s) => s.steps.map((st) => st.duration))),
  interactions: interactions.length * TRAINING.secondsPerInteraction,
  quiz: TRAINING.questionCount * TRAINING.secondsPerQuestion,
  allMeasured: trainingSections.every((s) => s.durationIsMeasured),
  get content() {
    return this.narration + this.scenes + this.interactions;
  },
  get total() {
    return this.content + this.quiz;
  },
};

export function sectionSceneSeconds(s: TrainingSection): number {
  return sum(s.animations.flatMap((a) => a.steps.map((st) => st.duration)));
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m < 1 ? '1 dk’dan az' : `${m} dk`;
}
