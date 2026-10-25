// Sunucuya yüklenecek paketi oluşturur: egitim-paket.tar.gz
// İçerik: derlenmiş site (dist/), sunucu kodu (server/, veriler hariç) ve kurulum betikleri (deploy/).
// Sunucu tarafında npm kurulumu gerekmez; sunucu kodu yalnızca Node.js'in kendi modüllerini kullanır.
// Kullanım: npm run paket   (önce derler)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stage = join(tmpdir(), `egitim-paket-${Date.now()}`);
const out = join(stage, 'egitim-paket');
const target = join(root, 'egitim-paket.tar.gz');

if (!existsSync(join(root, 'dist/index.html'))) throw new Error('Önce "npm run build" çalıştırın.');

mkdirSync(join(out, 'server', 'quiz'), { recursive: true });
cpSync(join(root, 'dist'), join(out, 'dist'), { recursive: true });
cpSync(join(root, 'deploy'), join(out, 'deploy'), { recursive: true });
for (const f of ['index.mjs', 'quiz.mjs', 'yonetici-olustur.mjs', 'quiz/questions.json']) cpSync(join(root, 'server', f), join(out, 'server', f));

// Linux'ta çalışacak metin dosyalarında Windows satır sonu (CRLF) kalmasın.
const TEXT = new Set(['.sh', '.service', '.mjs', '.json', '.md', '']);
function normalize(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) normalize(p);
    else if (TEXT.has(extname(name))) writeFileSync(p, readFileSync(p, 'utf8').replace(/\r\n/g, '\n'));
  }
}
normalize(join(out, 'deploy'));
normalize(join(out, 'server'));

writeFileSync(join(out, 'SURUM.txt'), `Paket: ${new Date().toISOString()}\n`);
rmSync(target, { force: true });
// Windows'ta yerleşik tar (bsdtar) kullanılır; Git Bash'in GNU tar'ı "C:" yolunu uzak adres sanıyor.
const tar = process.platform === 'win32' ? join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
execFileSync(tar, ['-czf', target, '-C', stage, 'egitim-paket'], { stdio: 'inherit' });
rmSync(stage, { recursive: true, force: true });
console.log(`Paket hazır: ${target} (${(statSync(target).size / 1024 / 1024).toFixed(1)} MB)`);
