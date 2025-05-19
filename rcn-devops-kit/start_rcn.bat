@echo off
echo ===============================================
echo TerraFusionBuild RCN Valuation Engine - Server
echo ===============================================
echo.

:: Check if virtual environment exists
if not exist venv (
    echo Virtual environment not found. Please run install_deps.bat first.
    pause
    exit /b 1
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found. Using default settings.
    echo Consider copying .env.example to .env and configuring it.
    echo.
)

:: Start the API server
echo Starting RCN Valuation Engine...
echo.
echo API will be available at: http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server
echo.

:: Start the uvicorn server
python -m uvicorn rcn_api_stub:app --host 0.0.0.0 --port 8000 --reload

:: If we get here, server was stopped
echo.
echo Server stopped.
pause