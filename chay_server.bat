@echo off
chcp 65001 >nul
title [SmartStore] Máy Chủ API & Website Bán Điện Thoại (Cổng 3000)
echo =========================================================================
echo DỰ ÁN ASSIGNMENT: WEBSITE BÁN ĐIỆN THOẠI THÔNG MINH & GAMING (SMARTSTORE)
echo Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
echo =========================================================================
echo.

:: Tự động giải phóng cổng 3000 nếu có tiến trình cũ đang chiếm giữ
echo [*] Đang kiểm tra và giải phóng cổng 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo     -> Đang tắt tiến trình cũ chiếm cổng 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [1] Đang tự động mở Website trên trình duyệt...
echo     - Giao diện Khách hàng (Client): http://localhost:3000/index.html
echo     - Giao diện Quản trị viên (Admin): http://localhost:3000/admin.html
echo.
echo [2] Tài khoản Đăng nhập Demo:
echo     - Admin:      admin@smartstore.vn  /  Mật khẩu: admin
echo     - Khách hàng: hung.nv@gmail.com    /  Mật khẩu: 123
echo.
echo [3] Đang khởi động JSON Server & Static Web Server tại cổng 3000...
echo =========================================================================
echo.

start http://localhost:3000/index.html
npx json-server -s . db.json -p 3000
pause
