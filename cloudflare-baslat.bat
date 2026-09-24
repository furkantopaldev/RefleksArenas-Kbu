@echo off
chcp 65001 >nul
title Cloudflare Tüneli - Refleks Arenası
cd /d "%~dp0"

echo ===================================================
echo   🌐 CLOUDFLARE HTTPS TÜNELİ BAŞLATILIYOR...
echo ===================================================
echo.
echo Telefonların 4G/5G'den bile anında bağlanması için
echo Cloudflare HTTPS tüneli açılıyor...
echo.

npx untun --port 5173
pause
