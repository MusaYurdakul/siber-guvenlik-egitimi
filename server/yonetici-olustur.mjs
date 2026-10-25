// Sunucu üzerinde, komut satırından yönetici hesabı oluşturur ya da yönetici şifresini sıfırlar.
// Yayındaki sunucuda ilk yönetici hesabı böyle açılır (web üzerinden kurulum yalnızca localhost'tan yapılabilir).
// Kullanım: TRAINING_DATA_DIR=/var/lib/egitim node server/yonetici-olustur.mjs
import { createInterface } from 'node:readline';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, copyFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = process.env.TRAINING_DATA_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'data');
const file = join(dataDir, 'users.json');

const tty = Boolean(process.stdin.isTTY);
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: tty });
let muted = false;
// Şifre yazılırken ekranda gösterilmez.
rl._writeToOutput = (text) => { if (!muted) process.stdout.write(text); else if (text.includes('\n')) process.stdout.write('\n'); };
// Satırlar sıraya alınır; böylece yanıtlar bir dosyadan/borudan topluca gelse de kaybolmaz.
const lines = [];
const waiting = [];
rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : lines.push(line)));
rl.on('close', () => waiting.splice(0).forEach((resolve) => resolve('')));
const ask = (q, hidden = false) => {
  process.stdout.write(q);
  muted = hidden && tty;
  return new Promise((resolve) => {
    const done = (line) => { muted = false; if (!tty) process.stdout.write(hidden ? '\n' : `${line}\n`); resolve(line.trim()); };
    lines.length ? done(lines.shift()) : waiting.push(done);
  });
};

const users = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
console.log(`Veri klasörü: ${dataDir}`);
console.log(`Mevcut yönetici hesapları: ${users.filter((u) => u.role === 'admin').map((u) => u.username).join(', ') || '(yok)'}\n`);

const username = (await ask('Yönetici kullanıcı adı: ')).toLocaleLowerCase('tr');
if (!/^[a-z0-9çğıöşü._@-]{2,64}$/.test(username)) {
  console.error('Kullanıcı adı 2–64 karakter olmalı; harf, rakam ve . _ @ - içerebilir.');
  process.exit(1);
}
const existing = users.find((u) => u.username === username);
const name = existing?.name ?? (await ask('Ad Soyad: '));
if (name.length < 3) {
  console.error('Ad Soyad gerekli.');
  process.exit(1);
}
const password = await ask('Şifre (en az 8 karakter): ', true);
const repeat = await ask('Şifre (tekrar): ', true);
rl.close();
if (password.length < 8 || password.length > 128) {
  console.error('Şifre en az 8 karakter olmalı.');
  process.exit(1);
}
if (password !== repeat) {
  console.error('Şifreler aynı değil.');
  process.exit(1);
}

// Sunucuyla aynı biçim: scrypt, 16 baytlık tuz, 64 baytlık özet.
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
if (existing) {
  Object.assign(existing, { role: 'admin', salt, hash, mustChange: false, tokenVersion: (existing.tokenVersion ?? 1) + 1 });
} else {
  users.push({ username, name, department: 'Yönetim', role: 'admin', mustChange: false, tokenVersion: 1, createdAt: new Date().toISOString(), salt, hash });
}
mkdirSync(dataDir, { recursive: true });
if (existsSync(file)) copyFileSync(file, `${file}.bak`);
writeFileSync(`${file}.tmp`, JSON.stringify(users, null, 2), 'utf8');
renameSync(`${file}.tmp`, file);
console.log(existing ? `\n${username} hesabının şifresi yenilendi; hesap yönetici yetkisinde.` : `\n${username} yönetici hesabı oluşturuldu.`);
