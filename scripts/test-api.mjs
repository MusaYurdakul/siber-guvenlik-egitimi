// Uçtan uca sunucu testi: geçici bir veri klasörüyle ayrı bir sunucu başlatır, tüm kritik akışları dener,
// sonunda sunucuyu kapatıp geçici verileri siler. Gerçek verilere dokunmaz.
// Kullanım: npm test
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8790 + Math.floor(Math.random() * 5);
const B = `http://127.0.0.1:${PORT}`;
const dataDir = mkdtempSync(join(tmpdir(), 'egitim-test-'));
const pool = JSON.parse(readFileSync(join(root, 'server/quiz/questions.json'), 'utf8'));
const server = spawn(process.execPath, ['server/index.mjs'], {
  cwd: root,
  env: { ...process.env, TRAINING_PORT: String(PORT), TRAINING_HOST: '127.0.0.1', TRAINING_DATA_DIR: dataDir },
  stdio: 'ignore',
});

let failed = 0;
const check = (ok, label) => {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed++;
};
async function call(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  const res = await fetch(B + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* JSON değil */ }
  return { status: res.status, data, text, headers: res.headers, cookie: res.headers.get('set-cookie')?.split(';')[0] ?? cookie };
}
const ALL = Array.from({ length: 15 }, (_, i) => i + 1);
const progressOf = (username, done) => ({ user: { userId: username }, completedSections: done, activeSeconds: 600, sections: {}, interactions: { a: { correct: true } } });
const answersFor = (questions, wrong) =>
  questions.map((q, n) => {
    const p = pool.find((x) => x.id === q.id);
    const right = q.options.indexOf(p.options[p.correctIndex]);
    return n < wrong ? (right + 1) % q.options.length : right;
  });

try {
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${B}/api/me`); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }

  console.log('\n— Kurulum ve hesaplar');
  check((await call('/api/me')).data?.setupRequired === true, 'İlk açılışta kurulum isteniyor');
  check((await call('/api/setup', { method: 'POST', body: { username: 'yonetici', name: 'Test Yönetici', password: 'kisa' } })).status === 400, 'Kısa şifreyle yönetici oluşturulamıyor');
  const admin = await call('/api/setup', { method: 'POST', body: { username: 'yonetici', name: 'Test Yönetici', password: 'Yonetici-Test-1' } });
  check(admin.status === 201 && admin.cookie, 'İlk yönetici hesabı oluşturuluyor');
  check((await call('/api/setup', { method: 'POST', body: { username: 'ikinci', name: 'İkinci Kişi', password: 'Yonetici-Test-2' } })).status === 409, 'İkinci kez kurulum yapılamıyor');
  check((await call('/api/report')).status === 401, 'Rapor oturumsuz açılmıyor');

  const bulk = await call('/api/users/bulk', { method: 'POST', cookie: admin.cookie, body: { users: [{ name: 'Ayşe Nur Yılmaz', department: 'Muhasebe' }, { name: 'Ayşe Yılmaz' }, { name: 'IŞIL ÇAĞLAR' }, { name: 'Kilit Deneme' }] } });
  const created = bulk.data?.created ?? [];
  check(created.map((c) => c.username).join() === 'ayse.yilmaz,ayse.yilmaz2,isil.caglar,kilit.deneme', 'Toplu hesap: Türkçe isimlerden kullanıcı adı, aynı isimde sıra no');
  check(created.every((c) => /^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/.test(c.password)), 'Toplu hesap: okunaklı geçici şifreler');
  check((await call('/api/users', { method: 'POST', cookie: admin.cookie, body: { username: 'ayse.yilmaz', name: 'Tekrar', password: 'Gecici-Sifre-1' } })).status === 409, 'Aynı kullanıcı adı ikinci kez açılamıyor');

  console.log('\n— Giriş ve şifre');
  const [ayse, ayse2, , kilit] = created;
  check((await call('/api/login', { method: 'POST', body: { username: ayse.username, password: 'yanlis-sifre' } })).status === 401, 'Yanlış şifre reddediliyor');
  for (let i = 0; i < 5; i++) await call('/api/login', { method: 'POST', body: { username: kilit.username, password: 'yanlis-sifre' } });
  check((await call('/api/login', { method: 'POST', body: { username: kilit.username, password: kilit.password } })).status === 429, '5 hatalı denemeden sonra hesap geçici olarak kilitleniyor');
  let user = await call('/api/login', { method: 'POST', body: { username: ayse.username, password: ayse.password } });
  check(user.status === 200 && user.data.user.mustChange === true, 'Geçici şifreyle giriş: şifre değiştirme zorunlu');
  check((await call('/api/progress', { cookie: user.cookie })).status === 403, 'Şifre değiştirilmeden eğitime erişilemiyor');
  const oldCookie = user.cookie;
  user = await call('/api/password', { method: 'POST', cookie: user.cookie, body: { current: ayse.password, next: 'Kendi-Sifresi-77' } });
  check(user.status === 200 && user.data.user.mustChange === false, 'Çalışan kendi şifresini belirliyor');
  check((await call('/api/progress', { cookie: oldCookie })).status === 401, 'Şifre değişince eski oturum geçersiz');
  check((await call('/api/report', { cookie: user.cookie })).status === 403, 'Çalışan yönetici raporunu açamıyor');
  check((await call('/api/users/bulk', { method: 'POST', cookie: user.cookie, body: { users: [{ name: 'Sahte Kişi' }] } })).status === 403, 'Çalışan hesap açamıyor');

  console.log('\n— İlerleme');
  await call('/api/progress', { method: 'PUT', cookie: user.cookie, body: progressOf(ayse.username, [1, 2, 3]) });
  const shrink = await call('/api/progress', { method: 'PUT', cookie: user.cookie, body: progressOf(ayse.username, [1, 2]) });
  check(shrink.data?.completedSections?.length === 3, 'Tamamlanan bölümler geri gitmiyor (eski sekme/cihaz)');
  check((await call('/api/progress', { method: 'PUT', cookie: user.cookie, body: progressOf('baska.kisi', ALL) })).status === 409, 'Başka hesabın ilerlemesi bu hesaba yazılamıyor');
  check((await call('/api/progress', { cookie: user.cookie })).data?.state?.completedSections?.length === 3, 'İlerleme sunucudan okunuyor');

  console.log('\n— Sınav');
  const early = await call('/api/quiz/start', { method: 'POST', cookie: user.cookie, body: { progress: progressOf(ayse.username, [1, 2, 3]) } });
  check(early.status === 403 && /3 \/ 15/.test(early.data?.error ?? ''), 'Bölümler bitmeden sınav açılmıyor (kaç bölüm eksik söyleniyor)');
  const quiz1 = await call('/api/quiz/start', { method: 'POST', cookie: user.cookie, body: { progress: progressOf(ayse.username, ALL) } });
  check(quiz1.status === 200 && quiz1.data.questions.length === 15, 'İlerleme sınav isteğiyle gelince sınav açılıyor (15 soru)');
  check(!/correctIndex|explanation/.test(quiz1.text), 'Sınav sırasında doğru cevap ve açıklama gönderilmiyor');
  check(new Set(quiz1.data.questions.map((q) => pool.find((p) => p.id === q.id).sectionId)).size === 15, 'Her bölümden bir soru');
  const again = await call('/api/quiz/start', { method: 'POST', cookie: user.cookie, body: {} });
  check(JSON.stringify(again.data.questions) === JSON.stringify(quiz1.data.questions), 'Sınav yeniden açılınca aynı sorular geliyor (soru seçilemez)');
  check((await call('/api/quiz/submit', { method: 'POST', cookie: user.cookie, body: { answers: [0, 1] } })).status === 400, 'Eksik cevapla sınav gönderilemiyor');
  check((await call('/api/attempts', { method: 'POST', cookie: user.cookie, body: { score: 100, passed: true } })).status === 404, 'Tarayıcıdan doğrudan sonuç kaydı gönderilemiyor');
  const fail1 = await call('/api/quiz/submit', { method: 'POST', cookie: user.cookie, body: { answers: answersFor(quiz1.data.questions, 6), startedAt: quiz1.data.startedAt, score: 100, passed: true } });
  check(fail1.status === 201 && fail1.data.attempt.correctCount === 9 && fail1.data.attempt.passed === false, 'Puanı sunucu hesaplıyor (gönderilen sahte puan yok sayılıyor): 9/15, kaldı');
  check(fail1.data.review.length === 15 && fail1.data.review.every((r) => r.explanation), 'Sınav sonunda doğru cevaplar ve açıklamalar geliyor');
  const dup = await call('/api/quiz/submit', { method: 'POST', cookie: user.cookie, body: { answers: answersFor(quiz1.data.questions, 0), startedAt: quiz1.data.startedAt } });
  check(dup.status === 200 && dup.data.attempt.correctCount === 9, 'Aynı sınav ikinci kez gönderilirse yeniden puanlanmıyor');
  const quiz2 = await call('/api/quiz/start', { method: 'POST', cookie: user.cookie, body: {} });
  const ids1 = quiz1.data.questions.map((q) => q.id);
  check(quiz2.data.questions.filter((q) => ids1.includes(q.id)).length <= 2, 'Tekrar sınavında sorular değişiyor');
  const pass = await call('/api/quiz/submit', { method: 'POST', cookie: user.cookie, body: { answers: answersFor(quiz2.data.questions, 3), startedAt: quiz2.data.startedAt } });
  check(pass.data?.attempt.passed === true && pass.data.attempt.correctCount === 12 && pass.data.attempt.attempt === 2, '12/15 ile geçiyor (%80 sınırı), deneme numarası 2');
  check(pass.data?.completion?.userId === ayse.username && pass.data.completion.trainingDurationSec === 600, 'Tamamlanma kaydı oluşuyor (kullanıcı, süre)');
  check((await call('/api/quiz/start', { method: 'POST', cookie: user.cookie, body: {} })).status === 409, 'Tamamlayan kişi sınavı yeniden açamıyor');

  console.log('\n— Yönetici raporu ve hesap yönetimi');
  const report = await call('/api/report', { cookie: admin.cookie });
  check(report.data?.attempts.length === 2 && report.data.completions.length === 1, 'Raporda 2 deneme, 1 tamamlanma');
  check(report.data?.users.find((u) => u.username === ayse.username)?.completedSections === 15, 'Raporda bölüm ilerlemesi görünüyor');
  check(!/correctIndex|"salt"|"hash"/.test(report.text), 'Raporda şifre özeti ve doğru cevap yok');
  let other = await call('/api/login', { method: 'POST', body: { username: ayse2.username, password: ayse2.password } });
  other = await call('/api/password', { method: 'POST', cookie: other.cookie, body: { current: ayse2.password, next: 'Diger-Sifre-88' } });
  check((await call('/api/users/reset', { method: 'POST', cookie: admin.cookie, body: { username: ayse2.username, password: 'Yeni-Gecici-11' } })).status === 200, 'Yönetici şifre sıfırlayabiliyor');
  check((await call('/api/progress', { cookie: other.cookie })).status === 401, 'Şifre sıfırlanınca kişinin açık oturumu kapanıyor');
  check((await call('/api/users/delete', { method: 'POST', cookie: admin.cookie, body: { username: ayse.username } })).status === 200, 'Yönetici hesap silebiliyor');
  check((await call('/api/progress', { cookie: user.cookie })).status === 401, 'Silinen hesabın oturumu kapanıyor');
  check((await call('/api/report', { cookie: admin.cookie })).data?.completions.length === 1, 'Hesap silinse de sınav kayıtları raporda kalıyor');
  check((await call('/api/users/delete', { method: 'POST', cookie: admin.cookie, body: { username: 'yonetici' } })).status === 400, 'Yönetici kendi hesabını silemiyor');

  console.log('\n— Güvenlik');
  check((await call('/api/logout', { method: 'POST', cookie: admin.cookie, headers: { Origin: 'https://kotu-site.example' } })).status === 403, 'Başka siteden gönderilen istek reddediliyor');
  const parallel = await call('/api/users/bulk', { method: 'POST', cookie: admin.cookie, body: { users: Array.from({ length: 30 }, (_, i) => ({ name: `Eş Zamanlı${i}` })) } });
  const changed = await Promise.all(parallel.data.created.map(async (c) => {
    const s = await call('/api/login', { method: 'POST', body: { username: c.username, password: c.password } });
    return (await call('/api/password', { method: 'POST', cookie: s.cookie, body: { current: c.password, next: `Yeni-${c.password}` } })).status;
  }));
  const relogin = await Promise.all(parallel.data.created.map((c) => call('/api/login', { method: 'POST', body: { username: c.username, password: `Yeni-${c.password}` } })));
  check(changed.every((s) => s === 200) && relogin.every((r) => r.status === 200), '30 kişi aynı anda şifre belirleyince hiçbirinin değişikliği kaybolmuyor');

  console.log('\n— Site dosyaları');
  if (existsSync(join(root, 'dist/index.html'))) {
    const page = await call('/');
    check(page.status === 200 && page.headers.get('cache-control') === 'no-cache', 'Sayfa açılıyor, her açılışta güncel sürüm denetleniyor');
    const asset = page.text.match(/\/assets\/[^"]+\.js/)?.[0];
    const js = await call(asset);
    check(js.headers.get('cache-control')?.includes('immutable'), 'Site dosyaları tarayıcıda önbelleğe alınıyor');
    check((await call(asset, { headers: { 'If-None-Match': js.headers.get('etag') } })).status === 304, 'Değişmeyen dosya yeniden indirilmiyor (304)');
    const audio = await call('/audio/01-bilgi-guvenligi.mp3', { headers: { Range: 'bytes=0-999' } });
    check(audio.status === 206, 'Ses dosyalarında ileri/geri sarma (Range) çalışıyor');
    check((await call('/assets/olmayan-dosya.js')).status === 404, 'Olmayan dosya için 404');
    check(!(await call('/../server/data/users.json')).text.includes('"hash"'), 'Klasör dışına çıkılarak veri dosyası okunamıyor');
    const bundle = readFileSync(join(root, 'dist', asset), 'utf8');
    // (Açıklamalar kaynak belgeden birebir alındığı için eğitim metninde de geçer; ölçülen, soru havuzunun sitede olmaması.)
    check(pool.every((q) => !bundle.includes(q.text) && !bundle.includes(`"${q.id}"`)), 'Site kodunda sınav soru havuzu yok');
  } else {
    console.log('  (dist/ yok; site dosyası testleri için önce "npm run build")');
  }
  check(existsSync(join(dataDir, 'istek-hatalari.log')), 'Başarısız istekler günlüğe yazılıyor');
} catch (err) {
  failed++;
  console.error('Test beklenmedik şekilde durdu:', err);
} finally {
  server.kill();
  await new Promise((r) => setTimeout(r, 300));
  rmSync(dataDir, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} kontrol başarısız.` : '\nTüm kontroller geçti.');
process.exit(failed ? 1 : 0);
