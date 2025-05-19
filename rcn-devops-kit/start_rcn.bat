@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Server Startup
echo =====================================================
echo.

setlocal

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in your PATH.
    echo Please run install_deps.bat first.
    pause
    exit /b 1
)

:: Check if virtual environment exists
if not exist venv (
    echo Virtual environment not found.
    echo Please run install_deps.bat first.
    pause
    exit /b 1
)

:: Check if API stub exists
if not exist rcn_api_stub.py (
    echo API stub file (rcn_api_stub.py) not found.
    echo Please ensure all files are properly installed.
    pause
    exit /b 1
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Set up environment variables from .env file if it exists
if exist .env (
    echo Loading environment from .env file...
    for /F "tokens=*" %%A in (.env) do (
        set %%A 2>nul
    )
)

:: Default port if not set in .env
if not defined PORT set PORT=8000

:: Default host if not set in .env
if not defined HOST set HOST=0.0.0.0

echo Starting RCN Valuation Engine API on http://%HOST%:%PORT%
echo.
echo This window will display server logs. Close this window to stop the server.
echo To access the API documentation, visit: http://localhost:%PORT%/docs
echo To use the HTML dashboard, open html_ui/index.html in your browser.
echo.
echo Press Ctrl+C to stop the server.
echo.

:: Start the API server
python -m uvicorn rcn_api_stub:app --host %HOST% --port %PORT% --reload

:: This will only execute if the server is stopped
echo.
echo Server has been stopped.
echo.
pause