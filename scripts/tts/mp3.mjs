// MP3 karelerini sayarak süre hesaplar ve ID3 etiketlerini ayıklar (parçalar güvenle birleştirilebilsin diye).
const BITRATES = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/** @returns {{ duration: number, frames: Buffer }} */
export function parseMp3(buf) {
  let i = 0;
  if (buf.toString('latin1', 0, 3) === 'ID3') {
    i = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
  }
  const start = i;
  let end = i;
  let duration = 0;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const version = (buf[i + 1] >> 3) & 3; // 3: MPEG1, 2: MPEG2, 0: MPEG2.5
    const layer = (buf[i + 1] >> 1) & 3; // 1: Layer III
    const bitrateIdx = buf[i + 2] >> 4;
    const rateIdx = (buf[i + 2] >> 2) & 3;
    const padding = (buf[i + 2] >> 1) & 1;
    if (version === 1 || layer !== 1 || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) { i++; continue; }
    const mpeg1 = version === 3;
    const bitrate = BITRATES[mpeg1 ? 1 : 2][bitrateIdx] * 1000;
    const sampleRate = SAMPLE_RATES[version][rateIdx];
    const samples = mpeg1 ? 1152 : 576;
    const size = Math.floor((samples / 8) * bitrate / sampleRate) + padding;
    duration += samples / sampleRate;
    i += size;
    end = Math.min(i, buf.length);
  }
  return { duration, frames: buf.subarray(start, end) };
}
