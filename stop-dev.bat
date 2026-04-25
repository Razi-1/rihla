@echo off
cd /d "%~dp0"
echo.
echo  Stopping Rihla development environment...
echo.

:: Kill dev server processes by window title
taskkill /fi "WINDOWTITLE eq Rihla Backend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Rihla Web*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Rihla Admin*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Rihla Mobile*" /f >nul 2>&1

:: Stop Docker services
echo  Stopping Docker services...
docker compose down

echo.
echo  All services stopped.
pause
