#!/usr/bin/env bash
# Yönetici hesabı oluşturur ya da unutulan yönetici şifresini yeniler.
# Kullanım (root olarak):  bash /opt/egitim/deploy/yonetici-olustur.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Bu betik root olarak çalıştırılmalı:  sudo bash $0"
  exit 1
fi

# Dosyalar servis kullanıcısına ait kalsın diye betik "egitim" kullanıcısı olarak çalışır.
cd /opt/egitim
sudo -u egitim env TRAINING_DATA_DIR=/var/lib/egitim node /opt/egitim/server/yonetici-olustur.mjs
