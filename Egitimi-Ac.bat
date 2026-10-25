@echo off
rem Egitimi tek tikla acar: gerekirse kurar/derler, sunucuyu baslatir ve tarayiciyi acar.
cd /d "%~dp0"
chcp 65001 >nul
title Siber Guvenlik Farkindalik Egitimi - Sunucu

rem Zip icinden dogrudan calistirildiysa proje dosyalari yanimizda olmaz.
if not exist "%~dp0package.json" (
  echo.
  echo Bu dosya, zip icinden dogrudan calistirilmis gorunuyor.
  echo Once zip dosyasina sag tiklayip "Tumunu ayikla" deyin,
  echo sonra ayiklanan klasordeki Egitimi-Ac.bat dosyasini calistirin.
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kurup bu dosyayi yeniden calistirin.
  pause
  exit /b 1
)

rem Egitim zaten aciksa ikinci bir sunucu baslatmadan tarayiciyi ac.
rem (Windows 10/11 ile gelen curl kullanilir; netstat ciktisi dile gore degistigi icin kullanilmaz.)
curl.exe -s -o nul --max-time 2 http://localhost:8797/api/me
if not errorlevel 1 (
  echo Egitim sunucusu zaten calisiyor; tarayici aciliyor.
  start "" http://localhost:8797
  timeout /t 3 /nobreak >nul
  exit /b 0
)

rem Derlenmis site (dist) pakette hazir gelir; sunucu icin ek kurulum gerekmez.
rem Yalnizca dist yoksa (kaynak kod degistirilip silindiyse) paketler indirilip site derlenir.
if not exist dist\index.html (
  if not exist node_modules (
    echo Ilk kurulum: gerekli paketler indiriliyor ^(internet gerekir, birkac dakika surebilir^)...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
      echo Paketler indirilemedi. Internet baglantisini kontrol edip yeniden deneyin.
      pause
      exit /b 1
    )
  )
  echo Site derleniyor...
  call npm run build
  if errorlevel 1 (
    echo Derleme basarisiz oldu.
    pause
    exit /b 1
  )
)

echo.
echo Egitim sunucusu baslatiliyor. Calisanlar asagidaki "Agdaki bilgisayarlarda" adresinden girer.
echo Windows Guvenlik Duvari sorarsa "Erisime izin ver" deyin; aksi halde diger bilgisayarlar baglanamaz.
echo Kapatmak icin bu pencereyi kapatin.
echo.

rem Sunucu ayaga kalkinca tarayiciyi ac.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8797"
node server\index.mjs
pause
