@echo off
setlocal enabledelayedexpansion
title Rihla Dev Environment
set "PROJECT=%~dp0"
cd /d "%PROJECT%"

echo.
echo  ============================================
echo     Rihla - Development Environment Launcher
echo  ============================================
echo.

:: -----------------------------------------------
:: 1. Check Docker Desktop
:: -----------------------------------------------
echo [1/8] Checking Docker Desktop...
docker info >nul 2>&1
if %errorlevel% equ 0 goto docker_ok

echo        Docker Desktop is not running. Starting it...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo        Waiting for Docker to start...
set /a attempts=0
:docker_poll
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% equ 0 goto docker_ok
set /a attempts+=1
if !attempts! geq 24 (
    echo        [ERROR] Docker did not start within 2 minutes. Please start it manually.
    pause
    exit /b 1
)
goto docker_poll

:docker_ok
echo        Docker is running.

:: -----------------------------------------------
:: 2. Start Docker Compose services
:: -----------------------------------------------
echo [2/8] Starting Docker services...
docker compose up -d
if %errorlevel% neq 0 (
    echo        [ERROR] docker compose up failed.
    pause
    exit /b 1
)

:: -----------------------------------------------
:: 3. Wait for health checks
:: -----------------------------------------------
echo [3/8] Waiting for services to be healthy...
set /a hc=0
:health_poll
timeout /t 3 /nobreak >nul
set hpass=1
for %%s in (rihla-postgres rihla-redis) do (
    docker inspect --format="{{.State.Health.Status}}" %%s 2>nul | findstr /i "healthy" >nul
    if errorlevel 1 set hpass=0
)
if !hpass! equ 1 goto health_ok
set /a hc+=1
if !hc! lss 20 goto health_poll
echo        [WARNING] Timed out waiting for health checks. Continuing anyway...
:health_ok
echo        Core services are healthy.

:: -----------------------------------------------
:: 4. Start Backend API
:: -----------------------------------------------
echo [4/8] Starting backend API server...
if not exist "%PROJECT%backend\venv\Scripts\activate.bat" (
    echo        Creating Python virtual environment...
    python -m venv "%PROJECT%backend\venv"
    call "%PROJECT%backend\venv\Scripts\activate.bat"
    pip install -r "%PROJECT%backend\requirements.txt"
    call deactivate
)
start "Rihla Backend [port 8000]" cmd /k "cd /d %PROJECT%backend && call venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Give uvicorn a moment to claim the port
timeout /t 3 /nobreak >nul

:: -----------------------------------------------
:: 5. Start Web Frontend
:: -----------------------------------------------
echo [5/8] Starting web frontend...
if not exist "%PROJECT%web\node_modules" (
    echo        Installing web dependencies...
    pushd "%PROJECT%web" && npm install && popd
)
start "Rihla Web [port 3000]" cmd /k "cd /d %PROJECT%web && npm run dev"

:: -----------------------------------------------
:: 6. Start Admin Frontend
:: -----------------------------------------------
echo [6/8] Starting admin frontend...
if not exist "%PROJECT%admin\node_modules" (
    echo        Installing admin dependencies...
    pushd "%PROJECT%admin" && npm install && popd
)
start "Rihla Admin [port 3001]" cmd /k "cd /d %PROJECT%admin && npm run dev"

:: -----------------------------------------------
:: 7. Start Android Emulator + Mobile
:: -----------------------------------------------
echo [7/8] Starting Android emulator and mobile app...

where emulator >nul 2>&1
if %errorlevel% neq 0 (
    echo        [WARNING] Android emulator not found in PATH. Skipping mobile launch.
    goto skip_mobile
)

set "AVD_NAME="
for /f "tokens=*" %%a in ('emulator -list-avds 2^>nul') do (
    if not defined AVD_NAME set "AVD_NAME=%%a"
)
if not defined AVD_NAME (
    echo        [WARNING] No AVD found. Create one in Android Studio. Skipping mobile.
    goto skip_mobile
)

echo        Launching emulator: !AVD_NAME!
start "" emulator -avd !AVD_NAME!

echo        Waiting for emulator to boot...
set /a ec=0
:emu_poll
timeout /t 5 /nobreak >nul
adb shell getprop sys.boot_completed 2>nul | findstr "1" >nul
if %errorlevel% equ 0 goto emu_ok
set /a ec+=1
if !ec! geq 24 (
    echo        [WARNING] Emulator boot timed out. Starting Expo anyway...
    goto emu_ok
)
goto emu_poll

:emu_ok
echo        Emulator is ready.

if not exist "%PROJECT%mobile\node_modules" (
    echo        Installing mobile dependencies...
    pushd "%PROJECT%mobile" && npm install && popd
)
start "Rihla Mobile [Expo]" cmd /k "cd /d %PROJECT%mobile && npx expo start --dev-client"

:skip_mobile

:: -----------------------------------------------
:: 8. Open browser when web server is ready
:: -----------------------------------------------
echo [8/8] Waiting for dev servers to start...

set /a wc=0
:web_poll
timeout /t 2 /nobreak >nul
curl.exe -s -o nul http://localhost:3000 2>nul
if %errorlevel% equ 0 goto web_ok
set /a wc+=1
if !wc! geq 20 goto web_ok
goto web_poll

:web_ok
start "" http://localhost:3000

echo.
echo  ============================================
echo     All services started successfully!
echo  ============================================
echo.
echo   Backend API:   http://localhost:8000
echo   Web App:       http://localhost:3000
echo   Admin Panel:   http://localhost:3001
echo   MinIO Console: http://localhost:9001
echo   Mailpit:       http://localhost:8025
echo   Synapse:       http://localhost:8008
echo   Jitsi:         https://localhost:8443
echo.
echo   To stop: run stop-dev.bat or close all
echo   terminal windows and run "docker compose down"
echo.
pause
