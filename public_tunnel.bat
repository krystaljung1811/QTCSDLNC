@echo off
title Cong Khai Website Ra Internet (Free Tunnel)
echo ==============================================================================
echo   CONG KHAI WEBSITE CINEMA RA INTERNET (TEN MIEN FREE)
echo   Yeu cau: Backend va Frontend dang chay tren may (port 8000 va 5173)
echo ==============================================================================
echo.
echo Chon phuong thuc tao link cong khai mien phi:
echo   [1] Cloudflare Quick Tunnel (Khuyen nghi - Khong can tai khoan, HTTPS cuc nhanh)
echo   [2] Pinggy SSH Tunnel (Khong can cai gi, dung ngay lenh SSH co san)
echo   [3] Localtunnel (Dat ten subdomain tuy chon)
echo.
set /p choice="Nhap lua chon [1, 2, 3]: "

if "%choice%"=="1" (
    echo.
    echo Dang khoi tao Cloudflare Tunnel den http://localhost:5173 ...
    echo Hay copy duong link https://xxxx.trycloudflare.com ben duoi de gui:
    echo ------------------------------------------------------------------
    call npx.cmd -y cloudflared tunnel --url http://localhost:5173
) else if "%choice%"=="2" (
    echo.
    echo Dang khoi tao Pinggy SSH Tunnel den http://localhost:5173 ...
    echo Hay copy duong link https://xxxx.a.free.pinggy.link ben duoi:
    echo ------------------------------------------------------------------
    ssh -p 443 -R0:localhost:5173 a.pinggy.io
) else if "%choice%"=="3" (
    echo.
    echo Dang khoi tao Localtunnel den http://localhost:5173 ...
    echo ------------------------------------------------------------------
    call npx.cmd -y localtunnel --port 5173
) else (
    echo Lua chon khong hop le.
)
pause
