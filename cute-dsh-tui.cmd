@echo off
rem Windows compatibility wrapper for the portable cute-dsh-tui.js launcher.
rem Supports: --resume [session-id|--last], --continue/-c, and --yolo.
rem CUTE_DSH_TUI_WORKSPACE overrides the working directory for this launch.
setlocal EnableExtensions

if not defined NODE_ENV set "NODE_ENV=production"
node "%~dp0cute-dsh-tui.js" %*
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
