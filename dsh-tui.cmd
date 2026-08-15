@echo off
rem Portable Windows wrapper for bin\dsh-tui.js.
rem Supports: --resume [session-id|--last], --continue/-c, and --yolo.
rem DSH_CC_WORKSPACE overrides the working directory for this launch.
setlocal EnableExtensions

if not defined NODE_ENV set "NODE_ENV=production"
set "WORKSPACE=%DSH_CC_WORKSPACE%"
if "%WORKSPACE%"=="" set "WORKSPACE=%CD%"
cd /d "%WORKSPACE%"

node "%~dp0bin\dsh-tui.js" %*
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
