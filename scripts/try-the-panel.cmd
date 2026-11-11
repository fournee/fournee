@echo off
rem Double-click to try the whole Fournee panel (Frosting, Fontdant, the pass, Sprinkles) on a sample page.
rem Starts a small local server and opens the page in Chrome. Close this window to stop it.
title Fournee playground
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js isn't installed, so the playground can't start.
  echo   Install it from https://nodejs.org ^(the LTS button^), then double-click this file again.
  echo.
  pause
  exit /b 1
)

if not exist "frosting\dist\frosting.css" goto build
if not exist "fontdant\dist\fontdant.css" goto build
goto run

:build
echo.
echo   First run: building Fournee's stylesheets (about a minute)...
if not exist "frosting\node_modules" call npm --prefix frosting ci --no-audit --no-fund
if not exist "fontdant\node_modules" call npm --prefix fontdant ci --no-audit --no-fund
call npm run build
if errorlevel 1 (
  echo.
  echo   The build failed; the messages above say why. Nothing was changed outside this folder.
  pause
  exit /b 1
)

:run
node scripts\playground.mjs %*
echo.
echo   The playground stopped.
pause
