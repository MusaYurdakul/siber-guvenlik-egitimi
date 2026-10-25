import type { CompletionRecord, ProgressState, QuizAttemptRecord, QuizQuestion, ReviewItem } from '../types';
import { api } from './auth';

// Sınav ve kayıtlar sunucudadır: sorular sunucuda seçilir, cevaplar sunucuda puanlanır ve
// deneme/tamamlanma kayıtlarını yalnızca sunucu yazar. Tarayıcı doğru cevapları sınav bitmeden görmez.
export interface ReportUser {
  username: string;
  name: string;
  department: string;
  role: 'admin' | 'user';
  mustChange: boolean;
  createdAt: string;
  completedSections: number;
  activeSeconds: number;
}

export interface RecordStore {
  attempts: QuizAttemptRecord[];
  completions: CompletionRecord[];
  users: ReportUser[];
  questions: { id: string; sectionId: number; text: string }[];
  /** Sunucunun ağdaki adresleri; çalışanlara verilecek giriş adresi. */
  addresses: string[];
}

export interface CreatedAccount {
  name: string;
  department: string;
  username: string;
  password: string;
}

export interface QuizResult {
  attempt: QuizAttemptRecord;
  completion: CompletionRecord | null;
  review: ReviewItem[];
}

/** İlerleme de gönderilir: sunucu, sınavı açmadan önce kendi kaydını bununla günceller. */
export const startQuiz = (progress: ProgressState) =>
  api<{ startedAt: string; questions: QuizQuestion[] }>('/api/quiz/start', 'POST', { progress });

/**
 * @param answers her soru için seçilen seçeneğin ekrandaki sırası
 * @param startedAt sınavın kimliği; aynı sınav iki kez gönderilirse sunucu ilk sonucu döndürür
 */
export const submitQuiz = (answers: number[], startedAt: string) => api<QuizResult>('/api/quiz/submit', 'POST', { answers, startedAt });

export const fetchReport = () => api<RecordStore>('/api/report');
