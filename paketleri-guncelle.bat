@echo off
chcp 65001 >nul
title Cloudflare ve Paket Güncelleyici
cd /d "%~dp0"

echo ===================================================
echo   📦 UNTUN / CLOUDFLARE PAKETİ YÜKLENİYOR...
echo ===================================================
echo.

call npm install untun localtunnel --save
echo.
echo Paketler yüklendi! Oyun başlatılıyor...
echo.

call npm run dev
pause
