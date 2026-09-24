@echo off
chcp 65001 >nul
title Refleks Arenası - Sunucu ve İstemci Başlatıcı
cd /d "%~dp0"

echo ===================================================
echo   🎮 REFLEKS ARENASI BAŞLATILIYOR...
echo   Klasör: %cd%
echo ===================================================
echo.

echo [1/2] Gerekli paketler kontrol ediliyor...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [HATA] npm install sırasında bir hata oluştu! Lütfen Node.js'in yüklü olduğundan emin olun.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Oyun sunucusu ve istemcisi başlatılıyor (npm run dev)...
echo.
echo 💻 PC Stand Ekranı: http://localhost:5173
echo 📱 Telefon Katılımı: QR kodu stand ekranından okutun!
echo 🌐 Herkese Açık Tünel (HTTPS) otomatik olarak başlatılacaktır.
echo.
echo ---------------------------------------------------
echo Çıkmak için bu pencereyi kapatabilir veya Ctrl+C yapabilirsiniz.
echo ---------------------------------------------------
echo.

call npm run dev
pause
