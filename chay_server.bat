@echo off
chcp 65001 >nul
title [SmartStore] May Chu API va Website Ban Dien Thoai (Port 3000)

echo =========================================================================
echo DU AN ASSIGNMENT: WEBSITE BAN DIEN THOAI THONG MINH VA GAMING (SMARTSTORE)
echo Mon hoc: Lap trinh JavaScript Nang Cao - FPT Polytechnic
echo =========================================================================
echo.

:: Tu dong giai phong cong 3000 neu co tien trinh cu dang chiem giu
echo [*] Dang kiem tra va giai phong cong 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo     - Giai phong tien trinh cu PID %%a chiem cong 3000...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [1] Dang tu dong mo Website tren trinh duyet...
echo     - Giao dien Khach hang (Client): http://localhost:3000/index.html
echo     - Giao dien Quan tri vien (Admin): http://localhost:3000/views/admin.html
echo.
echo [2] Tai khoan Dang nhap Demo:
echo     - Admin:      admin@smartstore.vn  /  Mat khau: admin
echo     - Khach hang: hung.nv@gmail.com    /  Mat khau: 123
echo.
echo [3] Dang khoi dong JSON Server va Static Web Server tai cong 3000...
echo =========================================================================
echo.

start http://localhost:3000/index.html
npx json-server -s . db.json -p 3000
pause