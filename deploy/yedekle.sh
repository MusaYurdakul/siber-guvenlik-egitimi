#!/usr/bin/env bash
# Eğitim verilerinin (hesaplar, ilerleme, sınav ve tamamlanma kayıtları) sıkıştırılmış yedeğini alır.
# Her gece cron ile çalışır; 30 günden eski yedekler silinir. Elle:  egitim-yedekle
set -euo pipefail

DATA=/var/lib/egitim
BACKUP=/var/backups/egitim

mkdir -p "$BACKUP"
chmod 700 "$BACKUP"
FILE="$BACKUP/egitim-$(date +%Y-%m-%d-%H%M).tar.gz"
tar -czf "$FILE" -C "$DATA" --exclude='*.tmp' .
chmod 600 "$FILE"
find "$BACKUP" -name 'egitim-*.tar.gz' -mtime +30 -delete
echo "Yedek alındı: $FILE"
