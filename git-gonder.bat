@echo off
chcp 65001 >nul
title GitHub'a Gönderici
cd /d "%~dp0"

echo ===================================================
echo   🚀 DEĞİŞİKLİKLER GITHUB'A GÖNDERİLİYOR...
echo ===================================================
echo.

git add .
git commit -m "Update build and socket types"
git push origin main

echo.
if %errorlevel% equ 0 (
    echo ===================================================
    echo  ✅ BAŞARILI! Değişiklikler GitHub'a gönderildi.
    echo  Render şimdi otomatik olarak projeyi yayına alıyor.
    echo ===================================================
) else (
    echo [BILGI] Eğer 'everything up-to-date' dediyse zaten günceldir.
)

echo.
pause
