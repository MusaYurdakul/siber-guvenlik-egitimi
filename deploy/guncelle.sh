#!/usr/bin/env bash
# Yeni sürümü /opt/egitim'e yerleştirir ve servisi yeniden başlatır.
# Veriler (/var/lib/egitim) etkilenmez; güncellemeden önce yedek alınır. Yeni sürüm açılmazsa eski sürüme döner.
# Kullanım (root olarak):  bash egitim-paket/deploy/guncelle.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Bu betik root olarak çalıştırılmalı:  sudo bash $0"
  exit 1
fi

PKG="$(cd "$(dirname "$0")/.." && pwd)"
APP=/opt/egitim
NEW=/opt/egitim.yeni
OLD=/opt/egitim.eski

if [[ ! -f "$PKG/dist/index.html" || ! -f "$PKG/server/index.mjs" ]]; then
  echo "Paket eksik: $PKG içinde dist/ veya server/ bulunamadı."
  exit 1
fi

# İlk kurulumda yedek ve yeniden başlatma yapılmaz.
FIRST_INSTALL=0
[[ "${1:-}" == "--kurulum" ]] && FIRST_INSTALL=1

if [[ $FIRST_INSTALL -eq 0 ]]; then
  echo "==> Güncelleme öncesi yedek"
  /usr/local/bin/egitim-yedekle
fi

rm -rf "$NEW"
mkdir -p "$NEW"
cp -r "$PKG/dist" "$PKG/server" "$PKG/deploy" "$NEW/"
rm -rf "$NEW/server/data"
chown -R root:root "$NEW"
chmod -R u=rwX,go=rX "$NEW"

rm -rf "$OLD"
[[ -d "$APP" ]] && mv "$APP" "$OLD"
mv "$NEW" "$APP"

if [[ $FIRST_INSTALL -eq 1 ]]; then
  echo "Uygulama dosyaları yerleştirildi."
  exit 0
fi

systemctl restart egitim
sleep 3
if systemctl is-active --quiet egitim && curl -fsS -o /dev/null http://127.0.0.1:8797/api/me; then
  echo "Güncelleme tamamlandı."
else
  echo "Yeni sürüm başlatılamadı; eski sürüme dönülüyor."
  journalctl -u egitim -n 30 --no-pager || true
  if [[ -d "$OLD" ]]; then
    rm -rf "$APP"
    mv "$OLD" "$APP"
    systemctl restart egitim
  fi
  exit 1
fi
