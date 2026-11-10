@echo off
title Statistics Story AI - Mobile Runner
echo ===================================================
echo   STATISTICS STORY AI - FLUTTER MOBILE APP
echo ===================================================
echo.

set "ADB_BIN=adb"
where adb >nul 2>&1
if errorlevel 1 (
  if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe" (
    set "ADB_BIN=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"
  )
)

echo [1/3] Menyiapkan tunnel kabel USB ke HP (ADB Reverse)...
"%ADB_BIN%" reverse tcp:8080 tcp:8080
"%ADB_BIN%" reverse tcp:8000 tcp:8000
echo Tunnel USB Port 8080 dan 8000 aktif!
echo.

cd mobile
echo [2/3] Memeriksa dependensi Flutter...
call flutter pub get
echo.

echo [3/3] Menjalankan Flutter App pada PORT 8080...
echo ===================================================
echo   CARA MELIHAT DI HP ANDA VIA KABEL USB:
echo   1. Buka browser Chrome di HP Anda
echo   2. Ketik alamat: http://localhost:8080
echo ===================================================
echo.
call flutter run -d chrome --web-port 8080
pause
