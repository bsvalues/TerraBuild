@echo off
echo ====================================================
echo TerraFusionBuild RCN Valuation Engine - Startup Script
echo ====================================================
echo.

set PORT=5000
set HOST=0.0.0.0
set LOG_FILE=logs\rcn_api_%date:~-4,4%%date:~-7,2%%date:~-10,2%.log

REM Check if port is already in use
netstat -ano | findstr ":%PORT%" > nul
if %errorlevel% equ 0 (
    echo Port %PORT% is already in use. The RCN API may already be running.
    echo Please check running processes or change the port in this script.
    echo.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo Python virtual environment not found.
    echo Please run install_deps.bat first.
    echo.
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist logs (
    mkdir logs
)

echo Starting RCN Valuation Engine...
echo API will be available at http://localhost:%PORT%
echo Press Ctrl+C to stop the server
echo Log file: %LOG_FILE%
echo.

REM Activate virtual environment and start the API server
call venv\Scripts\activate.bat
echo Starting server... >> %LOG_FILE%
echo Server start time: %date% %time% >> %LOG_FILE%
echo Host: %HOST% Port: %PORT% >> %LOG_FILE%
echo. >> %LOG_FILE%

python rcn_api_stub.py >> %LOG_FILE% 2>&1

REM This code should only run if the server is stopped
echo.
echo ====================================================
echo RCN Valuation Engine has been stopped.
echo ====================================================
echo.
pause