import type { SceneDef } from '../types';

// Kısa (15–20 sn) hareketli eğitim sahneleri. Her sahne adım adım oynatılır; altyazılar kaynak metne dayanır.
// `video_prompt`, aynı sahnenin ileride gerçek video olarak üretilmesi için hazır üretim promptudur.
export const scenes: SceneDef[] = [
  {
    id: 'phishing',
    sectionId: 2,
    paragraphIndex: 3,
    title: 'Senaryo 1 — Acil ödeme isteyen sahte e-posta',
    video_prompt:
      'Kurumsal ofis ortamında çalışan kişinin ekranına yöneticisinden gelmiş gibi görünen acil ödeme e-postası düşer; imleç bağlantıya yaklaşırken ekranda gönderen adresi, aciliyet ifadesi ve bağlantı kırmızı risk işaretleriyle vurgulanır; çalışan durur, telefonla göndereni doğrular, bağlantıyı kontrol eder ve e-postayı olay bildirim kanalına iletir; 20 saniyelik eğitim videosu, profesyonel kurumsal sinematografi.',
    description:
      'Çalışana acil ödeme isteyen sahte e-posta gelir; tıklamak üzereyken risk işaretleri görünür ve doğru davranış gösterilir: dur, göndereni doğrula, bağlantıyı kontrol et, bildir.',
    steps: [
      { duration: 3, caption: 'Çalışana, acil ödeme isteyen bir e-posta gelir.', tone: 'info' },
      { duration: 2.5, caption: 'Çalışan bağlantıya tıklamak üzeredir.', tone: 'risk' },
      { duration: 4, caption: 'Risk işaretleri: aciliyet, farklı gönderen adresi, sahte bağlantı.', tone: 'risk' },
      { duration: 2.5, caption: 'Dur.', tone: 'safe', step: 'dur' },
      { duration: 2.5, caption: 'Göndereni farklı bir kanaldan doğrula.', tone: 'safe', step: 'dogrula' },
      { duration: 2.5, caption: 'Bağlantıyı kontrol et; tıklama.', tone: 'safe', step: 'koru' },
      { duration: 3, caption: 'Olay bildirim kanalına bildir.', tone: 'safe', step: 'bildir' },
    ],
  },
  {
    id: 'wrong-email',
    sectionId: 3,
    paragraphIndex: 2,
    title: 'Senaryo 4 — Yanlış alıcıya gönderim',
    video_prompt:
      'Çalışan hassas bir dosyayı e-postayla gönderir, hemen ardından alıcı satırında yanlış kişiyi fark eder; bir an tereddüt eder, mesajı gizlemek yerine olay bildirim formunu açıp gönderilen veri, alıcı, tarih ve saati yazarak bildirir; 17 saniyelik kurumsal eğitim videosu, sakin ve profesyonel sinematografi.',
    description:
      'Çalışan hassas bir dosyayı yanlış alıcıya gönderir; panik yapmak veya mesajı gizlemek yerine olayı ayrıntılarıyla bildirir.',
    steps: [
      { duration: 3, caption: 'Çalışan, hassas bir dosyayı e-postayla gönderir.', tone: 'info' },
      { duration: 3, caption: 'Alıcının yanlış kişi olduğunu fark eder.', tone: 'risk', step: 'dur' },
      { duration: 3.5, caption: 'Yanlış kişiye gönderilen bir dosya da bilgi güvenliği olayıdır.', tone: 'risk', step: 'dogrula' },
      { duration: 3.5, caption: 'Gizlemeyin; mesajı ve ilgili bilgileri koruyun.', tone: 'safe', step: 'koru' },
      { duration: 4, caption: 'Gönderilen veri, alıcı, tarih, saat ve yapılan işlemlerle birlikte bildirin.', tone: 'safe', step: 'bildir' },
    ],
  },
  {
    id: 'usb',
    sectionId: 4,
    paragraphIndex: 0,
    title: 'Senaryo 3 — Yerde bulunan USB bellek',
    video_prompt:
      'Bir çalışan ofis koridorunda yerde bir USB bellek bulur, masasına dönüp bilgisayarına takmak üzereyken ekranda kırmızı risk uyarısı belirir; çalışan belleği takmaktan vazgeçer ve durumu bildirir; 15 saniyelik kurumsal siber güvenlik eğitim videosu, gerçekçi ofis ortamı.',
    description: 'Çalışan yerde bulduğu USB belleği bilgisayara takmak üzereyken risk uyarısı çıkar; doğru davranış gösterilir.',
    steps: [
      { duration: 3, caption: 'Çalışan yerde bir USB bellek bulur.', tone: 'info' },
      { duration: 3, caption: 'Belleği bilgisayarına takmak üzeredir.', tone: 'risk' },
      { duration: 3.5, caption: 'Risk: zararlı yazılım bulaşması, veri kaybı ve yetkisiz veri aktarımı.', tone: 'risk', step: 'dur' },
      { duration: 3, caption: 'Kaynağı bilinmeyen USB belleği kurum cihazına takmayın.', tone: 'safe', step: 'koru' },
      { duration: 3, caption: 'Yalnızca kurumun izin verdiği, güvenlik kontrolünden geçirilmiş bellekleri kullanın.', tone: 'safe', step: 'bildir' },
    ],
  },
  {
    id: 'mfa',
    sectionId: 6,
    paragraphIndex: 2,
    title: 'Senaryo 2 — Beklenmeyen MFA bildirimleri',
    video_prompt:
      'Kurumsal ofis ortamında çalışan kişinin telefonuna arka arkaya MFA onay bildirimleri gelmesi, çalışanın bildirimleri reddetmesi, ardından parolasını güvenli şekilde değiştirip güvenlik ekibine olay bildirimi yapması; 15 saniyelik kısa eğitim videosu, profesyonel kurumsal sinematografi.',
    description:
      'Çalışanın telefonuna arka arkaya beklenmeyen MFA bildirimleri gelir; çalışan talepleri reddeder, parolasını güvenli yöntemle değiştirir ve olayı bildirir.',
    steps: [
      { duration: 3, caption: 'Telefona arka arkaya beklenmeyen onay bildirimleri gelir.', tone: 'risk' },
      { duration: 3, caption: 'İşlemi siz başlatmadınız: bu bir saldırı göstergesi olabilir.', tone: 'risk', step: 'dur' },
      { duration: 3, caption: 'Talepleri reddedin.', tone: 'safe', step: 'dogrula' },
      { duration: 3, caption: 'Parolanızı güvenli yöntemle değiştirin.', tone: 'safe', step: 'koru' },
      { duration: 3, caption: 'Olayı bildirin.', tone: 'safe', step: 'bildir' },
    ],
  },
  {
    id: 'clean-desk',
    sectionId: 8,
    paragraphIndex: 0,
    title: 'Senaryo 5 — Temiz masa, temiz ekran',
    video_prompt:
      'Çalışan masasından kalkar; ekran açık, belgeler ve erişim kartı masanın üzerindedir. Geri döner: ekranı kilitler, belgeleri kilitli dolaba kaldırır ve erişim kartını yanına alır; 15 saniyelik kurumsal temiz masa eğitim videosu, gerçekçi ofis, yumuşak ışık.',
    description: 'Çalışan masasından ayrılır; ekran açık ve belgeler ortadadır. Doğru davranış: ekran kilitlenir, belgeler kaldırılır, erişim kartı korunur.',
    steps: [
      { duration: 3, caption: 'Çalışan masasından ayrılır.', tone: 'info' },
      { duration: 3.5, caption: 'Ekran açık; belgeler ve erişim kartı ortadadır.', tone: 'risk', step: 'dur' },
      { duration: 3, caption: 'Ekranı kilitleyin.', tone: 'safe', step: 'koru' },
      { duration: 3, caption: 'Belgeleri kapalı dolaplarda saklayın.', tone: 'safe', step: 'koru' },
      { duration: 3, caption: 'Erişim kartınızı başkasına vermeyin.', tone: 'safe', step: 'koru' },
    ],
  },
  {
    id: 'suspicious',
    sectionId: 10,
    paragraphIndex: 3,
    title: 'Senaryo 6 — Bilgisayarda şüpheli belirtiler',
    video_prompt:
      'Çalışanın bilgisayarında kendiliğinden pencereler açılır ve antivirüs uyarısı belirir; çalışan uyarıyı kapatmaya veya programı silmeye çalışmaz, ellerini klavyeden çeker ve telefonla BT birimine haber verir; 15 saniyelik kurumsal siber güvenlik eğitim videosu, gerçekçi stil.',
    description:
      'Bilgisayarda anormal pencereler açılır ve antivirüs uyarısı gelir; çalışan kendi başına müdahale etmek yerine Bilgi Teknolojileri birimine haber verir.',
    steps: [
      { duration: 3, caption: 'Bilgisayarda kendiliğinden pencereler açılır.', tone: 'risk' },
      { duration: 3, caption: 'Antivirüs uyarısı görünür.', tone: 'risk', step: 'dur' },
      { duration: 3.5, caption: 'Uyarıyı kapatmayın, programı kendiniz silmeye çalışmayın, internetten çözüm aramayın.', tone: 'risk', step: 'dogrula' },
      { duration: 3, caption: 'Cihazı kullanmaya devam etmeyin.', tone: 'safe', step: 'koru' },
      { duration: 3, caption: 'Bilgi Teknolojileri birimine bildirin.', tone: 'safe', step: 'bildir' },
    ],
  },
];
