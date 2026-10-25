#!/usr/bin/env bash
# Siber Güvenlik Farkındalık Eğitimi — Ubuntu 24.04 sunucu kurulumu (tek seferlik).
# Kurar: Node.js 24 LTS, Caddy (alan adı için otomatik HTTPS), sistem servisi, günlük yedek, güvenlik duvarı.
# Kullanım (root olarak):  bash egitim-paket/deploy/kurulum.sh egitim.ornek.com.tr
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Kullanım: bash egitim-paket/deploy/kurulum.sh <alan-adı>   (ör. egitim.ornek.com.tr)"
  exit 1
fi
if [[ $EUID -ne 0 ]]; then
  echo "Bu betik root olarak çalıştırılmalı:  sudo bash $0 $DOMAIN"
  exit 1
fi

PKG="$(cd "$(dirname "$0")/.." && pwd)"
DATA=/var/lib/egitim
BACKUP=/var/backups/egitim

echo "==> 1/7 Sistem paketleri"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg ufw debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades

echo "==> 2/7 Node.js 24 LTS"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
node --version

echo "==> 3/7 Caddy (otomatik HTTPS)"
if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "==> 4/7 Uygulama kullanıcısı, klasörler ve dosyalar"
id egitim >/dev/null 2>&1 || useradd --system --home-dir /opt/egitim --no-create-home --shell /usr/sbin/nologin egitim
mkdir -p "$DATA" "$BACKUP"
chown egitim:egitim "$DATA"
chmod 750 "$DATA"
chmod 700 "$BACKUP"
install -m 755 "$PKG/deploy/yedekle.sh" /usr/local/bin/egitim-yedekle
bash "$PKG/deploy/guncelle.sh" --kurulum

echo "==> 5/7 Sistem servisi"
sed "s|__PUBLIC_URL__|https://$DOMAIN|" "$PKG/deploy/egitim.service" > /etc/systemd/system/egitim.service
systemctl daemon-reload
systemctl enable egitim
systemctl restart egitim
sleep 2
systemctl is-active --quiet egitim || { journalctl -u egitim -n 30 --no-pager; echo "Servis başlatılamadı."; exit 1; }

echo "==> 6/7 HTTPS ve güvenlik duvarı"
sed "s|__DOMAIN__|$DOMAIN|" "$PKG/deploy/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl enable caddy
systemctl restart caddy
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 7/7 Günlük yedek (her gece 03:30, 30 gün saklanır)"
echo "30 3 * * * root /usr/local/bin/egitim-yedekle" > /etc/cron.d/egitim-yedek
chmod 644 /etc/cron.d/egitim-yedek

if ! grep -q '"role": "admin"' "$DATA/users.json" 2>/dev/null; then
  echo
  echo "==> İlk yönetici hesabı"
  bash "$PKG/deploy/yonetici-olustur.sh"
fi

echo
echo "Kurulum tamamlandı:  https://$DOMAIN"
echo "HTTPS sertifikası ilk açılışta birkaç dakika içinde otomatik alınır (alan adının bu sunucuyu göstermesi gerekir)."
echo "Durum: systemctl status egitim   |   Kayıtlar: journalctl -u egitim -n 50"
