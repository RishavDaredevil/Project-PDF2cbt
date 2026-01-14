@echo off
TITLE PDF2CBT - Update and Start Server

echo ========================================================
echo   PDF2CBT: Safe Update & Start Script
echo ========================================================
echo.

:: 1. OPTIONAL: Pull latest code (Uncomment the next line if you want to auto-pull)
:: git pull

:: 2. Install Packages
:: It is safe (and recommended) to run this every time. 
:: pnpm checks the lockfile and only installs what is missing, so it is fast.
echo [1/3] Checking and installing dependencies...
call pnpm install
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Package installation failed!
    pause
    exit /b %ERRORLEVEL%
)

:: 3. Clear Nuxt Cache
:: This is CRITICAL when changing themes (Tailwind) or nuxt.config settings.
:: It prevents "ghost" styles or old configs from sticking around.
echo.
echo [2/3] Cleaning Nuxt cache (prevents theme/config bugs)...
call npx nuxi cleanup
IF %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Could not clean cache. Continuing anyway...
)

:: 4. Start Server
echo.
echo [3/3] Starting Development Server...
echo.
pnpm run dev:web

pause