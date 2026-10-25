// Her bölüm için ayrı bir MP3 (public/audio/NN-slug.mp3) ve gerçek süreleri içeren manifest üretir.
// Kullanım: node scripts/generate-audio.mjs [--provider edge|azure] [--voice tr-TR-EmelNeural] [--rate -6%] [--only 3,7]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { getProvider } from './tts/providers.mjs';
import { parseMp3 } from './tts/mp3.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src/training/data');
const audioDir = join(root, 'public/audio');
const cacheDir = join(root, '.tts-cache');
const manifestPath = join(dataDir, 'audio-manifest.json');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const provider = getProvider(arg('provider', process.env.TTS_PROVIDER ?? 'edge'));
const voice = arg('voice', process.env.TTS_VOICE ?? provider.defaultVoice);
const rate = arg('rate', process.env.TTS_RATE ?? '-6%');
const only = arg('only', '')?.split(',').filter(Boolean).map(Number);

const { sections } = JSON.parse(readFileSync(join(dataDir, 'source.json'), 'utf8'));
const slugs = JSON.parse(readFileSync(join(dataDir, 'slugs.json'), 'utf8'));
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { sections: {} };
mkdirSync(audioDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

async function synthesizeCached(text) {
  const key = createHash('sha1').update([provider.name, voice, rate, text].join('|')).digest('hex');
  const file = join(cacheDir, `${key}.mp3`);
  if (existsSync(file)) return readFileSync(file);
  for (let attempt = 1; ; attempt++) {
    try {
      const audio = await provider.synthesize(text, { voice, rate });
      if (!audio.length) throw new Error('boş ses yanıtı');
      writeFileSync(file, audio);
      return audio;
    } catch (err) {
      if (attempt >= 4) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

for (const section of sections) {
  if (only?.length && !only.includes(section.id)) continue;
  // Anlatım sırası: başlık, belgedeki tüm paragraflar, ekran mesajı.
  const segments = [`Bölüm ${section.id}. ${section.title}.`, ...section.paragraphs, section.keyMessage];
  const cues = [];
  const parts = [];
  let offset = 0;
  for (const text of segments) {
    const { duration, frames } = parseMp3(await synthesizeCached(text));
    cues.push(Number(offset.toFixed(2)));
    parts.push(frames);
    offset += duration;
  }
  const file = `${String(section.id).padStart(2, '0')}-${slugs[section.id]}.mp3`;
  writeFileSync(join(audioDir, file), Buffer.concat(parts));
  manifest.sections[section.id] = { file, duration: Number(offset.toFixed(2)), cues };
  console.log(`${file}  ${(offset / 60).toFixed(1)} dk`);
}

Object.assign(manifest, { provider: provider.name, voice, rate, generatedAt: new Date().toISOString() });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
const total = Object.values(manifest.sections).reduce((n, s) => n + s.duration, 0);
console.log(`Toplam anlatım: ${(total / 60).toFixed(1)} dk (${Object.keys(manifest.sections).length} bölüm)`);
