# Kiralık sunucuya kurulum

Eğitim, alan adıyla ve HTTPS ile kiralık bir Linux sunucuda yayınlanır. Kurulum tek betikle yapılır;
sunucuda elle program kurmanız gerekmez.

## 1. Gerekenler

| Kalem | Öneri |
| --- | --- |
| Sunucu (VPS) | **Ubuntu 24.04**, 1–2 vCPU, 2 GB RAM, 20 GB disk (100 kişi için fazlasıyla yeterli) |
| Erişim | Sunucu firmasının verdiği **IP adresi** ve **root şifresi** |
| Alan adı | Yeni bir alan adı ya da şirketin mevcut alan adında bir alt alan adı (ör. `egitim.sirketadi.com.tr`) |

**KVKK notu:** Sunucuda çalışanların adı, birimi ve sınav sonuçları tutulur. Sunucunun yurt dışında olması
KVKK kapsamında ek yükümlülük doğurur; Türkiye'de barındırılan bir sunucu bu açıdan daha sade olur.
Seçimden önce şirketin KVKK sorumlusuna danışın.

## 2. Alan adını sunucuya yönlendirin

Alan adını aldığınız yerin DNS ayarlarında bir **A kaydı** ekleyin:

| Tür | Ad | Değer |
| --- | --- | --- |
| A | `egitim` (alt alan adı için) ya da `@` (alan adının kendisi için) | sunucunun IP adresi |

Kaydın yayılması birkaç dakika ile birkaç saat sürebilir. Bu adım bitmeden HTTPS sertifikası alınamaz.

## 3. Paketi hazırlayın (kendi bilgisayarınızda)

Proje klasöründe:

```bash
npm run paket
```

Klasörde `egitim-paket.tar.gz` oluşur.

## 4. Paketi sunucuya gönderin ve kurun

Windows'ta PowerShell'i proje klasöründe açın (`SUNUCU_IP` yerine sunucunun IP adresini yazın):

```bash
scp egitim-paket.tar.gz root@SUNUCU_IP:/root/
```

```bash
ssh root@SUNUCU_IP
```

Sunucuya bağlandıktan sonra (alan adını kendi adresinizle değiştirin):

```bash
tar -xzf egitim-paket.tar.gz && bash egitim-paket/deploy/kurulum.sh egitim.sirketadi.com.tr
```

Betik sonunda **ilk yönetici hesabını** sorar: kullanıcı adı, ad soyad ve şifre. Kurulum bitince
`https://egitim.sirketadi.com.tr` adresinden yönetici olarak girip çalışan hesaplarını açabilirsiniz.

Kurulumun yaptıkları:

- Node.js 24 LTS ve Caddy kurulur; Caddy HTTPS sertifikasını otomatik alır ve yeniler.
- Uygulama `/opt/egitim` altına, veriler `/var/lib/egitim` altına yerleşir; uygulama sistem servisi olarak
  çalışır, sunucu yeniden başlasa da kendiliğinden açılır.
- Güvenlik duvarında yalnızca SSH, 80 ve 443 portları açılır; uygulamaya dışarıdan doğrudan erişilemez.
- Her gece 03:30'da veriler `/var/backups/egitim` altına yedeklenir (30 gün saklanır).

## 5. Güncelleme

Kodda değişiklik olduğunda kendi bilgisayarınızda `npm run paket`, ardından:

```bash
scp egitim-paket.tar.gz root@SUNUCU_IP:/root/
```

Sunucuda:

```bash
rm -rf egitim-paket && tar -xzf egitim-paket.tar.gz && bash egitim-paket/deploy/guncelle.sh
```

Güncelleme öncesi otomatik yedek alınır. Yeni sürüm açılmazsa betik eski sürüme kendiliğinden döner.
Hesaplar, ilerlemeler ve sınav kayıtları güncellemeden etkilenmez.

## 6. Yedekler

Yedekler sunucudadır; sunucu tamamen kaybolursa onlar da gider. Ayda en az bir kez son yedeği kendi
bilgisayarınıza indirin:

```bash
scp "root@SUNUCU_IP:/var/backups/egitim/*.tar.gz" .
```

Yedekte çalışan verileri ve oturum anahtarı vardır; güvenli bir yerde saklayın.

## 7. Sık karşılaşılan durumlar

| Durum | Ne yapılır |
| --- | --- |
| Yönetici şifresi unutuldu | Sunucuda `bash /opt/egitim/deploy/yonetici-olustur.sh` → aynı kullanıcı adını yazıp yeni şifre belirleyin |
| Site açılmıyor | `systemctl status egitim` ve `journalctl -u egitim -n 50` |
| "Bağlantı güvenli değil" / sertifika yok | DNS kaydı sunucuyu gösteriyor mu kontrol edin; `journalctl -u caddy -n 50` |
| Elle yedek almak | `egitim-yedekle` |
| Uygulama hata kaydı | `/var/lib/egitim/error.log` |

## Deneme verisini taşımak (isteğe bağlı)

Kendi bilgisayarınızdaki deneme hesaplarını ve sonuçlarını sunucuya taşımak isterseniz, kurulumdan sonra
proje klasöründeki `server/data` içeriğini sunucuya gönderin:

```bash
scp -r server/data/* root@SUNUCU_IP:/var/lib/egitim/
```

Sunucuda:

```bash
chown -R egitim:egitim /var/lib/egitim && systemctl restart egitim
```

Taşımazsanız sunucu temiz başlar; deneme hesapları sunucuda olmaz.
