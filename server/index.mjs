// Eğitim sunucusu: hesaplar + oturum, ilerleme, kayıt API'si ve derlenmiş uygulamanın sunumu. Bağımlılık yoktur.
//   GET  /api/me                 oturum durumu (kurulum gerekli mi, giriş yapan kim)
//   POST /api/setup              ilk yönetici hesabı (yalnızca hiç yönetici yokken ve sunucunun kendi bilgisayarından)
//   POST /api/login | /api/logout | /api/password
//   GET|PUT /api/progress        katılımcının ilerlemesi (başka bilgisayardan devam edebilmek için)
//   POST /api/quiz/start | /api/quiz/submit   sınav: sorular sunucuda seçilir ve puanlanır, kayıtları sunucu yazar
//   GET  /api/report             yönetici: kayıtlar + kullanıcılar
//   POST /api/users | /api/users/bulk | /api/users/reset | /api/users/delete   yönetici: hesap yönetimi
// Veriler server/data altında JSON dosyalarında tutulur; kurum veritabanına geçişte yalnızca loadJson/saveJson değişir.
import { createServer } from 'node:http';
import { appendFileSync, copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { networkInterfaces } from 'node:os';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTION_COUNT, createQuiz, gradeQuiz, publicQuiz, questionIndex } from './quiz.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const dataDir = process.env.TRAINING_DATA_DIR ?? join(here, 'data');
// TRAINING_PORT kullanılır; PORT değişkeni geliştirme araçlarınca Vite için atanabildiğinden okunmaz.
const PORT = Number(process.env.TRAINING_PORT ?? 8797);
// Yayında 127.0.0.1 verilir: uygulamaya yalnızca aynı makinedeki HTTPS vekili ulaşır.
const HOST = process.env.TRAINING_HOST || undefined;
// Alan adıyla yayında çalışanlara verilecek adres (ör. https://egitim.ornek.com.tr).
const PUBLIC_URL = (process.env.TRAINING_PUBLIC_URL ?? '').replace(/\/+$/, '');
const MAX_BODY = 256 * 1024;
const SESSION_DAYS = 7;
const COOKIE = 'sgf_session';

mkdirSync(dataDir, { recursive: true });

/** Dosya kısa süreliğine kilitliyse (eşitleme aracı, antivirüs) işlemi birkaç kez yeniden dener. */
function withRetry(action) {
  for (let attempt = 1; ; attempt++) {
    try {
      return action();
    } catch (err) {
      if (err.code === 'ENOENT' || attempt >= 8) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40 * attempt);
    }
  }
}
function loadJson(name, fallback) {
  const file = join(dataDir, name);
  // Yalnızca dosya hiç yoksa boş değer döner. Okunamayan veya bozuk dosyada istek hata verir;
  // aksi hâlde boş veri kaydedilip mevcut kayıtlar silinebilirdi.
  if (!existsSync(file)) return fallback;
  return JSON.parse(withRetry(() => readFileSync(file, 'utf8')));
}
function saveJson(name, value) {
  const file = join(dataDir, name);
  const text = JSON.stringify(value, null, 2);
  withRetry(() => writeFileSync(`${file}.tmp`, text, 'utf8'));
  // Bir önceki sürüm .bak olarak saklanır.
  if (existsSync(file)) withRetry(() => copyFileSync(file, `${file}.bak`));
  withRetry(() => renameSync(`${file}.tmp`, file));
}
function logError(where, err) {
  const line = `${new Date().toISOString()} ${where} ${err?.stack ?? err}\n`;
  console.error(line);
  try { appendFileSync(join(dataDir, 'error.log'), line, 'utf8'); } catch { /* günlük yazılamasa da istek sürer */ }
}

// --- Hesaplar ve oturum ---
const secretFile = join(dataDir, 'secret.key');
if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString('hex'), 'utf8');
const SECRET = readFileSync(secretFile, 'utf8');

const loadUsers = () => loadJson('users.json', []);
const publicUser = ({ username, name, department, role, mustChange, createdAt }) => ({ username, name, department, role, mustChange, createdAt });
const normalizeUsername = (v) => (typeof v === 'string' ? v.trim().toLocaleLowerCase('tr') : '');
const validUsername = (v) => /^[a-z0-9çğıöşü._@-]{2,64}$/.test(v);
const validPassword = (v) => typeof v === 'string' && v.length >= 8 && v.length <= 128;
const isText = (v, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

// Şifre özetleme işlemci yoğundur; ayrı iş parçacığında (async) yapılır ki aynı anda çok kişi giriş
// yaparken sunucu diğer istekleri bekletmesin. Özet hesaplandıktan sonra kullanıcı listesi yeniden
// okunur ve kesintisiz yazılır; böylece eşzamanlı istekler birbirinin değişikliğini ezemez.
const scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: (await scryptAsync(password, salt, 64)).toString('hex') };
}
async function passwordMatches(user, password) {
  const given = await scryptAsync(String(password), user.salt, 64);
  return timingSafeEqual(given, Buffer.from(user.hash, 'hex'));
}
function newUser({ username, name, department, role, mustChange }, passwordHash) {
  return { username, name: name.trim(), department: (department ?? '').trim(), role, mustChange, tokenVersion: 1, createdAt: new Date().toISOString(), ...passwordHash };
}

/** "Ayşe Nur Yılmaz" -> "ayse.yilmaz" */
function usernameFromName(name) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  const parts = name.trim().toLocaleLowerCase('tr').replace(/[çğıöşü]/g, (c) => map[c]).replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const base = parts.length > 1 ? `${parts[0]}.${parts.at(-1)}` : (parts[0] ?? '');
  return base.length >= 2 ? base.slice(0, 60) : 'kullanici';
}
/** Okunması kolay geçici şifre (karışan karakterler yok): "K7mq-Xw3p-Tn8d" */
function temporaryPassword() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(12);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8).join('')}`;
}

// 192.168.56.x, VirtualBox'ın varsayılan sanal ağıdır; gerçek ağ adresi öne alınır.
const lanAddresses = () =>
  Object.values(networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal)
    .sort((a, b) => a.address.startsWith('192.168.56.') - b.address.startsWith('192.168.56.'))
    .map((n) => `http://${n.address}:${PORT}`);

const sign = (payload) => createHmac('sha256', SECRET).update(payload).digest('base64url');
// Alan adı + HTTPS ile yayında, sunucu bir ters vekilin (Caddy, nginx, IIS) arkasında çalışır.
// TRAINING_BEHIND_PROXY=1 ise gerçek istemci adresi ve HTTPS bilgisi vekilin başlıklarından alınır
// (x-forwarded-for'un son değeri: vekilin kendi eklediği, istemcinin uyduramayacağı adres).
const BEHIND_PROXY = process.env.TRAINING_BEHIND_PROXY === '1';
const clientIp = (req) => (BEHIND_PROXY && req.headers['x-forwarded-for']?.split(',').at(-1).trim()) || req.socket.remoteAddress || '';
const cookieFlags = (req) => `HttpOnly; SameSite=Lax; Path=/${BEHIND_PROXY && req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`;

function sessionCookie(user, req) {
  // tokenVersion, şifre değişince artar; böylece eski oturumlar geçersiz olur.
  const payload = Buffer.from(JSON.stringify({ u: user.username, v: user.tokenVersion, exp: Date.now() + SESSION_DAYS * 864e5 })).toString('base64url');
  return `${COOKIE}=${payload}.${sign(payload)}; ${cookieFlags(req)}; Max-Age=${SESSION_DAYS * 86400}`;
}
const clearCookie = (req) => `${COOKIE}=; ${cookieFlags(req)}; Max-Age=0`;
function currentUser(req) {
  const token = req.headers.cookie?.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const [payload, signature] = token?.split('.') ?? [];
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { u, v, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (exp < Date.now()) return null;
    const user = loadUsers().find((x) => x.username === u);
    return user && user.tokenVersion === v ? user : null;
  } catch {
    return null;
  }
}

// Şifre denemesi sınırı: aynı adres + kullanıcı için 5 hatalı denemeden sonra 5 dakika bekleme.
const failures = new Map();
const LOCK_MS = 5 * 60 * 1000;
function lockedFor(key) {
  const f = failures.get(key);
  return f && f.count >= 5 && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 60000) : 0;
}
function noteFailure(key) {
  const f = failures.get(key);
  const count = f && f.until > Date.now() ? f.count + 1 : 1;
  failures.set(key, { count, until: Date.now() + LOCK_MS });
}

const isLoopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(clientIp(req));

const TRAINING = { id: 'cyber-security-awareness', version: '1.0.0' };
const identity = (user) => ({ userId: user.username, userName: user.name, department: user.department });

class BadRequest extends Error {}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new BadRequest('İstek çok büyük.')); req.destroy(); } else chunks.push(c);
    });
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      try { resolve(text ? JSON.parse(text) : {}); } catch { reject(new BadRequest('Geçersiz istek gövdesi.')); }
    });
    req.on('error', reject);
  });
}

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
};
const fail = (res, status, error) => {
  res.setHeader('x-hata', encodeURIComponent(error));
  json(res, status, { error });
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  let file = normalize(join(dist, decodeURIComponent(pathname)));
  if (file !== dist && !file.startsWith(dist + sep)) return fail(res, 403, 'forbidden');
  const isAsset = pathname.startsWith('/assets/') || pathname.startsWith('/audio/') || pathname.startsWith('/images/');
  if (!existsSync(file) || statSync(file).isDirectory()) {
    // Eksik dosya için sayfa yerine 404 döner (aksi hâlde tarayıcı HTML'i betik/ses diye yorumlar).
    if (isAsset) return fail(res, 404, 'bulunamadı');
    file = join(dist, 'index.html');
  }
  if (!existsSync(file)) return fail(res, 404, 'Önce "npm run build" çalıştırın.');
  const { size, mtimeMs } = statSync(file);
  // Önbellek: derleme dosyalarının adı içeriğe göre değiştiğinden süresiz; sesler 7 gün; sayfa her seferinde
  // doğrulanır. Tekrar gelen çalışan dosyaları yeniden indirmez; sunucu ve hat yükü azalır.
  const etag = `W/"${size.toString(36)}-${Math.floor(mtimeMs).toString(36)}"`;
  const cacheControl = pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable'
    : isAsset ? 'public, max-age=604800' : 'no-cache';
  const headers = { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': cacheControl, ETag: etag };
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }
  // Ses dosyalarında ileri/geri sarma için Range desteği.
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` });
      return res.end();
    }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'Content-Length': size });
  createReadStream(file).pipe(res);
}

// Sık yazılan veriler kişi başına ayrı küçük dosyalarda tutulur: data/progress/<kullanıcı>.json ve
// data/quiz/<kullanıcı>.json. Böylece 100 kişi aynı anda ilerleme kaydederken her yazım yalnızca
// o kişinin birkaç KB'lık dosyasını değiştirir; herkesin verisini içeren büyük dosya yeniden yazılmaz.
const userDoc = (kind, username) => `${kind}/${encodeURIComponent(username)}.json`;
const loadUserDoc = (kind, username) => loadJson(userDoc(kind, username), null);
const saveUserDoc = (kind, username, value) => saveJson(userDoc(kind, username), value);
function loadAllProgress() {
  const all = {};
  for (const name of readdirSync(join(dataDir, 'progress'))) {
    if (name.endsWith('.json')) all[decodeURIComponent(name.slice(0, -5))] = loadJson(`progress/${name}`, null);
  }
  return all;
}

// Eski sürümün tek dosyalık kayıtları kişi başına dosyalara taşınır (bir kez).
for (const [legacy, kind] of [['progress.json', 'progress'], ['quiz-sessions.json', 'quiz']]) {
  mkdirSync(join(dataDir, kind), { recursive: true });
  const file = join(dataDir, legacy);
  if (!existsSync(file)) continue;
  for (const [username, doc] of Object.entries(loadJson(legacy, {}))) {
    if (doc && !existsSync(join(dataDir, userDoc(kind, username)))) saveUserDoc(kind, username, doc);
  }
  renameSync(file, `${file}.tasindi`);
}

/** İlerlemeyi kaydeder. Tamamlanan bölümler hiçbir zaman azalmaz: eski bir sekme ya da cihaz, yeni kaydı geri alamaz. */
function saveProgress(user, state) {
  const previous = loadUserDoc('progress', user.username);
  const merged = new Set([...(previous?.completedSections ?? []), ...state.completedSections]);
  const completedSections = [...merged].filter((n) => Number.isInteger(n) && n >= 1 && n <= SECTION_COUNT).sort((a, b) => a - b);
  saveUserDoc('progress', user.username, { ...state, completedSections, user: identity(user), savedAt: new Date().toISOString() });
  return completedSections;
}

async function handleApi(req, res, pathname) {
  const route = `${req.method} ${pathname}`;
  // Gövde en başta okunur; sonrasında her istek kesintisiz (eşzamanlı) işlenir. Böylece aynı anda gelen
  // istekler birbirinin yazdığı veriyi ezemez (ör. onlarca kişinin aynı anda şifre belirlemesi).
  const body = req.method === 'GET' ? {} : await readJson(req);
  const users = loadUsers();
  const hasAdmin = users.some((u) => u.role === 'admin');
  const user = currentUser(req);

  // Başka bir siteden gönderilen isteklere karşı: kaynak, sunucunun kendi adresi olmalı.
  // (x-forwarded-host: geliştirme ortamındaki Vite vekil sunucusu için.)
  const ownHosts = [req.headers.host, req.headers['x-forwarded-host']];
  if (req.method !== 'GET' && req.headers.origin && !ownHosts.includes(new URL(req.headers.origin).host)) return fail(res, 403, 'Geçersiz kaynak.');

  if (route === 'GET /api/me') return json(res, 200, { setupRequired: !hasAdmin, setupAllowedHere: isLoopback(req), user: user ? publicUser(user) : null });

  if (route === 'POST /api/setup') {
    if (hasAdmin) return fail(res, 409, 'Yönetici hesabı zaten var.');
    if (!isLoopback(req)) return fail(res, 403, 'İlk kurulum yalnızca sunucunun çalıştığı bilgisayardan yapılabilir.');
    const username = normalizeUsername(body.username);
    if (!validUsername(username) || !isText(body.name) || !validPassword(body.password)) return fail(res, 400, 'Kullanıcı adı, ad soyad ve en az 8 karakterli şifre gerekli.');
    const admin = newUser({ username, name: body.name, department: 'Yönetim', role: 'admin', mustChange: false }, await hashPassword(body.password));
    const fresh = loadUsers();
    if (fresh.some((u) => u.role === 'admin')) return fail(res, 409, 'Yönetici hesabı zaten var.');
    saveJson('users.json', [...fresh.filter((u) => u.username !== username), admin]);
    return json(res, 201, { user: publicUser(admin) }, { 'Set-Cookie': sessionCookie(admin, req) });
  }

  if (route === 'POST /api/login') {
    const username = normalizeUsername(body.username);
    const key = `${clientIp(req)}|${username}`;
    const wait = lockedFor(key);
    if (wait) return fail(res, 429, `Çok fazla hatalı deneme. ${wait} dakika sonra tekrar deneyin.`);
    const found = users.find((u) => u.username === username);
    if (!found || typeof body.password !== 'string' || !(await passwordMatches(found, body.password))) {
      noteFailure(key);
      return fail(res, 401, 'Kullanıcı adı veya şifre hatalı.');
    }
    failures.delete(key);
    return json(res, 200, { user: publicUser(found) }, { 'Set-Cookie': sessionCookie(found, req) });
  }

  if (route === 'POST /api/logout') return json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie(req) });

  if (!user) return fail(res, 401, 'Oturum açmanız gerekiyor.');

  if (route === 'POST /api/password') {
    if (typeof body.current !== 'string' || !(await passwordMatches(user, body.current))) return fail(res, 401, 'Mevcut şifre hatalı.');
    if (!validPassword(body.next) || body.next === body.current) return fail(res, 400, 'Yeni şifre en az 8 karakter olmalı ve mevcut şifreden farklı olmalı.');
    const passwordHash = await hashPassword(body.next);
    const fresh = loadUsers();
    const me = fresh.find((u) => u.username === user.username);
    if (!me) return fail(res, 401, 'Oturum açmanız gerekiyor.');
    Object.assign(me, passwordHash, { mustChange: false, tokenVersion: me.tokenVersion + 1 });
    saveJson('users.json', fresh);
    return json(res, 200, { user: publicUser(me) }, { 'Set-Cookie': sessionCookie(me, req) });
  }

  // Geçici şifreyle giren kullanıcı, kendi şifresini belirleyene kadar başka işlem yapamaz.
  if (user.mustChange) return fail(res, 403, 'Önce şifrenizi değiştirin.');

  if (route === 'GET /api/progress') return json(res, 200, { state: loadUserDoc('progress', user.username) });
  if (route === 'PUT /api/progress') {
    const state = body;
    if (!state || typeof state !== 'object' || !Array.isArray(state.completedSections)) return fail(res, 400, 'geçersiz ilerleme');
    // Aynı tarayıcıda başka bir hesapla giriş yapılmışsa, eski sekmenin ilerlemesi yeni hesabın üzerine yazılmamalı.
    if (state.user?.userId && state.user.userId !== user.username) return fail(res, 409, 'Bu tarayıcıda başka bir hesapla oturum açılmış.');
    const completedSections = saveProgress(user, state);
    return json(res, 200, { ok: true, completedSections });
  }

  // Sınav: sorular sunucuda seçilir, cevaplar sunucuda puanlanır; kayıtları yalnızca sunucu yazar.
  if (route === 'POST /api/quiz/start') {
    const store = loadJson('records.json', { attempts: [], completions: [] });
    if (store.completions.some((c) => c.userId === user.username && c.trainingId === TRAINING.id)) return fail(res, 409, 'Eğitimi zaten tamamladınız.');
    // Tarayıcı, sınavı açarken güncel ilerlemesini de gönderir; böylece daha önce ulaşmamış bir kayıt sınavı engellemez.
    const stored = loadUserDoc('progress', user.username);
    const mine = !body.progress?.user?.userId || body.progress.user.userId === user.username;
    const done = mine && Array.isArray(body.progress?.completedSections)
      ? saveProgress(user, { ...stored, ...body.progress }).length
      : stored?.completedSections?.length ?? 0;
    if (done < SECTION_COUNT) return fail(res, 403, `Sınav, tüm bölümler tamamlandıktan sonra açılır (tamamlanan: ${done} / ${SECTION_COUNT}).`);
    // Yarım kalan sınav varsa aynı sorular döner; yeniden başlatarak soru seçilemez.
    let session = loadUserDoc('quiz', user.username);
    if (!session || session.result) {
      const previous = store.attempts.filter((a) => a.userId === user.username).at(-1);
      session = { startedAt: new Date().toISOString(), items: createQuiz(previous ? previous.answers.map((a) => a.questionId) : []) };
      saveUserDoc('quiz', user.username, session);
    }
    return json(res, 200, { startedAt: session.startedAt, questions: publicQuiz(session.items) });
  }
  if (route === 'POST /api/quiz/submit') {
    const session = loadUserDoc('quiz', user.username);
    // Yanıt yolda kaybolup aynı sınav yeniden gönderilirse ikinci kez puanlanmaz; ilk sonuç döner.
    if (session?.result) return session.startedAt === body.startedAt ? json(res, 200, session.result) : fail(res, 409, 'Etkin bir sınav yok.');
    if (!session) return fail(res, 409, 'Etkin bir sınav yok.');
    const selected = body.answers;
    const complete = Array.isArray(selected) && selected.length === session.items.length &&
      selected.every((s, i) => Number.isInteger(s) && s >= 0 && s < session.items[i].order.length);
    if (!complete) return fail(res, 400, 'Tüm sorular yanıtlanmalıdır.');

    const result = gradeQuiz(session.items, selected);
    const store = loadJson('records.json', { attempts: [], completions: [] });
    const progress = loadUserDoc('progress', user.username) ?? {};
    const now = new Date();
    const base = { ...identity(user), trainingId: TRAINING.id, trainingVersion: TRAINING.version };
    const attempt = {
      ...base,
      id: `${user.username}-${now.getTime()}`,
      attempt: store.attempts.filter((a) => a.userId === user.username).length + 1,
      startedAt: session.startedAt,
      submittedAt: now.toISOString(),
      quizDurationSec: Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000),
      trainingDurationSec: progress.activeSeconds ?? 0,
      total: result.total,
      correctCount: result.correctCount,
      score: result.score,
      passed: result.passed,
      answers: result.answers,
    };
    store.attempts.push(attempt);
    let completion = null;
    if (result.passed) {
      const interactions = Object.values(progress.interactions ?? {});
      completion = {
        ...base,
        completedAt: now.toISOString(),
        trainingDurationSec: attempt.trainingDurationSec,
        score: result.score,
        passed: true,
        attempt: attempt.attempt,
        interactionScore: { correct: interactions.filter((x) => x?.correct).length, total: interactions.length },
      };
      store.completions.push(completion);
    }
    saveJson('records.json', store);
    const response = { attempt, completion, review: result.review };
    saveUserDoc('quiz', user.username, { startedAt: session.startedAt, result: response });
    return json(res, 201, response);
  }

  // --- Buradan sonrası yalnızca yönetici ---
  if (user.role !== 'admin') return fail(res, pathname.startsWith('/api/users') || pathname === '/api/report' ? 403 : 404, 'Yetkiniz yok.');

  if (route === 'GET /api/report') {
    const progress = loadAllProgress();
    return json(res, 200, {
      ...loadJson('records.json', { attempts: [], completions: [] }),
      questions: questionIndex,
      addresses: PUBLIC_URL ? [PUBLIC_URL] : lanAddresses(),
      users: users.map((u) => ({
        ...publicUser(u),
        completedSections: progress[u.username]?.completedSections?.length ?? 0,
        activeSeconds: progress[u.username]?.activeSeconds ?? 0,
      })),
    });
  }

  if (route === 'POST /api/users') {
    const username = normalizeUsername(body.username);
    if (!validUsername(username)) return fail(res, 400, 'Kullanıcı adı 2–64 karakter olmalı; harf, rakam ve . _ @ - içerebilir.');
    if (!isText(body.name)) return fail(res, 400, 'Ad soyad gerekli.');
    if (!validPassword(body.password)) return fail(res, 400, 'Şifre en az 8 karakter olmalı.');
    const created = newUser({ username, name: body.name, department: body.department, role: body.role === 'admin' ? 'admin' : 'user', mustChange: true }, await hashPassword(body.password));
    const fresh = loadUsers();
    if (fresh.some((u) => u.username === username)) return fail(res, 409, 'Bu kullanıcı adı zaten kayıtlı.');
    saveJson('users.json', [...fresh, created]);
    return json(res, 201, { user: publicUser(created) });
  }

  // Toplu hesap: ad listesinden kullanıcı adı ve geçici şifre üretir. Şifreler yalnızca bu yanıtta görünür.
  if (route === 'POST /api/users/bulk') {
    const rows = Array.isArray(body.users) ? body.users.filter((r) => r && isText(r.name)) : [];
    if (!rows.length || rows.length > 300) return fail(res, 400, 'En az 1, en fazla 300 kişi girin.');
    const passwords = rows.map(() => temporaryPassword());
    const hashes = await Promise.all(passwords.map((pw) => hashPassword(pw)));
    const fresh = loadUsers();
    const taken = new Set(fresh.map((u) => u.username));
    const created = rows.map((r, i) => {
      const base = usernameFromName(r.name);
      let username = base;
      for (let n = 2; taken.has(username); n++) username = `${base}${n}`;
      taken.add(username);
      const department = typeof r.department === 'string' ? r.department : '';
      fresh.push(newUser({ username, name: r.name, department, role: 'user', mustChange: true }, hashes[i]));
      return { name: r.name.trim(), department: department.trim(), username, password: passwords[i] };
    });
    saveJson('users.json', fresh);
    return json(res, 201, { created });
  }

  if (route === 'POST /api/users/reset') {
    if (!validPassword(body.password)) return fail(res, 400, 'Şifre en az 8 karakter olmalı.');
    const passwordHash = await hashPassword(body.password);
    const fresh = loadUsers();
    const target = fresh.find((u) => u.username === normalizeUsername(body.username));
    if (!target) return fail(res, 404, 'Kullanıcı bulunamadı.');
    Object.assign(target, passwordHash, { mustChange: true, tokenVersion: target.tokenVersion + 1 });
    saveJson('users.json', fresh);
    return json(res, 200, { ok: true });
  }

  if (route === 'POST /api/users/delete') {
    const username = normalizeUsername(body.username);
    if (username === user.username) return fail(res, 400, 'Kendi hesabınızı silemezsiniz.');
    if (!users.some((u) => u.username === username)) return fail(res, 404, 'Kullanıcı bulunamadı.');
    // Hesap silinir; sınav ve tamamlanma kayıtları denetim için korunur.
    saveJson('users.json', users.filter((u) => u.username !== username));
    return json(res, 200, { ok: true });
  }

  return fail(res, 404, 'bulunamadı');
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname.startsWith('/api/')) {
      // Başarısız API istekleri istek-hatalari.log dosyasına yazılır (yanlış şifre gibi olağan durumlar dâhil);
      // kullanıcı bir hata gördüğünde sebebi buradan bulunur. Şifre veya istek içeriği yazılmaz.
      res.on('finish', () => {
        if (res.statusCode < 400) return;
        const line = `${new Date().toISOString()} ${clientIp(req)} ${req.method} ${pathname} -> ${res.statusCode} ${decodeURIComponent(res.getHeader('x-hata') ?? '')} (gövde ${req.headers['content-length'] ?? 0} bayt)\n`;
        try { appendFileSync(join(dataDir, 'istek-hatalari.log'), line, 'utf8'); } catch { /* günlük yazılamasa da sürer */ }
      });
      return await handleApi(req, res, pathname);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'desteklenmiyor');
    serveStatic(req, res, pathname);
  } catch (err) {
    if (res.headersSent) return;
    if (err instanceof BadRequest) return fail(res, 400, err.message);
    logError(`${req.method} ${pathname}`, err);
    fail(res, 500, 'Sunucu hatası. İşleminiz kaydedilmemiş olabilir; lütfen tekrar deneyin.');
  }
}).listen(PORT, HOST, () => {
  server.keepAliveTimeout = 65_000;
  // Beklenmeyen bir hata sunucuyu kapatmamalı; günlüğe yazılır ve çalışmaya devam edilir.
  process.on('uncaughtException', (err) => logError('uncaughtException', err));
  process.on('unhandledRejection', (err) => logError('unhandledRejection', err));
  if (PUBLIC_URL) {
    console.log(`Eğitim sunucusu çalışıyor: ${PUBLIC_URL} (iç adres ${HOST ?? '*'}:${PORT})`);
  } else {
    const lan = lanAddresses();
    console.log(`Bu bilgisayarda:        http://localhost:${PORT}`);
    console.log(`Ağdaki bilgisayarlarda: ${lan.length ? lan.join('  ') : '(ağ bağlantısı bulunamadı)'}`);
  }
  if (!loadUsers().some((u) => u.role === 'admin')) {
    console.log(PUBLIC_URL
      ? 'Henüz yönetici hesabı yok: sunucuda "bash deploy/yonetici-olustur.sh" komutuyla oluşturun.'
      : 'Henüz yönetici hesabı yok: bu bilgisayarda siteyi açıp ilk yönetici hesabını oluşturun.');
  }
});
