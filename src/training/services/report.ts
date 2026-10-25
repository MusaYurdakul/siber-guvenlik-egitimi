import type { RecordStore } from './records';
import { trainingSections } from '../data/sections';

export type UserStatus = 'Başarılı' | 'Başarısız' | 'Devam ediyor' | 'Başlamadı';

export interface UserRow {
  userId: string;
  userName: string;
  department: string;
  /** Hesabı silinmiş ama kaydı duran katılımcılar için false. */
  hasAccount: boolean;
  isAdmin: boolean;
  status: UserStatus;
  completedSections: number;
  completedAt: string | null;
  trainingDurationSec: number;
  bestScore: number | null;
  attempts: number;
  passedOnAttempt: number | null;
  wrongQuestionIds: string[];
}

/** Denetim raporu: katılımcı satırları, bölüm bazında hata oranları ve en çok hata yapılan sorular. */
export function buildReport({ attempts, completions, users: accounts, questions: questionIndex }: RecordStore) {
  const byUser = new Map<string, UserRow>();
  for (const u of accounts.filter((a) => a.role === 'user')) {
    byUser.set(u.username, {
      userId: u.username, userName: u.name, department: u.department, hasAccount: true, isAdmin: false,
      status: u.completedSections > 0 || u.activeSeconds > 0 ? 'Devam ediyor' : 'Başlamadı',
      completedSections: u.completedSections, completedAt: null, trainingDurationSec: u.activeSeconds,
      bestScore: null, attempts: 0, passedOnAttempt: null, wrongQuestionIds: [],
    });
  }
  for (const a of [...attempts].sort((x, y) => x.submittedAt.localeCompare(y.submittedAt))) {
    const row = byUser.get(a.userId) ?? {
      userId: a.userId, userName: a.userName, department: a.department, hasAccount: accounts.some((u) => u.username === a.userId),
      isAdmin: accounts.some((u) => u.username === a.userId && u.role === 'admin'),
      status: 'Başarısız' as UserStatus, completedSections: trainingSections.length, completedAt: null,
      trainingDurationSec: 0, bestScore: null, attempts: 0, passedOnAttempt: null, wrongQuestionIds: [],
    };
    row.attempts = Math.max(row.attempts, a.attempt);
    row.bestScore = Math.max(row.bestScore ?? 0, a.score);
    row.trainingDurationSec = Math.max(row.trainingDurationSec, a.trainingDurationSec);
    row.wrongQuestionIds.push(...a.answers.filter((x) => !x.correct).map((x) => x.questionId));
    if (row.status !== 'Başarılı') row.status = 'Başarısız';
    if (a.passed && row.passedOnAttempt === null) {
      row.status = 'Başarılı';
      row.passedOnAttempt = a.attempt;
      row.completedAt = a.submittedAt;
    }
    byUser.set(a.userId, row);
  }
  for (const c of completions) {
    const row = byUser.get(c.userId);
    if (row) Object.assign(row, { status: 'Başarılı', completedAt: c.completedAt, passedOnAttempt: c.attempt, trainingDurationSec: c.trainingDurationSec });
  }
  const users = [...byUser.values()].sort((a, b) => a.userName.localeCompare(b.userName, 'tr'));

  const allAnswers = attempts.flatMap((a) => a.answers);
  const sections = trainingSections.map((s) => {
    const answers = allAnswers.filter((a) => a.sectionId === s.id);
    const wrong = answers.filter((a) => !a.correct).length;
    return { id: s.id, title: s.title, asked: answers.length, wrong, rate: answers.length ? wrong / answers.length : 0 };
  });
  const questions = questionIndex
    .map((q) => {
      const answers = allAnswers.filter((a) => a.questionId === q.id);
      const wrong = answers.filter((a) => !a.correct).length;
      return { id: q.id, sectionId: q.sectionId, text: q.text, asked: answers.length, wrong, rate: answers.length ? wrong / answers.length : 0 };
    })
    .filter((q) => q.wrong > 0)
    .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong)
    .slice(0, 8);

  const passedUsers = users.filter((u) => u.status === 'Başarılı');
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    users,
    sections,
    questions,
    totals: {
      participants: users.length,
      completed: passedUsers.length,
      attempts: attempts.length,
      averageScore: Math.round(avg(attempts.map((a) => a.score))),
      averageAttemptsToPass: Number(avg(passedUsers.map((u) => u.passedOnAttempt ?? u.attempts)).toFixed(1)),
    },
  };
}

export function toCsv(users: UserRow[]): string {
  const head = ['Kullanıcı', 'Ad Soyad', 'Birim', 'Durum', 'Biten bölüm', 'Tamamlanma tarihi', 'Eğitim süresi (dk)', 'En yüksek puan', 'Deneme sayısı', 'Kaçıncı denemede geçti', 'Hatalı sorular'];
  const rows = users.map((u) => [
    u.userId, u.userName, u.department, u.status, `${u.completedSections}/${trainingSections.length}`, u.completedAt ?? '',
    Math.round(u.trainingDurationSec / 60), u.bestScore ?? '', u.attempts, u.passedOnAttempt ?? '', [...new Set(u.wrongQuestionIds)].join(' '),
  ]);
  const cell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  // BOM: Excel'in Türkçe karakterleri doğru açması için.
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
}
