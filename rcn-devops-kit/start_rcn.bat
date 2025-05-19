@echo off
REM ======================================================================
REM TerraFusionBuild RCN Valuation Engine - Server Starter
REM
REM This script starts the RCN Valuation Engine server.
REM ======================================================================

echo.
echo TerraFusionBuild RCN Valuation Engine - Server Starter
echo ===================================================
echo.

REM Set default port
set PORT=8000

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :done_args
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-p" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
shift
goto :parse_args
:done_args

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found.
    echo.
    echo Please install Python 3.8 or higher before continuing.
    echo You can download Python from https://www.python.org/downloads/
    echo.
    echo Be sure to check "Add Python to PATH" during installation.
    exit /b 1
)

REM Check if dependencies are installed
if not exist venv (
    echo Virtual environment not found. Running dependency installer...
    call install_deps.bat
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies. Please check the logs.
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Start the server
echo Starting RCN Valuation Engine server on port %PORT%...
echo.
echo Server will be available at:
echo   * API: http://localhost:%PORT%/
echo   * Documentation: http://localhost:%PORT%/docs
echo   * Web Interface: http://localhost:%PORT%/ui
echo.
echo Press Ctrl+C to stop the server.
echo.

python rcn_api_stub.py --port %PORT%

REM If the server stops, deactivate the virtual environment
call venv\Scripts\deactivate.bat

exit /b 0