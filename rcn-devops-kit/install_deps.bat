@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Dependencies Installation
echo ===================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python 3.8 or higher.
    echo You can download Python from https://www.python.org/downloads/
    echo.
    echo After installing Python, please run this script again.
    pause
    exit /b 1
)

echo Checking Python version...
for /f "tokens=2" %%I in ('python --version 2^>^&1') do set PYTHON_VERSION=%%I
echo Found Python %PYTHON_VERSION%

REM Create and activate virtual environment
echo Creating Python virtual environment...
if not exist venv (
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create virtual environment. Please check your Python installation.
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing required packages...
pip install --upgrade pip
pip install fastapi uvicorn pydantic

echo.
echo Dependencies installed successfully!
echo.
echo To run the RCN Valuation Engine, use the start_rcn.bat script.
echo.
pause