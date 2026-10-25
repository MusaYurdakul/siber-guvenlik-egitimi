import type { Visual } from '../types';

// Her görsel; üretim promptu, açıklaması (alt metin), amacı ve bölüm/paragraf konumuyla birlikte tutulur.
// `render`, kaynak metindeki ifadelerle kurulan eğitim görselidir. İleride `image_prompt` ile üretilen bir
// dosya eklenirse `src` alanını doldurmak yeterlidir (ör. src: '/images/s02-sahte-eposta.webp').
// Örnek alan adları (ornekkurum.com.tr vb.) kurgusaldır.
export const visuals: Visual[] = [
  {
    id: 's01-uc-unsur',
    sectionId: 1,
    paragraphIndex: 1,
    title: 'Bilgi güvenliğinin üç unsuru',
    image_prompt:
      'Kurumsal ofis ortamında, cam bir yüzeyde gizlilik, bütünlük ve erişilebilirlik kavramlarını simgeleyen üç bağlantılı kalkan ikonunun yer aldığı modern bilgi güvenliği eğitim görseli, lacivert ve camgöbeği tonları, gerçekçi kurumsal stil.',
    image_description:
      'Üç kart: Gizlilik – bilgiye yalnızca yetkili kişiler ulaşır. Bütünlük – bilgi yetkisiz şekilde değiştirilmez. Erişilebilirlik – bilgi ve sistemler ihtiyaç duyulan zamanda kullanılabilir.',
    purpose: 'Gizlilik, bütünlük ve erişilebilirlik tanımlarını tek bakışta göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'lock', label: 'Gizlilik', note: 'Bilgiye yalnızca yetkili kişiler ulaşabilir.', tone: 'info' },
        { icon: 'fileCheck', label: 'Bütünlük', note: 'Bilgi yetkisiz şekilde değiştirilmez.', tone: 'info' },
        { icon: 'clock', label: 'Erişilebilirlik', note: 'Bilgi ve sistemler ihtiyaç duyulan zamanda kullanılabilir.', tone: 'info' },
      ],
    },
  },
  {
    id: 's02-kanallar',
    sectionId: 2,
    paragraphIndex: 0,
    title: 'Saldırı kanalları',
    image_prompt:
      'Bir çalışanın masasında yan yana duran dizüstü bilgisayarda şüpheli e-posta, telefonda şüpheli kısa mesaj ve çalan bir masa telefonu; phishing, smishing ve vishing kanallarını gösteren kurumsal siber güvenlik eğitim görseli, gerçekçi stil.',
    image_description: 'Üç kart: Phishing e-posta üzerinden, smishing kısa mesaj üzerinden, vishing telefon görüşmesi üzerinden yürütülür.',
    purpose: 'Phishing, smishing ve vishing ayrımını kanal bazında göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'mail', label: 'Phishing', note: 'E-posta üzerinden', tone: 'risk' },
        { icon: 'message', label: 'Smishing', note: 'Kısa mesaj üzerinden', tone: 'risk' },
        { icon: 'phone', label: 'Vishing', note: 'Telefon görüşmesi üzerinden', tone: 'risk' },
      ],
    },
  },
  {
    id: 's02-sahte-eposta',
    sectionId: 2,
    paragraphIndex: 1,
    title: 'Sahte e-posta örneği',
    image_prompt:
      'Kurumsal bir çalışanın ekranında yöneticiden gelmiş gibi görünen, acil ödeme isteyen sahte phishing e-postası; gönderen adresi, aciliyet ifadesi ve bağlantı kırmızı işaretlerle vurgulanmış, modern bilgi güvenliği eğitim görseli, gerçekçi kurumsal stil.',
    image_description:
      'Yöneticiden gelmiş gibi görünen sahte e-posta. İşaretlenen riskler: aciliyet ifadesi, görünen addan farklı gerçek gönderen adresi, gizlilik isteği ve bilinen adrese benzeyen sahte bağlantı.',
    purpose: 'Phishing belirtilerini gerçek bir e-posta ekranı üzerinde göstermek.',
    render: {
      kind: 'email',
      email: {
        fromName: 'Genel Müdür',
        fromAddress: 'genelmudur@ornekkurum-yonetim.com',
        subject: 'ACİL – Ödemeyi hemen yapın',
        body: ['Toplantıdayım, arayamıyorum.', 'Ödemeyi hemen yapın. Bu belgeyi yalnızca siz görebilirsiniz.'],
        linkLabel: 'Ödeme belgesini görüntüle',
        linkUrl: 'http://ornekkurum.odeme-onay.co/giris',
      },
      flags: [
        'Aciliyet ve otorite: “ödemeyi hemen yapın”',
        'Gönderenin adı doğru görünse bile gerçek e-posta adresi farklı',
        'Bağlantı, bilinen adrese çok benzeyen sahte bir siteye yönlendiriyor',
      ],
    },
  },
  {
    id: 's02-yontemler',
    sectionId: 2,
    paragraphIndex: 1,
    title: 'Kullanılan duygular',
    image_prompt:
      'Sosyal mühendislikte kullanılan aciliyet, korku, merak, ödül ve otorite duygularını simgeleyen beş ikonlu sade infografik, koyu lacivert zemin, kurumsal eğitim materyali stili.',
    image_description: 'Beş kart: aciliyet, korku, merak, ödül ve otorite; her biri belgedeki örnek ifadeyle.',
    purpose: 'Saldırganın çalışanı düşünmeden hareket etmeye zorlayan yöntemlerini göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'alarm', label: 'Aciliyet', note: '“Ödemeyi hemen yapın”', tone: 'risk' },
        { icon: 'alert', label: 'Korku', note: '“Hesabınız kapanacaktır”', tone: 'risk' },
        { icon: 'eye', label: 'Merak', note: '“Bu belgeyi yalnızca siz görebilirsiniz”', tone: 'risk' },
        { icon: 'gift', label: 'Ödül', tone: 'risk' },
        { icon: 'crown', label: 'Otorite', note: 'Yönetici, banka veya kamu görevlisi gibi davranma', tone: 'risk' },
      ],
    },
  },
  {
    id: 's02-alan-adi',
    sectionId: 2,
    paragraphIndex: 2,
    title: 'Gerçek ve sahte alan adı',
    image_prompt:
      'Kurumsal ofis ortamında çalışan bir kişinin gelen e-postanın gönderen adresini dikkatlice kontrol ettiği, ekranda sahte alan adı ve gerçek alan adının yan yana karşılaştırıldığı, modern bilgi güvenliği eğitim görseli, gerçekçi kurumsal stil.',
    image_description: 'İki sütun: solda kurum kayıtlarındaki gerçek alan adı, sağda harf değişikliği ve tire içeren benzer sahte alan adları.',
    purpose: 'Alan adı kontrolünün nasıl yapılacağını karşılaştırmayla göstermek.',
    render: {
      kind: 'compare',
      left: {
        tone: 'safe',
        heading: 'Gerçek alan adı',
        lines: [{ text: 'muhasebe@ornekkurum.com.tr', mono: true }, { text: 'Kurum kayıtlarındaki bilgiyle aynı' }],
      },
      right: {
        tone: 'risk',
        heading: 'Benzeyen sahte alan adı',
        lines: [
          { text: 'muhasebe@ornekkururn.com.tr', mono: true, mark: 'rn ≠ m' },
          { text: 'muhasebe@ornek-kurum.co', mono: true, mark: 'tire, farklı uzantı' },
        ],
      },
    },
  },
  {
    id: 's03-gonderici',
    sectionId: 3,
    paragraphIndex: 1,
    title: 'Görünen ad, gerçek adres ve gerçek bağlantı',
    image_prompt:
      'Bir e-posta istemcisinde fare imlecinin bağlantının üzerine getirildiği ve açılan ipucunda gerçek yönlendirme adresinin göründüğü yakın çekim ekran görüntüsü; görünen gönderici adı ile gerçek e-posta adresi farkı vurgulanmış, kurumsal siber güvenlik eğitim görseli.',
    image_description:
      'İki sütun: görünen gönderici adı ve bağlantı metni güvenilir görünürken, gerçek e-posta adresi ve fare imleciyle görülen gerçek yönlendirme adresi farklıdır.',
    purpose: 'Görünen ad yerine gerçek adrese ve gerçek yönlendirme adresine bakmayı öğretmek.',
    render: {
      kind: 'compare',
      left: {
        tone: 'info',
        heading: 'Ekranda görünen',
        lines: [{ text: 'Gönderen: Muhasebe Birimi' }, { text: 'Bağlantı: “Faturayı görüntüle”' }],
      },
      right: {
        tone: 'risk',
        heading: 'Kontrol edince görülen',
        lines: [
          { text: 'fatura@ornekkurum-destek.net', mono: true, mark: 'gerçek e-posta adresi' },
          { text: 'http://ornekkurum.fatura-goster.co', mono: true, mark: 'gerçek yönlendirme adresi' },
        ],
      },
    },
  },
  {
    id: 's03-ekler',
    sectionId: 3,
    paragraphIndex: 1,
    title: 'Açılmaması gereken beklenmeyen ekler',
    image_prompt:
      'E-posta ekinde yer alan çalıştırılabilir dosya, sıkıştırılmış arşiv ve makro etkinleştirme isteyen ofis belgesi ikonlarının uyarı işaretiyle gösterildiği kurumsal siber güvenlik eğitim görseli, temiz ve modern stil.',
    image_description: 'Üç kart: çalıştırılabilir dosyalar, sıkıştırılmış arşivler ve makro etkinleştirmenizi isteyen belgeler.',
    purpose: 'Şüpheli ek türlerini tanıtmak.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'fileX', label: 'Çalıştırılabilir dosyalar', note: 'Fatura.exe', tone: 'risk' },
        { icon: 'archive', label: 'Sıkıştırılmış arşivler', note: 'Belgeler.zip', tone: 'risk' },
        { icon: 'fileCode', label: 'Makro etkinleştirmenizi isteyen belgeler', note: 'Teklif.docm', tone: 'risk' },
      ],
    },
  },
  {
    id: 's03-son-kontrol',
    sectionId: 3,
    paragraphIndex: 2,
    title: 'Göndermeden önce son kontrol',
    image_prompt:
      'Çalışanın e-postayı göndermeden önce alıcı satırını, ekleri ve içeriği kontrol ettiği, ekranda onay işaretli bir kontrol listesinin göründüğü kurumsal eğitim görseli, gerçekçi ofis ortamı.',
    image_description: 'Dört adımlı kontrol: alıcılar, bilgi alanı, ekler ve mesaj içeriği.',
    purpose: 'Gönderim öncesi kontrol edilecek dört alanı hatırlatmak.',
    render: {
      kind: 'flow',
      steps: [
        { icon: 'users', label: 'Alıcılar' },
        { icon: 'eye', label: 'Bilgi alanı' },
        { icon: 'file', label: 'Ekler' },
        { icon: 'fileText', label: 'Mesaj içeriği' },
      ],
      note: 'Dosya parolası, dosyanın gönderildiği aynı e-posta içinde paylaşılmamalıdır.',
    },
  },
  {
    id: 's04-usb',
    sectionId: 4,
    paragraphIndex: 0,
    title: 'Riskli ve güvenli USB bellek',
    image_prompt:
      'Solda otopark zemininde bulunmuş kaynağı belirsiz bir USB bellek, sağda kurum logolu, şifreli ve etiketli onaylı bir USB bellek; riskli ve güvenli karşılaştırması yapan kurumsal siber güvenlik eğitim görseli, gerçekçi stil.',
    image_description:
      'İki sütun: riskli bellekler kaynağı bilinmeyen, yerde bulunan veya kişisel amaçla kullanılanlardır; güvenli bellekler kurumun izin verdiği, mümkünse şifreli ve güvenlik kontrolünden geçirilmiş olanlardır.',
    purpose: 'Hangi USB belleğin kullanılabileceğini karşılaştırmayla göstermek.',
    render: {
      kind: 'compare',
      left: {
        tone: 'risk',
        heading: 'Kurum cihazına takmayın',
        lines: [{ text: 'Kaynağı bilinmeyen' }, { text: 'Yerde bulunan' }, { text: 'Kişisel amaçla kullanılan' }],
      },
      right: {
        tone: 'safe',
        heading: 'Kullanılabilir',
        lines: [
          { text: 'Kurum tarafından izin verilen' },
          { text: 'Mümkünse şifreleme özelliği bulunan' },
          { text: 'Güvenlik kontrolünden geçirilmiş' },
        ],
      },
    },
  },
  {
    id: 's04-sahte-uyarilar',
    sectionId: 4,
    paragraphIndex: 3,
    title: 'Tıklanmaması gereken uyarılar',
    image_prompt:
      'Tarayıcıda açılan sahte “cihazınıza virüs bulaştı” pop-up penceresi ve sahte güncelleme bildirimi; çalışanın tıklamak yerine ekran görüntüsü aldığı kurumsal siber güvenlik eğitim görseli, gerçekçi stil.',
    image_description: 'Üç kart: pop-up mesajlar, sahte güncelleme bildirimleri ve “cihazınıza virüs bulaştı” şeklindeki yönlendirmeler.',
    purpose: 'Sahte tarayıcı uyarılarını tanıtmak ve doğru davranışı hatırlatmak.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'message', label: 'Pop-up mesajlar', tone: 'risk' },
        { icon: 'refresh', label: 'Sahte güncelleme bildirimleri', tone: 'risk' },
        { icon: 'bug', label: '“Cihazınıza virüs bulaştı” yönlendirmeleri', tone: 'risk' },
        { icon: 'camera', label: 'Doğru davranış', note: 'Ekran görüntüsü alarak Bilgi Teknolojileri birimine bildirin.', tone: 'safe' },
      ],
    },
  },
  {
    id: 's05-fotograf',
    sectionId: 5,
    paragraphIndex: 0,
    title: 'Bir çalışma alanı fotoğrafında görünebilecekler',
    image_prompt:
      'Ofiste çekilmiş samimi bir ekip fotoğrafı; arka planda açık bir bilgisayar ekranı, masada ziyaretçi kartı ve toplantı notları fark edilir şekilde çerçevelenmiş, sosyal medya paylaşım riskini anlatan kurumsal eğitim görseli, gerçekçi stil.',
    image_description: 'Beş kart: ekranlar, ziyaretçi kartları, üretim ekipmanları, toplantı notları ve belgeler.',
    purpose: 'Fotoğraflarda farkında olmadan paylaşılabilecek bilgileri göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'monitor', label: 'Ekranlar', tone: 'risk' },
        { icon: 'idCard', label: 'Ziyaretçi kartları', tone: 'risk' },
        { icon: 'factory', label: 'Üretim ekipmanları', tone: 'risk' },
        { icon: 'notes', label: 'Toplantı notları', tone: 'risk' },
        { icon: 'fileText', label: 'Belgeler', tone: 'risk' },
      ],
    },
  },
  {
    id: 's05-byod',
    sectionId: 5,
    paragraphIndex: 2,
    title: 'Şahsi cihazda bulunması gerekenler',
    image_prompt:
      'Kişisel bir akıllı telefonda kurumsal verinin ayrı ve korumalı bir alanda tutulduğu; ekran kilidi, güncel işletim sistemi, güvenlik yazılımı ve şifreleme ikonlarının yer aldığı BYOD konulu kurumsal eğitim görseli.',
    image_description: 'Dört kart: ekran kilidi, güncel işletim sistemi, güvenlik yazılımı ve mümkünse şifreleme.',
    purpose: 'BYOD kullanımında cihazda aranan koşulları göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'lock', label: 'Ekran kilidi', tone: 'safe' },
        { icon: 'refresh', label: 'Güncel işletim sistemi', tone: 'safe' },
        { icon: 'shield', label: 'Güvenlik yazılımı', tone: 'safe' },
        { icon: 'key', label: 'Mümkünse şifreleme', tone: 'safe' },
      ],
    },
  },
  {
    id: 's06-parola',
    sectionId: 6,
    paragraphIndex: 1,
    title: 'Zayıf ve güçlü parola alışkanlıkları',
    image_prompt:
      'Solda monitöre yapıştırılmış parola yazılı not kâğıdı, sağda parola yöneticisi uygulamasında uzun ve benzersiz parolalar; zayıf ve güçlü parola alışkanlıklarını karşılaştıran kurumsal siber güvenlik eğitim görseli.',
    image_description:
      'İki sütun: kaçınılması gerekenler (isim, doğum tarihi, ardışık rakamlar, tekrar kullanılan ve kâğıda yazılan parolalar) ve doğru uygulamalar (uzun, tahmin edilmesi zor, benzersiz, parola yöneticisinde saklanan).',
    purpose: 'Parola kurallarını karşılaştırmalı göstermek.',
    render: {
      kind: 'compare',
      left: {
        tone: 'risk',
        heading: 'Kullanmayın',
        lines: [
          { text: 'İsim, doğum tarihi, şirket adı' },
          { text: 'Telefon numarası, ardışık rakamlar' },
          { text: 'Başka sistemde tekrar kullanılan parola' },
          { text: 'Kâğıda yazılıp ekrana veya çekmeceye bırakılan parola' },
        ],
      },
      right: {
        tone: 'safe',
        heading: 'Doğru parola',
        lines: [
          { text: 'Uzun' },
          { text: 'Tahmin edilmesi zor' },
          { text: 'Her hesap için benzersiz' },
          { text: 'Kurumun sağladığı parola yöneticisinde saklanan' },
        ],
      },
    },
  },
  {
    id: 's06-mfa',
    sectionId: 6,
    paragraphIndex: 2,
    title: 'Çok faktörlü doğrulama talebi',
    image_prompt:
      'Bir çalışanın elindeki telefonda çok faktörlü doğrulama onay bildirimi; “Onayla” ve “Reddet” düğmeleri net görünüyor, çalışan düşünceli, kurumsal ofis ortamı, gerçekçi siber güvenlik eğitim görseli.',
    image_description: 'Telefon ekranında oturum açma onay bildirimi; Reddet ve Onayla düğmeleri. Not: yalnızca işlemi siz başlattıysanız onaylayın.',
    purpose: 'MFA bildiriminin yalnızca kullanıcının başlattığı işlemde onaylanacağını vurgulamak.',
    render: {
      kind: 'phone',
      app: 'Kimlik Doğrulama',
      lines: ['Oturum açma isteği', 'Bu işlemi siz mi başlattınız?'],
      actions: ['Reddet', 'Onayla'],
      note: 'Doğrulama talebini yalnızca işlemi siz başlattıysanız onaylayın.',
    },
  },
  {
    id: 's07-hassas-veri',
    sectionId: 7,
    paragraphIndex: 0,
    title: 'Hassas veri kapsamında değerlendirilebilecek bilgiler',
    image_prompt:
      'Kişisel veri, finansal veri, müşteri kaydı, sözleşme ve kaynak kodu gibi hassas veri türlerini kilit ikonlu dosya kartlarıyla gösteren kurumsal bilgi güvenliği eğitim infografiği, lacivert tonlar, temiz stil.',
    image_description:
      'Dokuz kart: kişisel veriler, müşteri kayıtları, çalışan bilgileri, finansal veriler, sözleşmeler, fiyatlandırmalar, ticari sırlar, kaynak kodları ve erişim bilgileri.',
    purpose: 'Hassas veri türlerini somutlaştırmak.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'user', label: 'Kişisel veriler', tone: 'info' },
        { icon: 'briefcase', label: 'Müşteri kayıtları', tone: 'info' },
        { icon: 'users', label: 'Çalışan bilgileri', tone: 'info' },
        { icon: 'banknote', label: 'Finansal veriler', tone: 'info' },
        { icon: 'fileText', label: 'Sözleşmeler', tone: 'info' },
        { icon: 'tag', label: 'Fiyatlandırmalar', tone: 'info' },
        { icon: 'lock', label: 'Ticari sırlar', tone: 'info' },
        { icon: 'code', label: 'Kaynak kodları', tone: 'info' },
        { icon: 'key', label: 'Erişim bilgileri', tone: 'info' },
      ],
    },
  },
  {
    id: 's07-aktarim',
    sectionId: 7,
    paragraphIndex: 2,
    title: 'Güvenli dosya aktarımı',
    image_prompt:
      'Şifreli bir dosyanın kurumun onaylı aktarım sistemi üzerinden gönderildiği, parolanın ise ayrı bir kanaldan iletildiği iki hatlı akış diyagramı; kurumsal bilgi güvenliği eğitim görseli, modern ve sade.',
    image_description: 'Dört adım: alıcıyı kontrol et, onaylı güvenli kanalı kullan, şifreleme veya parola koruması uygula, parolayı farklı bir kanaldan paylaş.',
    purpose: 'Hassas veri aktarımındaki adımları sırayla göstermek.',
    render: {
      kind: 'flow',
      steps: [
        { icon: 'search', label: 'Alıcının kimliğini, e-posta adresini ve erişim yetkisini kontrol edin' },
        { icon: 'send', label: 'Onaylanmış güvenli aktarım kanalını kullanın' },
        { icon: 'lock', label: 'Gerekiyorsa şifreleme veya parola koruması uygulayın' },
        { icon: 'key', label: 'Parolayı farklı bir kanal üzerinden paylaşın' },
      ],
    },
  },
  {
    id: 's07-yasam-dongusu',
    sectionId: 7,
    paragraphIndex: 3,
    title: 'Verinin yaşam döngüsü',
    image_prompt:
      'Verinin oluşturma, kullanma, aktarma, saklama, dağıtma ve imha aşamalarını dairesel bir döngüde gösteren kurumsal bilgi güvenliği infografiği; son aşamada kâğıt imha makinesi, temiz ve modern stil.',
    image_description: 'Altı aşamalı akış: oluşturma, kullanma, aktarma, saklama, dağıtma ve imha.',
    purpose: 'Verinin tüm aşamalarda korunması gerektiğini göstermek.',
    render: {
      kind: 'flow',
      steps: [
        { icon: 'filePlus', label: 'Oluşturma' },
        { icon: 'eye', label: 'Kullanma' },
        { icon: 'send', label: 'Aktarma' },
        { icon: 'archive', label: 'Saklama' },
        { icon: 'users', label: 'Dağıtma' },
        { icon: 'trash', label: 'İmha' },
      ],
      note: 'Veri, bu aşamaların tamamında korunmalıdır.',
    },
  },
  {
    id: 's08-olay-kartlari',
    sectionId: 8,
    paragraphIndex: 2,
    title: 'Bilgi güvenliği olayı örnekleri',
    image_prompt:
      'Şüpheli e-posta, yanlış kişiye gönderim, kayıp cihaz ve zararlı yazılım uyarısı durumlarını gösteren dört sahneli kurumsal olay bildirimi eğitim görseli; her sahnede çalışan olayı bildirmek üzere telefona uzanıyor, gerçekçi stil.',
    image_description:
      'Sekiz olay kartı: şüpheli e-posta, yanlış alıcıya gönderim, kayıp cihaz, zararlı yazılım uyarısı, yetkisiz erişim, parola paylaşımı, veri sızıntısı ve olağandışı sistem davranışı.',
    purpose: 'Hangi durumların bildirilmesi gereken olay olduğunu göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'mail', label: 'Şüpheli e-posta', tone: 'risk' },
        { icon: 'send', label: 'Yanlış alıcıya gönderim', tone: 'risk' },
        { icon: 'laptop', label: 'Kayıp cihaz', tone: 'risk' },
        { icon: 'bug', label: 'Zararlı yazılım uyarısı', tone: 'risk' },
        { icon: 'userX', label: 'Yetkisiz erişim', tone: 'risk' },
        { icon: 'key', label: 'Parola paylaşımı', tone: 'risk' },
        { icon: 'leak', label: 'Veri sızıntısı', tone: 'risk' },
        { icon: 'activity', label: 'Olağandışı sistem davranışı', tone: 'risk' },
      ],
    },
  },
  {
    id: 's09-senaryolar',
    sectionId: 9,
    paragraphIndex: 2,
    title: 'Masa başı tatbikat senaryoları',
    image_prompt:
      'Toplantı odasında teknik ekip, İnsan Kaynakları, hukuk, iletişim ve yönetim temsilcilerinin bir olay senaryosunu masa başında çalıştığı; ekranda olay akışı görünen kurumsal siber tatbikat görseli, gerçekçi stil.',
    image_description: 'Beş senaryo kartı: kayıp cihaz, fidye yazılımı, yanlış alıcıya veri gönderimi, hesap ele geçirilmesi ve hizmet kesintisi.',
    purpose: 'Masa başı tatbikatlarda ele alınabilecek senaryoları göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'laptop', label: 'Kayıp cihaz', tone: 'info' },
        { icon: 'lock', label: 'Fidye yazılımı', tone: 'info' },
        { icon: 'send', label: 'Yanlış alıcıya veri gönderimi', tone: 'info' },
        { icon: 'userX', label: 'Hesap ele geçirilmesi', tone: 'info' },
        { icon: 'plug', label: 'Hizmet kesintisi', tone: 'info' },
      ],
    },
  },
  {
    id: 's10-yazilimlar',
    sectionId: 10,
    paragraphIndex: 2,
    title: 'Zararlı kod içerebilecek yazılımlar',
    image_prompt:
      'İnternetten indirilen ücretsiz PDF dönüştürme aracının kurulum penceresi ve arka planda dışarı aktarılan parola simgeleri; onaysız yazılım riskini anlatan kurumsal siber güvenlik eğitim görseli, gerçekçi stil.',
    image_description:
      'Beş risk kartı: lisanssız yazılımlar, kırılmış programlar, oyunlar, ekran koruyucular ve ücretsiz dönüştürme araçları. Doğru davranış: yazılım ihtiyacını Bilgi Teknolojileri birimine iletmek.',
    purpose: 'Onaysız yazılım türlerini ve doğru talep yolunu göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'fileX', label: 'Lisanssız yazılımlar', tone: 'risk' },
        { icon: 'key', label: 'Kırılmış programlar', tone: 'risk' },
        { icon: 'gamepad', label: 'Oyunlar', tone: 'risk' },
        { icon: 'image', label: 'Ekran koruyucular', tone: 'risk' },
        { icon: 'refresh', label: 'Ücretsiz dönüştürme araçları', tone: 'risk' },
        { icon: 'check', label: 'Doğru yol', note: 'Yazılıma ihtiyaç duyulması hâlinde Bilgi Teknolojileri birimine talep iletilmelidir.', tone: 'safe' },
      ],
    },
  },
  {
    id: 's11-adres',
    sectionId: 11,
    paragraphIndex: 1,
    title: 'İnternet adresini kontrol edin',
    image_prompt:
      'Tarayıcı adres çubuğunun yakın çekimi; gerçek bulut hizmeti adresi ile harf değişikliği içeren sahte giriş sayfası adresi yan yana, sahte olanda sertifika uyarısı görünüyor, kurumsal siber güvenlik eğitim görseli.',
    image_description: 'İki sütun: gerçek kurum adresi ve gerçek bir bulut hizmetine benzeyen, harf değişikliği içeren ve sertifika uyarısı veren sahte giriş sayfası adresi.',
    purpose: 'Sahte giriş sayfalarının adres ve sertifika uyarısıyla ayırt edilmesini göstermek.',
    render: {
      kind: 'compare',
      left: {
        tone: 'safe',
        heading: 'Gerçek adres',
        lines: [{ text: 'https://bulut.ornekkurum.com.tr', mono: true }],
      },
      right: {
        tone: 'risk',
        heading: 'Sahte giriş sayfası',
        lines: [
          { text: 'https://bulut-ornekkururn.com/giris', mono: true, mark: 'harf değişikliği' },
          { text: 'Tarayıcı sertifika uyarısı veriyor', mark: 'geçerek devam etmeyin' },
        ],
      },
    },
  },
  {
    id: 's11-cevrim-ici',
    sectionId: 11,
    paragraphIndex: 2,
    title: 'Önce izin kontrolü gereken hizmetler',
    image_prompt:
      'Çalışanın bir müşteri sözleşmesini ücretsiz yapay zekâ sohbet aracına sürükleyip bırakmak üzere olduğu, ekranda “kurum onayı var mı?” uyarısının belirdiği kurumsal bilgi güvenliği eğitim görseli, gerçekçi stil.',
    image_description: 'Beş kart: ücretsiz dosya paylaşım, çeviri, metin özetleme, görsel oluşturma ve yapay zekâ uygulamaları.',
    purpose: 'Kurumsal veriyi yüklemeden önce izin kontrolü gereken hizmet türlerini göstermek.',
    render: {
      kind: 'cards',
      items: [
        { icon: 'cloud', label: 'Dosya paylaşım', tone: 'risk' },
        { icon: 'languages', label: 'Çeviri', tone: 'risk' },
        { icon: 'notes', label: 'Metin özetleme', tone: 'risk' },
        { icon: 'image', label: 'Görsel oluşturma', tone: 'risk' },
        { icon: 'sparkles', label: 'Yapay zekâ uygulamaları', tone: 'risk' },
      ],
    },
  },
  {
    id: 's12-kisisel-veri',
    sectionId: 12,
    paragraphIndex: 1,
    title: 'Kişisel veri ve özel nitelikli kişisel veri',
    image_prompt:
      'Kimlik kartı, telefon, e-posta ve kamera görüntüsü ikonlarının bir yanda; sağlık, biyometri ve adli kayıt ikonlarının ek kilitle diğer yanda gösterildiği KVKK farkındalık infografiği, kurumsal ve sade stil.',
    image_description:
      'İki sütun: kişisel veri niteliğinde olabilecek bilgiler (ad, telefon, e-posta, kimlik, özlük, kamera görüntüsü, sağlık bilgileri) ve daha sıkı korunması gereken özel nitelikli kişisel veriler (sağlık bilgileri, biyometrik veriler, ceza mahkûmiyeti bilgileri).',
    purpose: 'Kişisel veri ile özel nitelikli kişisel veri örneklerini ayırmak.',
    render: {
      kind: 'compare',
      left: {
        tone: 'info',
        heading: 'Kişisel veri niteliğinde olabilir',
        lines: [
          { text: 'Ad, telefon, e-posta' },
          { text: 'Kimlik, özlük' },
          { text: 'Kamera görüntüsü' },
          { text: 'Sağlık bilgileri' },
        ],
      },
      right: {
        tone: 'risk',
        heading: 'Özel nitelikli – daha sıkı korunmalı',
        lines: [{ text: 'Sağlık bilgileri' }, { text: 'Biyometrik veriler' }, { text: 'Ceza mahkûmiyeti bilgileri' }],
      },
    },
  },
  {
    id: 's13-tedarikci',
    sectionId: 13,
    paragraphIndex: 1,
    title: 'Tedarikçi erişiminin yaşamı',
    image_prompt:
      'Bakım için gelen tedarikçi personeline geçici erişim kartı ve VPN hesabı verilmesi, iş bitince kartın iade edilip hesabın kapatılması; iki kareli kurumsal bilgi güvenliği eğitim görseli, gerçekçi stil.',
    image_description: 'Dört adım: erişim sözleşme ve görev tanımıyla sınırlıdır, erişim bilgisi paylaşılmaz, iş tamamlanır, geçici hesaplar ile uzaktan ve fiziksel erişimler kapatılır.',
    purpose: 'Tedarikçi erişiminin görevle sınırlı ve geçici olduğunu göstermek.',
    render: {
      kind: 'flow',
      steps: [
        { icon: 'fileText', label: 'Erişim, sözleşme ve görev tanımındaki ihtiyaçla sınırlı' },
        { icon: 'key', label: 'Erişim bilgisi başka çalışanlarla paylaşılmaz' },
        { icon: 'check', label: 'İş tamamlanır' },
        { icon: 'doorClosed', label: 'Geçici hesaplar, uzaktan bağlantılar ve fiziksel erişimler kapatılır' },
      ],
    },
  },
  {
    id: 's14-delil',
    sectionId: 14,
    paragraphIndex: 2,
    title: 'Olay sırasında: yapmayın ve koruyun',
    image_prompt:
      'Çalışanın şüpheli e-postayı silmek yerine ekran görüntüsünü alıp olay bildirim formuna eklediği; ekranda olay saati ve cihaz bilgisi alanları görünen kurumsal olay yönetimi eğitim görseli, gerçekçi stil.',
    image_description:
      'İki sütun: yapılmaması gerekenler (e-postayı silmek, cihazı formatlamak, günlük kayıtlarını değiştirmek, saldırganla iletişime geçmek) ve korunması gereken bilgiler (ekran görüntüsü, mesaj, dosya adı, cihaz bilgisi, olay saati).',
    purpose: 'Delillerin korunmasına ilişkin kuralları göstermek.',
    render: {
      kind: 'compare',
      left: {
        tone: 'risk',
        heading: 'Yapmayın',
        lines: [
          { text: 'Şüpheli e-postayı silmeyin' },
          { text: 'Cihazı formatlamayın' },
          { text: 'Günlük kayıtlarını değiştirmeyin' },
          { text: 'Saldırganla iletişime geçmeyin' },
        ],
      },
      right: {
        tone: 'safe',
        heading: 'Koruyun',
        lines: [
          { text: 'Ekran görüntüsü' },
          { text: 'Mesaj ve dosya adı' },
          { text: 'Cihaz bilgisi' },
          { text: 'Olay saati' },
        ],
      },
    },
  },
];
