@echo off
chcp 65001 >nul
title [Gaming Phone] SmartStore - Chay Web va API JSON Server cong 3000

:: Chuyen thu muc lam viec ve dung thu muc chua file bat
cd /d "%~dp0"

echo =========================================================================
echo    DỰ ÁN WEBSITE GAMING PHONE (SMARTSTORE) - JAVASCRIPT NÂNG CAO
echo =========================================================================
echo.
echo [1] Kiem tra va giai phong cong 3000 neu dang bi chiem dung...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo     -^> Dang giai phong cong 3000 tu tien trinh PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [2] Thong tin dia chi truy cap ung dung:
echo     - Trang Cua Hang (User):    http://localhost:3000
echo     - Trang Quan Tri (Admin):   http://localhost:3000/admin.html
echo.
echo [3] Tai khoan kiem thu he thong:
echo     - Quan Tri Vien: admin@smartstore.vn / admin
echo     - Khach Hang:    hung@gmail.com      / 123456
echo.
echo [4] Dang tu dong mo trinh duyet...
start http://localhost:3000

echo.
echo [5] Dang khoi dong JSON Server kiem Web Server tinh tren cong 3000...
echo     (Moi thao tac CRUD dien ra truc tiep tren DOM, khong reload trang)
echo =========================================================================
echo.

npx json-server -s . db.json -p 3000
pause
