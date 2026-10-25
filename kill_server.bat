@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Killing PID: %%a
    taskkill /F /PID %%a 2>nul
)
echo Server stopped
pause