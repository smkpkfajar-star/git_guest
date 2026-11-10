@echo off
chcp 65001 >nul
cd /d "%~dp0"
title GIT QUEST - jangan ditutup selama bermain
echo ==============================================
echo   GIT QUEST - The Repository Chronicles
echo ==============================================
echo.
where python >nul 2>&1
if %errorlevel%==0 goto usepython
where py >nul 2>&1
if %errorlevel%==0 goto usepy
echo Python tidak ditemukan. Membuka game langsung di browser...
start "" "%~dp0index.html"
exit /b

:usepython
echo Game berjalan di http://localhost:8000/
echo Tutup jendela ini untuk menghentikan game.
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:8000/"
python -m http.server 8000
exit /b

:usepy
echo Game berjalan di http://localhost:8000/
echo Tutup jendela ini untuk menghentikan game.
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:8000/"
py -m http.server 8000
exit /b
