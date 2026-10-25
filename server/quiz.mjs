// Final sınavı: soru seçimi ve puanlama yalnızca sunucuda yapılır.
// Doğru cevaplar ve açıklamalar (server/quiz/questions.json) tarayıcıya sınav bitmeden gönderilmez.
import { readFileSync } from 'node:fs';

const pool = JSON.parse(readFileSync(new URL('./quiz/questions.json', import.meta.url), 'utf8'));
const byId = new Map(pool.map((q) => [q.id, q]));
const sectionIds = [...new Set(pool.map((q) => q.sectionId))].sort((a, b) => a - b);

export const PASS_RATE = 0.8;
export const SECTION_COUNT = sectionIds.length;

/** Yönetici raporu için soru metinleri (cevapsız). */
export const questionIndex = pool.map(({ id, sectionId, text }) => ({ id, sectionId, text }));

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Her bölümden bir soru seçer; önceki denemede sorulmamış sorular önceliklidir.
 * `order`, seçeneklerin katılımcıya gösterildiği sıradır (özgün indeksler).
 */
export function createQuiz(previousIds) {
  const picked = sectionIds.map((id) => {
    const candidates = shuffle(pool.filter((q) => q.sectionId === id));
    return candidates.find((q) => !previousIds.includes(q.id)) ?? candidates[0];
  });
  return shuffle(picked).map((q) => {
    const indexes = q.options.map((_, i) => i);
    return { questionId: q.id, order: q.type === 'truefalse' ? indexes : shuffle(indexes) };
  });
}

/** Katılımcıya gönderilen hâli: doğru cevap ve açıklama içermez. */
export function publicQuiz(items) {
  return items.map(({ questionId, order }) => {
    const q = byId.get(questionId);
    return { id: q.id, type: q.type, text: q.text, options: order.map((i) => q.options[i]) };
  });
}

/** @param selected katılımcının her soru için seçtiği, gösterim sırasındaki seçenek numarası */
export function gradeQuiz(items, selected) {
  const answers = [];
  const review = [];
  items.forEach(({ questionId, order }, i) => {
    const q = byId.get(questionId);
    const selectedIndex = order[selected[i]] ?? null;
    answers.push({ questionId, sectionId: q.sectionId, tag: q.tag, selectedIndex, correct: selectedIndex === q.correctIndex });
    review.push({ questionId, sectionId: q.sectionId, text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, selectedIndex });
  });
  const correctCount = answers.filter((a) => a.correct).length;
  return {
    answers,
    review,
    correctCount,
    total: items.length,
    score: Math.round((correctCount / items.length) * 100),
    passed: correctCount >= Math.ceil(items.length * PASS_RATE),
  };
}
