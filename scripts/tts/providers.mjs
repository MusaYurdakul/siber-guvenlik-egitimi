// TTS sağlayıcı soyutlaması. Her sağlayıcı aynı sözleşmeyi uygular:
//   synthesize(text, { voice, rate }) -> Promise<Buffer>  (MP3)
// Yeni bir sağlayıcı eklemek için bu dosyaya bir kayıt eklemek yeterlidir;
// generate-audio.mjs ve arayüz sağlayıcıdan bağımsızdır.

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const edge = {
  name: 'edge',
  defaultVoice: 'tr-TR-EmelNeural',
  async synthesize(text, { voice, rate }) {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeXml(text), { rate });
    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    tts.close();
    return Buffer.concat(chunks);
  },
};

// Azure AI Speech (resmî, anahtar gerektirir): AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION ortam değişkenleri.
const azure = {
  name: 'azure',
  defaultVoice: 'tr-TR-EmelNeural',
  async synthesize(text, { voice, rate }) {
    const { AZURE_SPEECH_KEY: key, AZURE_SPEECH_REGION: region } = process.env;
    if (!key || !region) throw new Error('AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION tanımlanmalı.');
    const ssml = `<speak version="1.0" xml:lang="tr-TR"><voice name="${voice}"><prosody rate="${rate}">${escapeXml(text)}</prosody></voice></speak>`;
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      },
      body: ssml,
    });
    if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  },
};

const providers = { edge, azure };

export function getProvider(name) {
  const provider = providers[name];
  if (!provider) throw new Error(`Bilinmeyen TTS sağlayıcısı: ${name}. Seçenekler: ${Object.keys(providers).join(', ')}`);
  return provider;
}
