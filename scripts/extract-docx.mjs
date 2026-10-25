// Kaynak Word belgesini bölümlere ayırarak src/training/data/source.json dosyasını üretir.
// Metin hiçbir şekilde özetlenmez veya değiştirilmez; paragraflar belgede olduğu gibi aktarılır.
// Kullanım: node scripts/extract-docx.mjs [belge.docx]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'source');
const docxPath = process.argv[2] ?? join(sourceDir, readdirSync(sourceDir).find((f) => f.endsWith('.docx')));

const xml = strFromU8(unzipSync(readFileSync(docxPath))['word/document.xml']);
const decode = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]
  .map(([p]) => ({
    heading: /<w:pStyle w:val="Heading1"\/>/.test(p),
    text: decode([...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')).trim(),
  }))
  .filter((p) => p.text);

const KEY_PREFIX = 'Ekran mesajı:';
const sections = [];
let documentTitle = '';
for (const p of paragraphs) {
  if (p.heading) {
    const m = p.text.match(/^(\d+)\.\s*(.+)$/);
    sections.push({ id: Number(m[1]), title: m[2], paragraphs: [], keyMessage: '' });
  } else if (!sections.length) {
    documentTitle = p.text;
  } else if (p.text.startsWith(KEY_PREFIX)) {
    sections.at(-1).keyMessage = p.text.slice(KEY_PREFIX.length).trim();
  } else {
    sections.at(-1).paragraphs.push(p.text);
  }
}

const out = join(root, 'src/training/data/source.json');
writeFileSync(out, JSON.stringify({ documentTitle, sections }, null, 2) + '\n', 'utf8');
const chars = sections.reduce((n, s) => n + s.paragraphs.join('').length + s.keyMessage.length, 0);
console.log(`${sections.length} bölüm, ${sections.reduce((n, s) => n + s.paragraphs.length, 0)} paragraf, ${chars} karakter -> ${out}`);
