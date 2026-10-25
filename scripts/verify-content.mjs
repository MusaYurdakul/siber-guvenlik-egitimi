// İçerik bütünlüğü denetimi: kaynak belge ile uygulama verisini karşılaştırır.
// Kullanım: npm run verify
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = (f) => join(root, 'src/training/data', f);
const { sections } = JSON.parse(readFileSync(data('source.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(data('audio-manifest.json'), 'utf8'));
const read = (f) => readFileSync(join(root, f), 'utf8');

const problems = [];
const check = (ok, label) => { console.log(`${ok ? '✓' : '✗'} ${label}`); if (!ok) problems.push(label); };

// 1) Belgedeki metin ile source.json aynı mı? (boşluklar hariç karakter karakter)
const sourceDir = join(root, 'source');
const docx = join(sourceDir, readdirSync(sourceDir).find((f) => f.endsWith('.docx')));
const xml = strFromU8(unzipSync(readFileSync(docx))['word/document.xml']);
const docText = [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const squash = (s) => s.replace(/\s+/g, '');
const rebuilt = sections.map((s) => `${s.id}. ${s.title}${s.paragraphs.join('')}Ekran mesajı: ${s.keyMessage}`).join('');
check(sections.length === 15, `15 bölüm mevcut (${sections.length})`);
check(squash(docText).endsWith(squash(rebuilt)), `Kaynak metin eksiksiz (${squash(rebuilt).length} karakter, belgeyle birebir)`);
check(sections.every((s) => s.paragraphs.length > 0 && s.keyMessage), 'Her bölümde paragraflar ve ekran mesajı var');

// 2) Her bölümün sesi var mı, parça sayısı metinle uyuşuyor mu?
let narration = 0;
for (const s of sections) {
  const m = manifest.sections[s.id];
  const file = m && join(root, 'public/audio', m.file);
  const ok = Boolean(m) && existsSync(file) && statSync(file).size > 10_000 && m.cues.length === s.paragraphs.length + 2;
  if (!ok) check(false, `Bölüm ${s.id} ses dosyası`);
  narration += m?.duration ?? 0;
}
check(Object.keys(manifest.sections).length === 15, `15 bölümün ses dosyası mevcut, toplam anlatım ${(narration / 60).toFixed(1)} dk`);

// 3) Sınav havuzu ve görsel/sahne/etkileşim verisi.
const questions = JSON.parse(read('server/quiz/questions.json'));
const perSection = sections.map((s) => questions.filter((q) => q.sectionId === s.id).length);
check(questions.every((q) => q.options[q.correctIndex] !== undefined && q.explanation), 'Her sorunun doğru cevabı ve açıklaması var');
check(!existsSync(join(root, 'src/training/quiz')), 'Soru havuzu istemci kodunda yer almıyor (yalnızca sunucuda)');
check(perSection.every((n) => n >= 2), `Her bölüm için en az 2 soru (toplam ${perSection.reduce((a, b) => a + b, 0)})`);
const count = (file, re) => (read(file).match(re) ?? []).length;
check(count('src/training/data/visuals.ts', /image_prompt:/g) === count('src/training/data/visuals.ts', /image_description:/g), `Görseller: ${count('src/training/data/visuals.ts', /image_prompt:/g)} (prompt + açıklama/alt metin)`);
check(count('src/training/data/scenes.ts', /video_prompt:/g) === 6, 'Sahneler: 6 (video promptlarıyla)');
check(count('src/training/data/interactions.ts', /correctId:/g) >= 4, `Etkileşimler: ${count('src/training/data/interactions.ts', /correctId:/g)}`);

console.log(problems.length ? `\n${problems.length} sorun bulundu.` : '\nTüm içerik denetimleri geçti.');
process.exit(problems.length ? 1 : 0);
