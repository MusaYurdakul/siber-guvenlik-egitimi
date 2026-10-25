import { useSyncExternalStore } from 'react';
import type { ProgressState, UserProfile } from '../types';
import { trainingSections } from '../data/sections';

// Katılımcının ilerlemesi hem tarayıcıda (kullanıcıya özel anahtarla) hem sunucuda saklanır;
// böylece eğitime başka bir bilgisayardan da kaldığı yerden devam edebilir.
const KEY = 'sgf-progress-v2';
const SYNC_DELAY_MS = 10_000;
const RETRY_DELAY_MS = 5_000;

const initial: ProgressState = {
  user: null,
  startedAt: null,
  currentSection: 1,
  completedSections: [],
  sections: {},
  interactions: {},
  scenesWatched: [],
  activeSeconds: 0,
  lastAttempt: null,
  lastReview: null,
  attempts: 0,
  completion: null,
};

let storageKey: string | null = null;
let state: ProgressState = initial;
let syncTimer = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function loadLocal(): ProgressState | null {
  try {
    const raw = storageKey && localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as ProgressState) : null;
  } catch {
    return null;
  }
}

/** İki kayıttan daha ileride olanı seçer (tamamlanma > biten bölüm sayısı > deneme > etkin süre). */
function furthest(a: ProgressState | null, b: ProgressState | null): ProgressState | null {
  if (!a || !b) return a ?? b;
  const rank = (s: ProgressState) => [s.completion ? 1 : 0, s.completedSections?.length ?? 0, s.attempts ?? 0, s.activeSeconds ?? 0];
  const [ra, rb] = [rank(a), rank(b)];
  for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] > rb[i] ? a : b;
  return a;
}

/** Oturum düşmüş ya da bu tarayıcıda başka hesaba geçilmişse çağrılır (auth servisi bağlar). */
let onSessionChanged: () => void = () => undefined;
export function setSessionChangedHandler(handler: () => void) {
  onSessionChanged = handler;
}

/** İlerlemenin sunucuya yazılma durumu; 'failed' iken kullanıcıya uyarı gösterilir ve yeniden denenir. */
export type SyncStatus = 'saved' | 'failed';
let syncStatus: SyncStatus = 'saved';
/** Son başarısız kaydın sebebi (ör. "HTTP 400: …" ya da "bağlantı yok"); uyarıda gösterilir, destek için. */
let syncError = '';
export const getSyncError = () => syncError;
function setSyncStatus(next: SyncStatus) {
  if (syncStatus === next) return;
  syncStatus = next;
  notify();
}

/**
 * @param leaving sekme kapanırken/arka plana alınırken true: istek sayfa kapansa da tamamlansın diye
 *   "keepalive" ile gönderilir. Tarayıcılar keepalive isteklerine toplam boyut sınırı (64 KB) koyduğundan
 *   normal kayıtlarda kullanılmaz.
 * @returns ilerlemenin sunucuya yazılıp yazılmadığı
 */
async function pushToServer(leaving = false): Promise<boolean> {
  window.clearTimeout(syncTimer);
  syncTimer = 0;
  if (!storageKey) return false;
  let res: Response | null = null;
  try {
    res = await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
      keepalive: leaving,
    });
  } catch (err) {
    syncError = `bağlantı kurulamadı (${(err as Error).message})`;
  }
  if (res?.ok) {
    syncError = '';
    setSyncStatus('saved');
    return true;
  }
  if (res && (res.status === 401 || res.status === 409)) {
    onSessionChanged();
    return false;
  }
  // Bağlantı ya da sunucu hatası: ilerleme tarayıcıda durur, sunucuya ulaşana kadar yeniden denenir.
  if (res) syncError = `HTTP ${res.status}: ${(await res.json().catch(() => null))?.error ?? res.statusText}`;
  setSyncStatus('failed');
  if (storageKey && !syncTimer) syncTimer = window.setTimeout(() => void pushToServer(), RETRY_DELAY_MS);
  return false;
}

// Sekme kapanırken veya arka plana alınırken bekleyen ilerlemeyi gönder.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && syncTimer) void pushToServer(true);
});

export const progress = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Oturum açan kullanıcının ilerlemesini yükler. */
  attach(user: UserProfile, serverState: ProgressState | null) {
    storageKey = `${KEY}:${user.userId}`;
    const local = loadLocal();
    const saved = furthest(serverState, local);
    // Tamamlanan bölümler iki kaynağın birleşimidir: hiçbir tamamlanma kaybolmaz.
    const serverDone = serverState?.completedSections ?? [];
    const completedSections = [...new Set([...serverDone, ...(local?.completedSections ?? [])])].sort((a, b) => a - b);
    state = { ...initial, ...saved, completedSections, user, startedAt: saved?.startedAt ?? new Date().toISOString() };
    syncStatus = 'saved';
    notify();
    // Bu tarayıcıda, sunucuya ulaşmamış ilerleme varsa hemen gönder.
    if (completedSections.length > serverDone.length) void pushToServer();
  },
  /** Bekleyen ilerlemeyi sunucuya yazar; sınav başlamadan önce sunucunun güncel olması için. */
  flush: () => pushToServer(),
  /** @param sync oturum hâlâ bu kullanıcıya aitse bekleyen ilerlemeyi gönderir */
  detach(sync = true) {
    if (sync && syncTimer) void pushToServer();
    window.clearTimeout(syncTimer);
    syncTimer = 0;
    storageKey = null;
    state = initial;
    syncStatus = 'saved';
    notify();
  },
  update(recipe: (draft: ProgressState) => void) {
    if (!storageKey) return;
    const before = state;
    const next = structuredClone(state);
    recipe(next);
    state = next;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Depolama kapalıysa ilerleme yalnızca sunucuda tutulur.
    }
    // Bölüm bitişi ve sınav sonucu hemen, diğer değişiklikler toplu olarak gönderilir.
    const milestone =
      before.completedSections.length !== next.completedSections.length || before.attempts !== next.attempts || before.completion !== next.completion;
    if (milestone) void pushToServer();
    else if (!syncTimer) syncTimer = window.setTimeout(pushToServer, SYNC_DELAY_MS);
    notify();
  },
};

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(progress.subscribe, () => syncStatus);
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(progress.subscribe, progress.get);
}

export function sectionStats(p: ProgressState, id: number) {
  return p.sections[id] ?? { position: 0, listened: 0, active: 0 };
}

/** Geliştirme ortamında `?skip` ile süre koşulu atlanabilir (yalnızca test için; üretim derlemesinde yoktur). */
const devSkip = import.meta.env.DEV && new URLSearchParams(location.search).has('skip');

/** Bölümün tamamlanabilmesi için anlatımın dinlenmiş ya da metnin okunmuş ve etkileşimlerin yanıtlanmış olması gerekir. */
export function sectionRequirements(p: ProgressState, id: number) {
  const section = trainingSections[id - 1];
  const stats = sectionStats(p, id);
  const duration = section.estimatedDuration;
  const engaged = devSkip || stats.listened >= duration * 0.85 || stats.active >= duration * 0.5;
  const pendingInteractions = section.interactions.filter((i) => !p.interactions[i.id]);
  const engagement = Math.min(1, Math.max(stats.listened / (duration * 0.85), stats.active / (duration * 0.5)));
  return { engaged, engagement: devSkip ? 1 : engagement, pendingInteractions, ready: engaged && pendingInteractions.length === 0 };
}

export function overallPercent(p: ProgressState): number {
  return Math.round((p.completedSections.length / trainingSections.length) * 100);
}

export function firstIncomplete(p: ProgressState): number | null {
  return trainingSections.find((s) => !p.completedSections.includes(s.id))?.id ?? null;
}

export function interactionScore(p: ProgressState) {
  const answers = Object.values(p.interactions);
  return { correct: answers.filter((a) => a.correct).length, total: answers.length };
}
