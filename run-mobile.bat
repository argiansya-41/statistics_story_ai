@echo off
echo ===================================================
echo   STATISTICS STORY AI - FLUTTER MOBILE APP
echo ===================================================
echo.
cd mobile
echo [1/2] Memeriksa dependensi Flutter...
call flutter pub get
echo.
echo [2/2] Menjalankan Flutter App...
echo (Pilih device: Chrome / Edge / Windows / Emulator Android)
echo.
call flutter run
pause

