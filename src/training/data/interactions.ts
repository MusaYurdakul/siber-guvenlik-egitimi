import type { Interaction } from '../types';

// Bölüm içi mini etkileşimler. Puanları final sınavından ayrı tutulur. Açıklamalar yalnızca kaynak metne dayanır.
export const interactions: Interaction[] = [
  {
    id: 'i-eposta-sec',
    sectionId: 2,
    paragraphIndex: 3,
    title: 'Bu e-postaya tıklar mısın?',
    scenario: 'Gelen kutunuzda iki e-posta var. Hangisi şüpheli?',
    options: [
      {
        id: 'a',
        label: 'E-posta A',
        email: {
          fromName: 'İnsan Kaynakları',
          fromAddress: 'ik@ornekkurum.com.tr',
          subject: 'Yıllık izin planı hatırlatması',
          body: ['Yıllık izin planınızı ay sonuna kadar yöneticinizle birlikte gözden geçirmenizi rica ederiz.'],
        },
      },
      {
        id: 'b',
        label: 'E-posta B',
        email: {
          fromName: 'Genel Müdür',
          fromAddress: 'genelmudur@ornekkurum-yonetim.com',
          subject: 'ACİL – Ödemeyi hemen yapın',
          body: ['Toplantıdayım, arayamıyorum. Ödemeyi hemen yapın; bu konu aramızda kalsın.'],
          linkLabel: 'Ödeme belgesini görüntüle',
          linkUrl: 'http://ornekkurum.odeme-onay.co/giris',
        },
      },
    ],
    correctId: 'b',
    explanation:
      'E-posta B aciliyet ve otorite duygusunu kullanıyor, gizlilik istiyor. Gönderenin adı doğru görünse bile gerçek e-posta adresi farklı; bağlantı ise bilinen adrese benzeyen sahte bir siteye yönlendiriyor. Para transferi taleplerini farklı bir iletişim kanalından doğrulayın ve şüpheli mesajı olay bildirim kanalına iletin.',
  },
  {
    id: 'i-usb',
    sectionId: 4,
    paragraphIndex: 0,
    title: 'USB’yi takar mısın?',
    scenario: 'Otoparkta, üzerinde etiket bulunan bir USB bellek buldunuz. Ne yaparsınız?',
    options: [
      { id: 'a', label: 'Kime ait olduğunu anlamak için kurum bilgisayarıma takarım' },
      { id: 'b', label: 'Kurum cihazına takmam' },
      { id: 'c', label: 'Güvenlik yazılımının taramasını kapatıp hızlıca bakarım' },
    ],
    correctId: 'b',
    explanation:
      'Kaynağı bilinmeyen veya yerde bulunan bir USB belleği kurum cihazına takmayın. USB bellekler zararlı yazılım bulaşması, veri kaybı ve yetkisiz veri aktarımı açısından önemli riskler taşır; güvenlik yazılımının taraması da devre dışı bırakılmamalıdır.',
  },
  {
    id: 'i-veri-nereye',
    sectionId: 5,
    paragraphIndex: 3,
    title: 'Bu veriyi nereye gönderirsin?',
    scenario: 'Üzerinde çalıştığınız kurumsal dosyaya başka bir yerden de erişmeniz gerekiyor. Dosyayı nereye gönderirsiniz?',
    options: [
      { id: 'a', label: 'Kişisel e-posta' },
      { id: 'b', label: 'WhatsApp' },
      { id: 'c', label: 'Onaylı kurum sistemi' },
      { id: 'd', label: 'Kişisel bulut' },
    ],
    correctId: 'c',
    explanation:
      'Kurumsal dosyaları kişisel e-posta hesabınıza, kişisel bulut alanınıza veya onaylanmamış mesajlaşma uygulamalarına göndermeyin. Veriler kurumun onayladığı sistem ve kanallarla paylaşılmalıdır.',
  },
  {
    id: 'i-mfa',
    sectionId: 6,
    paragraphIndex: 2,
    title: 'Bu MFA isteğinde ne yaparsın?',
    scenario: 'Hiçbir işlem başlatmadığınız hâlde telefonunuza arka arkaya doğrulama onay bildirimleri geliyor.',
    options: [
      { id: 'a', label: 'Kabul et' },
      { id: 'b', label: 'Reddet ve bildir' },
      { id: 'c', label: 'Bekle' },
      { id: 'd', label: 'Başka çalışana gönder' },
    ],
    correctId: 'b',
    explanation:
      'Doğrulama talebini yalnızca işlemi siz başlattıysanız onaylayın. Arka arkaya gelen beklenmeyen onay bildirimleri bir saldırı göstergesi olabilir: talepleri reddedin, parolanızı güvenli yöntemle değiştirin ve olayı bildirin.',
  },
  {
    id: 'i-yanlis-gonderim',
    sectionId: 14,
    paragraphIndex: 1,
    title: 'Yanlış adrese gitti. Şimdi ne yaparsın?',
    scenario: 'Müşteri listesini yanlış e-posta adresine gönderdiğinizi fark ettiniz.',
    options: [
      { id: 'a', label: 'Alıcıdan mesajı silmesini ister, konuyu kapatırım' },
      { id: 'b', label: 'Gönderilmiş öğelerden mesajı silerim' },
      { id: 'c', label: 'Olayı ayrıntılarıyla belirlenen birime bildiririm' },
      { id: 'd', label: 'Bir sorun çıkarsa o zaman söylerim' },
    ],
    correctId: 'c',
    explanation:
      'Yalnızca alıcıdan mesajı silmesini istemek yeterli değildir. Olay; gönderilen veri, alıcı, tarih, saat ve yapılan işlemlerle birlikte belirlenen birime bildirilmelidir. Deliller yok edilmemelidir.',
  },
];
