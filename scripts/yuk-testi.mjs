// Eşzamanlı kullanım (yük) testi: geçici veri klasörüyle ayrı bir sunucu başlatır, gerçek akışı sıkıştırılmış
// sürede çok sayıda sanal kullanıcıyla çalıştırır, sonunda sunucuyu kapatıp geçici verileri siler.
// Her sanal kullanıcı: sayfayı ve dosyaları yükler, giriş yapar, şifresini belirler, 15 bölümü "izler"
// (ses indirir, saniyede bir ilerleme kaydeder — gerçek kullanımın 10 katı sıklık), sınavı çözer.
// Kullanım: npm run yuk-testi            (100 kişi)
//           KISI=200 npm run yuk-testi   (farklı kişi sayısı)
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8780 + Math.floor(Math.random() * 5);
const B = `http://127.0.0.1:${PORT}`;
const N = Number(process.env.KISI ?? 100);
const pool = JSON.parse(readFileSync(join(root, 'server/quiz/questions.json'), 'utf8'));
const dataDir = mkdtempSync(join(tmpdir(), 'egitim-yuk-'));
const server = spawn(process.execPath, ['server/index.mjs'], {
  cwd: root,
  env: { ...process.env, UV_THREADPOOL_SIZE: '8', TRAINING_PORT: String(PORT), TRAINING_HOST: '127.0.0.1', TRAINING_DATA_DIR: dataDir },
  stdio: 'ignore',
});
for (let i = 0; i < 50; i++) {
  try { await fetch(`${B}/api/me`); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
}
const ALL = Array.from({ length: 15 }, (_, i) => i + 1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stats = {};
const errors = [];
async function call(name, path, { method = 'GET', body, cookie, headers = {}, raw = false } = {}) {
  const t = performance.now();
  try {
    const res = await fetch(B + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = raw ? Buffer.from(await res.arrayBuffer()) : await res.json().catch(() => null);
    (stats[name] ??= []).push(performance.now() - t);
    if (res.status >= 400) errors.push(`${name} ${res.status} ${data?.error ?? ''}`);
    return { status: res.status, data, cookie: res.headers.get('set-cookie')?.split(';')[0] ?? cookie, headers: res.headers };
  } catch (err) {
    (stats[name] ??= []).push(performance.now() - t);
    errors.push(`${name} AĞ HATASI ${err.cause?.code ?? err.message}`);
    return { status: 0, data: null };
  }
}

// Hazırlık: yönetici + 100 hesap (yönetici panelindeki "Toplu hesap aç" ile aynı uç).
const admin = await call('kurulum', '/api/setup', { method: 'POST', body: { username: 'yonetici-test', name: 'Test Yonetici', password: 'Deneme-Yonetici-7431' } });
const bulk = await call('toplu-hesap', '/api/users/bulk', { method: 'POST', cookie: admin.cookie, body: { users: Array.from({ length: N }, (_, i) => ({ name: `Deneme Calisan${i}`, department: `Birim ${i % 5}` })) } });
const accounts = bulk.data.created;
const index = await (await fetch(B + '/')).text();
const assets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
console.log(`${accounts.length} hesap açıldı; sayfa dosyaları: ${assets.join(', ')}`);

async function participant(acc, i) {
  await call('sayfa', '/', { raw: true });
  await Promise.all(assets.map((a) => call('js/css', a, { raw: true })));
  await call('oturum-kontrol', '/api/me');
  let { cookie } = await call('giriş', '/api/login', { method: 'POST', body: { username: acc.username, password: acc.password } });
  ({ cookie } = await call('şifre-belirleme', '/api/password', { method: 'POST', cookie, body: { current: acc.password, next: `Yeni-${acc.password}` } }));
  await call('ilerleme-oku', '/api/progress', { cookie });
  const state = { user: { userId: acc.username }, completedSections: [], activeSeconds: 0, sections: {}, interactions: {} };
  for (const id of ALL) {
    // İlk bölümde ses dosyasının tamamı, diğerlerinde tarayıcının yaptığı gibi parça parça (Range) istenir.
    const audio = '/audio/01-bilgi-guvenligi.mp3';
    if (id === 1) await call('ses (tam dosya)', audio, { raw: true });
    else await call('ses (parça)', audio, { raw: true, headers: { Range: `bytes=${id * 50000}-${id * 50000 + 262143}` } });
    for (let tick = 0; tick < 2; tick++) {
      await sleep(800 + Math.random() * 600);
      state.activeSeconds += 1;
      state.sections[id] = { position: tick, listened: tick, active: tick };
      await call('ilerleme-kaydet', '/api/progress', { method: 'PUT', cookie, body: state });
    }
    state.completedSections.push(id);
    await call('ilerleme-kaydet', '/api/progress', { method: 'PUT', cookie, body: state });
  }
  const start = await call('sınav-başlat', '/api/quiz/start', { method: 'POST', cookie, body: { progress: state } });
  if (start.status !== 200) return { ok: false };
  await sleep(1000 + Math.random() * 2000);
  const answers = start.data.questions.map((q, n) => {
    const p = pool.find((x) => x.id === q.id);
    const right = q.options.indexOf(p.options[p.correctIndex]);
    return i % 3 === 0 && n < 5 ? (right + 1) % q.options.length : right; // her 3 kişiden biri kalır
  });
  const submit = await call('sınav-gönder', '/api/quiz/submit', { method: 'POST', cookie, body: { answers, startedAt: start.data.startedAt } });
  return { ok: submit.status === 201 && submit.data.attempt.passed === (i % 3 !== 0) };
}

const t0 = performance.now();
// Yönetici de test boyunca raporu yeniler.
let running = true;
const adminLoop = (async () => { while (running) { await call('yönetici-raporu', '/api/report', { cookie: admin.cookie }); await sleep(3000); } })();
const results = await Promise.all(accounts.map((acc, i) => participant(acc, i)));
running = false;
await adminLoop;
const seconds = (performance.now() - t0) / 1000;

const pct = (xs, q) => xs.sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * q))];
const total = Object.values(stats).reduce((n, xs) => n + xs.length, 0);
console.log(`\n${N} kişi aynı anda · ${seconds.toFixed(0)} sn · ${total} istek (${(total / seconds).toFixed(0)} istek/sn) · hata: ${errors.length}`);
console.log('İşlem'.padEnd(20), 'adet'.padStart(6), 'ortanca'.padStart(9), '%95'.padStart(8), 'en kötü'.padStart(9));
for (const [name, xs] of Object.entries(stats)) {
  console.log(name.padEnd(20), String(xs.length).padStart(6), `${pct(xs, 0.5).toFixed(0)} ms`.padStart(9), `${pct(xs, 0.95).toFixed(0)} ms`.padStart(8), `${Math.max(...xs).toFixed(0)} ms`.padStart(9));
}
const report = await call('son-rapor', '/api/report', { cookie: admin.cookie });
const expectedPass = accounts.filter((_, i) => i % 3 !== 0).length;
console.log(`\nDoğru sonuçlanan kullanıcı: ${results.filter((r) => r.ok).length} / ${N}`);
console.log(`Rapor: ${report.data.attempts.length} sınav kaydı (beklenen ${N}), ${report.data.completions.length} tamamlayan (beklenen ${expectedPass}), ` +
  `15 bölümü kayıtlı kullanıcı: ${report.data.users.filter((u) => u.role === 'user' && u.completedSections === 15).length} / ${N}`);
if (errors.length) console.log('Hatalar:', [...new Set(errors)].slice(0, 10));

server.kill();
await new Promise((r) => setTimeout(r, 300));
rmSync(dataDir, { recursive: true, force: true });
process.exit(errors.length ? 1 : 0);
