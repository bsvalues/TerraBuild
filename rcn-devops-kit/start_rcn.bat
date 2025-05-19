@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Server Startup
echo ===================================================================
echo.

set PORT=8000
set HOST=0.0.0.0

REM Check if Python virtual environment exists
if not exist venv (
    echo Python virtual environment not found.
    echo Please run install_deps.bat first to install the dependencies.
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Check for required files
if not exist rcn_api_stub.py (
    echo Error: rcn_api_stub.py file not found.
    echo Please make sure all files are in the correct location.
    pause
    exit /b 1
)

REM Starting server
echo.
echo Starting RCN Valuation Engine on http://%HOST%:%PORT%/
echo.
echo *** Press Ctrl+C to stop the server ***
echo.
echo Once the server is running, open your web browser and navigate to:
echo   http://localhost:%PORT%/
echo.

python rcn_api_stub.py

REM If we get here, the server was stopped
echo.
echo RCN Valuation Engine server has been stopped.
pause