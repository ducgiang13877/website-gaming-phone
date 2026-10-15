@echo off
title [Gaming Phone] Chay Web va API tren JSON Server cong 3000
echo =========================================================================
echo WEBSITE GAMING PHONE: DANG KHOI DONG SERVER (CONG 3000)
echo Thu muc: website-gaming-phone
echo =========================================================================
echo.

:: Tu dong giai phong cong 3000 neu co tien trinh cu dang chiem giu
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Dang giai phong cong 3000 tu tien trinh cu (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo 1. Dang tu dong mo trinh duyet tai: http://localhost:3000
start http://localhost:3000
echo 2. Dang khoi dong JSON Server kiem Web Server tinh tren cong 3000...
echo.
npx json-server -s . db.json -p 3000
pause
