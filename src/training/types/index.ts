export type FourStep = 'dur' | 'dogrula' | 'koru' | 'bildir';

/** Görsel üretim kaydı. `src` doluysa üretilmiş dosya, değilse `render` ile tanımlı eğitim görseli gösterilir. */
export interface Visual {
  id: string;
  sectionId: number;
  /** Bölüm içinde yanında gösterileceği paragrafın sırası (0 tabanlı). */
  paragraphIndex: number;
  title: string;
  image_prompt: string;
  /** Alt metin olarak da kullanılır. */
  image_description: string;
  purpose: string;
  src?: string;
  render: VisualRender;
}

export type VisualRender =
  | { kind: 'cards'; items: { icon: string; label: string; note?: string; tone?: Tone }[] }
  | { kind: 'compare'; left: CompareSide; right: CompareSide }
  | { kind: 'email'; email: MockEmail; flags: string[] }
  | { kind: 'phone'; app: string; lines: string[]; actions: string[]; note: string }
  | { kind: 'flow'; steps: { icon: string; label: string }[]; note?: string };

export type Tone = 'safe' | 'risk' | 'info';

export interface CompareSide {
  tone: Tone;
  heading: string;
  lines: { text: string; mono?: boolean; mark?: string }[];
}

export interface MockEmail {
  fromName: string;
  fromAddress: string;
  subject: string;
  body: string[];
  linkLabel?: string;
  linkUrl?: string;
  attachment?: string;
}

export interface SceneStep {
  /** Saniye cinsinden süre. */
  duration: number;
  caption: string;
  tone: Tone;
  step?: FourStep;
}

export interface SceneDef {
  id: SceneId;
  sectionId: number;
  paragraphIndex: number;
  title: string;
  video_prompt: string;
  description: string;
  steps: SceneStep[];
}

export type SceneId = 'phishing' | 'mfa' | 'usb' | 'wrong-email' | 'clean-desk' | 'suspicious';

export interface InteractionOption {
  id: string;
  label: string;
  detail?: string;
  email?: MockEmail;
}

export interface Interaction {
  id: string;
  sectionId: number;
  paragraphIndex: number;
  title: string;
  scenario: string;
  options: InteractionOption[];
  correctId: string;
  /** Yalnızca kaynak metne dayanan kısa açıklama. */
  explanation: string;
}

export interface SectionSource {
  id: number;
  title: string;
  paragraphs: string[];
  keyMessage: string;
}

export interface TrainingSection extends SectionSource {
  slug: string;
  description: string;
  /** Kaynak metnin tamamı (paragraflar birleştirilmiş, özetlenmemiş). */
  sourceText: string;
  audio: string;
  /** Saniye; ses üretildiyse gerçek süre, değilse tahmin. */
  estimatedDuration: number;
  durationIsMeasured: boolean;
  /** Anlatımdaki her parçanın (başlık, paragraflar, ekran mesajı) başlangıç saniyesi. */
  cues: number[];
  visuals: Visual[];
  animations: SceneDef[];
  keyMessages: string[];
  highlights: string[];
  interactions: Interaction[];
  quizTags: string[];
}

export type QuestionType = 'multiple' | 'truefalse' | 'scenario';

/** Sunucunun sınav sırasında gönderdiği soru: doğru cevap ve açıklama içermez. */
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
}

/** Sınav bittikten sonra sunucunun döndürdüğü soru incelemesi. */
export interface ReviewItem {
  questionId: string;
  sectionId: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex: number | null;
}

export interface QuizAnswerRecord {
  questionId: string;
  sectionId: number;
  tag: string;
  selectedIndex: number | null;
  correct: boolean;
}

export interface QuizAttemptRecord {
  id: string;
  userId: string;
  userName: string;
  department: string;
  trainingId: string;
  trainingVersion: string;
  attempt: number;
  startedAt: string;
  submittedAt: string;
  quizDurationSec: number;
  trainingDurationSec: number;
  total: number;
  correctCount: number;
  score: number;
  passed: boolean;
  answers: QuizAnswerRecord[];
}

export interface CompletionRecord {
  userId: string;
  userName: string;
  department: string;
  trainingId: string;
  trainingVersion: string;
  completedAt: string;
  trainingDurationSec: number;
  score: number;
  passed: true;
  attempt: number;
  interactionScore: { correct: number; total: number };
}

export interface UserProfile {
  userId: string;
  userName: string;
  department: string;
}

export interface ProgressState {
  user: UserProfile | null;
  startedAt: string | null;
  currentSection: number;
  completedSections: number[];
  /** Bölüm başına dinlenen/okunan süre ve kalınan konum. */
  sections: Record<number, { position: number; listened: number; active: number }>;
  interactions: Record<string, { selectedId: string; correct: boolean }>;
  scenesWatched: string[];
  activeSeconds: number;
  /** Son sınav sonucu ve incelemesi; sunucudan gelir, yalnızca gösterim içindir (asıl kayıt sunucudadır). */
  lastAttempt: QuizAttemptRecord | null;
  lastReview: ReviewItem[] | null;
  attempts: number;
  completion: CompletionRecord | null;
}
