@echo off
title Chrono Collage
cd /d "%~dp0"
echo.
echo   ========================================
echo.
echo    CHRONO COLLAGE v1.0
echo    Reference Sheet Builder
echo.
echo    Made with Love by ChronoKnight
echo.
echo   ========================================
echo.
echo   Installing dependencies...
call npm install --silent
echo.
echo   Starting Chrono Collage...
echo   Browser will open automatically.
echo   Close this window to stop.
echo.
call npx vite --open
pause
