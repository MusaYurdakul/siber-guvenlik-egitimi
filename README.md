# Bilgi Güvenliği ve Siber Güvenlik Farkındalık Eğitimi

Çalışanlar için yaklaşık 1 saatlik, sesli anlatımlı, etkileşimli farkındalık eğitimi ve final sınavı.
Kaynak metin: `source/Bilgi Guvenligi ve Siber Guvenlik Egitim_Metni.docx` (15 bölüm). Eğitim metni belgeden
betikle çıkarılır ve değiştirilmeden kullanılır.

## Hızlı başlangıç (Windows)

Gerekli: [Node.js](https://nodejs.org) 22 veya üzeri.

`Egitimi-Ac.bat` dosyasına çift tıklayın; sunucu açılır ve tarayıcıda `http://localhost:8797` görünür.
Derlenmiş site (`dist/`) yoksa bat dosyası önce bağımlılıkları kurar ve siteyi derler (internet gerekir). İlk açılışta **yönetici hesabı** oluşturulur;
çalışan hesapları yönetici panelinden açılır. Aynı ağdaki bilgisayarlar, sunucu penceresinde yazan
`http://<ip>:8797` adresinden girer. Kalıcı kullanım için alan adlı sunucuya kurulum: [deploy/KURULUM.md](deploy/KURULUM.md).

## Özellikler

- **15 modül:** kaynak metnin tamamı ekranda ve Türkçe sesli anlatımla (bölüm başına ayrı MP3); oynatıcıda
  oynat/duraklat, ileri-geri, hız (1x/1.25x/1.5x), ses, ilerleme çubuğu, kalan süre; "yalnızca dinle" modu.
- **25 eğitim görseli, 6 kısa senaryo sahnesi, 5 bölüm içi etkileşim**; ekran mesajları vurgulu kartlarla;
  "Durun → Doğrulayın → Koruyun → Bildirin" teması baştan sona.
- **Final sınavı:** 40 soruluk havuzdan her bölümden bir soru (15 soru), %80 (12 doğru) ile geçiş; başarısızlıkta
  hatalı konular ve bölümlere dönüş; tekrar sınavında sorular ve sıra değişir. Soru havuzu yalnızca sunucudadır;
  soruları sunucu seçer, cevapları sunucu puanlar, kayıtları yalnızca sunucu yazar.
- **Hesaplar:** yönetici + çalışan; toplu hesap açma (ad listesinden kullanıcı adı ve geçici şifre), ilk girişte
  zorunlu şifre değişimi, şifre sıfırlama, hesap silme (sınav kayıtları korunur).
- **İlerleme:** hesaba kayıtlı; çalışan başka bilgisayar veya telefondan kaldığı yerden devam eder.
- **Yönetici raporu:** katılımcı durumu (başlamadı / devam ediyor / başarılı / başarısız), biten bölüm,
  tamamlanma tarihi, eğitim süresi, puan, deneme sayısı, kaçıncı denemede geçtiği, konu bazında hata oranları,
  en çok hata yapılan sorular, CSV dışa aktarma.
- **Erişilebilirlik:** metin her zaman ekranda, görsellerde alt metin, klavyeyle kullanım, mobil uyumlu düzen.

## Güvenlik ve güvenilirlik

- Şifreler `scrypt` ile özetlenerek saklanır; 5 hatalı denemede 5 dakika bekleme; oturum çerezi `HttpOnly`,
  HTTPS arkasında `Secure`; başka siteden gelen istekler reddedilir; şifre değişince eski oturumlar kapanır.
- İlk yönetici hesabı yalnızca sunucunun kendisinden açılabilir.
- İlerleme önce tarayıcıda, sonra sunucuda saklanır; sunucuya yazılamazsa ekranda ayrıntılı uyarı çıkar ve
  bağlantı gelene kadar yeniden denenir. Tamamlanan bölümler hiçbir koşulda geri gitmez.
- Sınav açılırken tarayıcı güncel ilerlemesini de gönderir; sınavda işaretlenen şıklar sayfa yenilense de durur;
  aynı sınav iki kez gönderilirse yeniden puanlanmaz.
- Her veri dosyasının bir önceki sürümü `.bak` olarak tutulur. Beklenmeyen hatalar `error.log`, başarısız istekler
  `istek-hatalari.log` dosyasına yazılır (şifre ve içerik yazılmaz).

## Soru havuzu

Gerçek sınav soru havuzu ve cevap anahtarı (`server/quiz/questions.json`) güvenlik nedeniyle bu depoya dahil
değildir. Biçim için `server/quiz/questions.ornek.json` dosyasına bakın; çalıştırmak için aynı biçimde, her bölümden
en az iki soru içeren bir `server/quiz/questions.json` oluşturun.

## Test

```bash
npm test
```

Ayrı bir geçici sunucuda 52 kontrol: kurulum, toplu hesap, giriş ve kilitleme, şifre belirleme, yetkiler,
ilerleme, sınav (cevapların sızmaması, sahte puanın yok sayılması, tekrar sınavı, %80 sınırı), rapor, hesap
silme, başka siteden istek, eşzamanlı şifre değişimi, önbellek ve dosya erişimi.

```bash
npm run yuk-testi
```

100 sanal kullanıcı aynı anda tüm akışı (sayfa ve ses indirme, giriş, şifre belirleme, 15 bölüm boyunca saniyede
bir ilerleme kaydı — gerçek kullanımın 10 katı —, sınav, yönetici raporu) çalıştırır. Son ölçüm: 100 kişide ve
200 kişide hata yok, tüm sonuçlar ve rapor doğru; 100 kişide ilerleme kaydı ortanca ~20–40 ms, sınav gönderimi
~25–30 ms, sunucu belleği en fazla ~215 MB.

## Komutlar

| Komut | İşlev |
| --- | --- |
| `npm run dev` | Geliştirme: arayüz `http://localhost:5183`, API `8797` (`?skip` ile süre koşulu atlanır, yalnızca geliştirmede) |
| `npm run build` / `npm start` | Derleme / üretim sunucusu (`http://localhost:8797`) |
| `npm test` / `npm run yuk-testi` | Uçtan uca test / eşzamanlı kullanım testi |
| `npm run paket` | Sunucuya kurulacak `egitim-paket.tar.gz` |
| `npm run teslim` | Teslim paketi (`Teslim/` klasörü: kaynak kod + kurulum paketi + teslim notu; kullanıcı verisi hariç) |
| `npm run extract` | Word belgesinden `src/training/data/source.json` üretir |
| `npm run tts` | Bölüm MP3'lerini ve gerçek süreleri (`audio-manifest.json`) üretir |
| `npm run verify` | Metin belgeyle birebir mi, 15 ses dosyası, soru havuzu, görsel/sahne verisi |

Belge değişirse: `npm run extract && npm run tts && npm run verify`.

## Ortam değişkenleri (sunucu)

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `TRAINING_PORT` | `8797` | Dinlenen port |
| `TRAINING_HOST` | tüm adresler | Yayında `127.0.0.1` (yalnızca HTTPS vekili erişir) |
| `TRAINING_DATA_DIR` | `server/data` | Veri klasörü (eşitlenen bir klasörde tutmayın) |
| `TRAINING_BEHIND_PROXY` | — | `1`: gerçek istemci adresi ve HTTPS bilgisi vekil başlıklarından alınır |
| `TRAINING_PUBLIC_URL` | — | Çalışanlara verilecek adres (ör. `https://egitim.ornek.com.tr`) |

Veriler: `users.json` (hesaplar), `records.json` (sınav ve tamamlanma kayıtları), `progress/` ve `quiz/`
(kişi başına ilerleme ve açık sınav), `secret.key` (oturum imza anahtarı). Bu klasör düzenli yedeklenmelidir.

## Seslendirme (TTS)

`scripts/tts/providers.mjs` sağlayıcı soyutlamasıdır: `synthesize(text, { voice, rate }) -> MP3`.
Hazır sağlayıcılar: `edge` (varsayılan, anahtarsız) ve `azure` (lisanslı; `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`).

```bash
npm run tts -- --provider azure --voice tr-TR-EmelNeural --rate -6%
```

Arayüz sağlayıcıyı bilmez; yalnızca `public/audio/NN-slug.mp3` dosyalarını ve manifest'teki süreleri kullanır.
MP3 bulunamazsa tarayıcının Türkçe sesi yedek olarak devreye girer.

> Ses dosyaları bu depoya dahil değildir. Üretmek için `npm install` sonrasında `npm run tts` çalıştırın; kurumsal
> kullanımda lisanslı sağlayıcı (`--provider azure`) önerilir.

## Lisans

Tüm hakları saklıdır. Ayrıntılar: [LICENSE](LICENSE).

## Yapı

```
src/training/
  data/        source.json (belge metni), sectionMeta, visuals (image_prompt), scenes (video_prompt),
               interactions, sections.ts (bölümler + süre hesabı), audio-manifest.json
  services/    narration (oynatıcı), auth, progress (ilerleme ve eşitleme), records (sınav API'si), report
  components/  PlayerBar, VisualCard, ScenePlayer, InteractionCard, FourSteps
  pages/       Login, Welcome, Intro, Module, Summary, Quiz, Result, Admin
server/        index.mjs (hesaplar, oturum, kayıtlar, statik sunum), quiz.mjs + quiz/questions.json (soru seçimi,
               puanlama), yonetici-olustur.mjs (komut satırından yönetici hesabı / şifre yenileme)
deploy/        kiralık sunucu kurulumu: kurulum.sh, guncelle.sh, yedekle.sh, Caddyfile, egitim.service, KURULUM.md
scripts/       extract-docx, generate-audio, verify-content, paket, teslim, test-api, yuk-testi
```

Görseller kodla çizilen eğitim görselleridir; her birinin üretim promptu `visuals.ts` içindedir. Gerçek bir görsel
eklemek için dosyayı `public/images/` altına koyup ilgili kaydın `src` alanını doldurmak yeterlidir.
