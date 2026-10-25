// Teslim paketi oluşturur: Teslim/Siber-Guvenlik-Egitimi-<tarih>.zip
// İçerik: teslim notu, sunucu kurulum paketi (egitim-paket.tar.gz) ve kaynak kod.
// Kullanıcı verileri (server/data) ve bağımlılıklar pakete alınmaz; derlenmiş site (dist) dâhildir.
// Kullanım: npm run teslim   (önce kurulum paketini yeniden oluşturur)
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = 'Siber-Guvenlik-Egitimi';
const stage = join(tmpdir(), `teslim-${Date.now()}`);
const out = join(stage, name);
const outDir = join(root, 'Teslim');
const target = join(outDir, `${name}-${new Date().toISOString().slice(0, 10)}.zip`);

// Pakete girmeyecekler: kullanıcı verisi, bağımlılıklar, yerel araç ayarları. Derlenmiş site (dist) dâhil edilir;
// böylece Egitimi-Ac.bat ilk açılışta indirme/derleme yapmadan, yalnızca Node.js ile hemen çalışır.
const EXCLUDE = ['node_modules', 'server/data', '.tts-cache', '.claude', 'Teslim', 'egitim-paket.tar.gz', '.git'];
const excluded = (path) => {
  const rel = relative(root, path).split(sep).join('/');
  return EXCLUDE.some((e) => rel === e || rel.startsWith(`${e}/`));
};

if (!existsSync(join(root, 'egitim-paket.tar.gz'))) throw new Error('Önce "npm run paket" çalıştırın.');
mkdirSync(out, { recursive: true });
cpSync(join(root, 'TESLIM-NOTU.md'), join(out, 'TESLIM-NOTU.md'));
cpSync(join(root, 'egitim-paket.tar.gz'), join(out, 'egitim-paket.tar.gz'));
cpSync(root, join(out, 'kaynak'), { recursive: true, filter: (src) => !excluded(src) });

// Güvenlik denetimi: veri ya da anahtar dosyası pakete girmemeli.
function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    statSync(p).isDirectory() ? walk(p, files) : files.push(p);
  }
  return files;
}
const files = walk(out);
const leaked = files.filter((f) => /secret\.key|users\.json|records\.json|[\\/]progress[\\/].+\.json|\.log$/.test(f));
if (leaked.length) throw new Error(`Pakete veri dosyası girmiş, iptal edildi: ${leaked.join(', ')}`);

mkdirSync(outDir, { recursive: true });
rmSync(target, { force: true });
// Windows'ta yerleşik tar (bsdtar) zip üretebilir (-a: biçimi uzantıdan seçer).
const tar = process.platform === 'win32' ? join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
execFileSync(tar, ['-a', '-cf', target, '-C', stage, name], { stdio: 'inherit' });
rmSync(stage, { recursive: true, force: true });
console.log(`Teslim paketi hazır: ${target} (${(statSync(target).size / 1024 / 1024).toFixed(1)} MB, ${files.length} dosya)`);
