// Bölüm başına arayüz meta verisi. Açıklamalar ve vurgular kaynak belgedeki ifadelere dayanır;
// kaynak metnin yerine geçmez, yalnızca modül başlığı ve bölüm sonu vurgusu olarak gösterilir.
export interface SectionMeta {
  description: string;
  highlights: string[];
  quizTags: string[];
}

export const sectionMeta: Record<number, SectionMeta> = {
  1: {
    description: 'Bilgi güvenliğinin amacı, gizlilik–bütünlük–erişilebilirlik ve günlük siber hijyen davranışları.',
    highlights: [
      'Bilgilerin korunması kurum adına işlem yapan herkesin ortak sorumluluğudur.',
      'Amaç bilginin gizliliğini, bütünlüğünü ve erişilebilirliğini sağlamaktır.',
      'Temel kural: Durun, doğrulayın, koruyun ve bildirin.',
    ],
    quizTags: ['temel-kavramlar', 'siber-hijyen'],
  },
  2: {
    description: 'Phishing, smishing ve vishing saldırıları; kullanılan duygular ve doğrulama adımları.',
    highlights: [
      'Saldırılarda aciliyet, korku, merak, ödül veya otorite duygusu kullanılır.',
      'Talepleri mesajdaki numaradan değil, bildiğiniz farklı bir kanaldan doğrulayın.',
      'Yanlışlıkla tıkladıysanız gizlemeyin; erken bildirim etkiyi sınırlandırır.',
    ],
    quizTags: ['sosyal-muhendislik', 'phishing'],
  },
  3: {
    description: 'Gönderici ve bağlantı kontrolü, şüpheli ekler, doğru alıcıya ve güvenli yöntemle gönderim.',
    highlights: [
      'Görünen gönderici adına değil, gerçek e-posta adresine bakın.',
      'Yanlış kişiye gönderilen bir dosya da bilgi güvenliği olayıdır.',
      'Dosya parolası, dosyanın gönderildiği aynı e-posta içinde paylaşılmaz.',
    ],
    quizTags: ['e-posta', 'yanlis-gonderim'],
  },
  4: {
    description: 'USB belleklerin riskleri, onaylı kaynaklardan indirme ve onaylanmamış çevrim içi hizmetler.',
    highlights: [
      'Kaynağı bilinmeyen veya yerde bulunan USB belleği kurum cihazına takmayın.',
      'Yazılım, eklenti ve dosyaları yalnızca onaylı kaynaklardan indirin.',
      'Sahte uyarılara tıklamayın; ekran görüntüsü alarak Bilgi Teknolojileri birimine bildirin.',
    ],
    quizTags: ['usb', 'guvenli-internet'],
  },
  5: {
    description: 'Sosyal medya paylaşımlarındaki riskler ve şahsi cihazların (BYOD) kurum işlerinde kullanımı.',
    highlights: [
      'Çalışma alanı fotoğraflarındaki ekranlar, kartlar ve belgeler risk oluşturabilir.',
      'BYOD yalnızca kurumun izin verdiği koşullarda gerçekleştirilmelidir.',
      'Kurumsal dosyaları kişisel e-posta, kişisel bulut veya onaylanmamış uygulamalara göndermeyin.',
    ],
    quizTags: ['sosyal-medya', 'byod'],
  },
  6: {
    description: 'Kişisel hesaplar, güçlü ve benzersiz parolalar, çok faktörlü doğrulama ve ekran kilidi.',
    highlights: [
      'Parolalar uzun, tahmin edilmesi zor ve her hesap için benzersiz olmalıdır.',
      'Doğrulama talebini yalnızca işlemi siz başlattıysanız onaylayın.',
      'Hesap kişiseldir, erişim görevle sınırlıdır ve doğrulama bilgisi gizlidir.',
    ],
    quizTags: ['parola', 'mfa'],
  },
  7: {
    description: 'Hassas verinin tanımı, erişim, saklama, güvenli aktarım ve imha kuralları.',
    highlights: [
      'Veriye yalnızca göreviniz için gerekli olduğu ölçüde erişin.',
      'Onaylanmış güvenli aktarım kanallarını kullanın; parolayı farklı bir kanaldan paylaşın.',
      'Veri; oluşturmadan imhaya kadar yaşam döngüsünün tamamında korunmalıdır.',
    ],
    quizTags: ['hassas-veri', 'veri-aktarimi'],
  },
  8: {
    description: 'Temiz masa ve temiz ekran, uzaktan çalışma güvenliği ve bilgi güvenliği olaylarının bildirimi.',
    highlights: [
      'Çalışma alanından ayrılırken ekranı kilitleyin, belgeleri kapalı dolaplarda saklayın.',
      'Halka açık kablosuz ağlar güvenilir olmayabilir; yalnızca güvenli bağlantı yöntemlerini kullanın.',
      'Olayda kendi başınıza inceleme yapmayın; işlemi durdurun ve bildirim kanalına başvurun.',
    ],
    quizTags: ['temiz-masa', 'uzaktan-calisma', 'olay-bildirimi'],
  },
  9: {
    description: 'Phishing simülasyonları ve masa başı tatbikatların amacı, kapsamı ve sonuçların kullanımı.',
    highlights: [
      'Amaç cezalandırmak değil; zayıf noktaları belirlemek ve doğru davranışları pekiştirmektir.',
      'Sonuçlar, hangi konularda ek eğitim gerektiğini anlamak için kullanılır.',
      'Tatbikatlar periyodik olarak tekrarlanmalı ve sonuçlar kayıt altına alınmalıdır.',
    ],
    quizTags: ['tatbikat', 'simulasyon'],
  },
  10: {
    description: 'Kurumsal cihazların korunması, güvenlik güncellemeleri ve onaysız yazılımların riskleri.',
    highlights: [
      'Antivirüs, güvenlik duvarı veya güncelleme sistemi kullanıcı tarafından devre dışı bırakılmamalıdır.',
      'Güvenlik güncellemeleri zamanında kurulmalıdır.',
      'Olağandışı belirtilerde cihazı kullanmaya devam etmeyin; Bilgi Teknolojileri birimine bildirin.',
    ],
    quizTags: ['bilgisayar-guvenligi', 'yazilim'],
  },
  11: {
    description: 'Sahte siteler, adres ve sertifika kontrolü, çevrim içi hizmetlere veri yükleme ve halka açık ağlar.',
    highlights: [
      'Bir sitenin profesyonel görünmesi güvenli olduğu anlamına gelmez.',
      'Tarayıcının sertifika uyarısını geçerek siteye devam etmeyin.',
      'Kurumsal veriyi yüklemeden önce kurumun ilgili hizmete izin verip vermediğini kontrol edin.',
    ],
    quizTags: ['internet-guvenligi', 'yapay-zeka'],
  },
  12: {
    description: 'Mevzuat, sözleşme ve gizlilik yükümlülükleri ile 6698 sayılı KVKK kapsamında kişisel veriler.',
    highlights: [
      'Teknik olarak yapılabilen bir işlem, hukuken ve kurumsal olarak izinli olmayabilir.',
      'Kişisel veriler belirli, açık ve meşru amaçlarla; sınırlı ve ölçülü şekilde işlenmelidir.',
      'Emin olmadığınızda yöneticinize, KVKK sorumlusuna, hukuk birimine ya da belirlenen yetkiliye danışın.',
    ],
    quizTags: ['kvkk', 'yasal-sorumluluk'],
  },
  13: {
    description: 'Tedarikçi, taşeron ve danışmanların erişim sınırları, veri kullanımı ve olay bildirimi.',
    highlights: [
      'Tedarikçi erişimi sözleşmede ve görev tanımında belirtilen ihtiyaçla sınırlıdır.',
      'İş tamamlandığında geçici hesaplar, uzaktan bağlantılar ve fiziksel erişimler kapatılmalıdır.',
      'Kurum verisi yalnızca hizmetin yürütülmesi amacıyla kullanılır; izinsiz aktarılamaz.',
    ],
    quizTags: ['tedarikci', 'ucuncu-taraf'],
  },
  14: {
    description: 'İhlal olayının tanımı, örnekleri, delillerin korunması ve bildirimin amacı.',
    highlights: [
      'Emin olmayı beklemeden şüpheli durumlar da bildirilmelidir.',
      'İşlemi durdurun, ancak delilleri yok etmeyin.',
      'Bildirimin amacı suçlu bulmak değil, zararı sınırlamak ve tekrarını önlemektir.',
    ],
    quizTags: ['ihlal-yonetimi', 'delil'],
  },
  15: {
    description: 'Eğitim boyunca ele alınan güvenli davranışların toplu özeti ve dört adım.',
    highlights: [
      'Güvenlik davranışları tehditler ve sistemler değiştikçe güncel tutulmalıdır.',
      'Göndereni ve talebi farklı bir kanaldan doğrulayın.',
      'Dört adım: Durun, doğrulayın, koruyun ve bildirin.',
    ],
    quizTags: ['ozet', 'dort-adim'],
  },
};
