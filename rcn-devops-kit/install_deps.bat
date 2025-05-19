@echo off
REM ======================================================================
REM TerraFusionBuild RCN Valuation Engine - Dependency Installer
REM
REM This script installs all required dependencies for the RCN Valuation Engine.
REM ======================================================================

echo.
echo TerraFusionBuild RCN Valuation Engine - Dependency Installer
echo =========================================================
echo.

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

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create virtual environment.
        echo Please check your Python installation.
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing required packages...
pip install fastapi uvicorn pydantic pandas jinja2 2> logs\pip_errors.log

REM Check if installation was successful
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies.
    echo Please check logs\pip_errors.log for details.
    call venv\Scripts\deactivate.bat
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo You can now run start_rcn.bat to start the RCN Valuation Engine.
echo.

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

exit /b 0