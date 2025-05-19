@echo off
echo ===================================================
echo TerraFusionBuild RCN Valuation Engine - Installation
echo ===================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.9 or higher.
    echo Download from: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: Check Python version
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set pyver=%%v
echo Detected Python version: %pyver%
echo.

:: Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo Using existing virtual environment.
)

:: Activate virtual environment and install dependencies
echo Installing dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

:: Create data directory
if not exist data mkdir data

:: Create logs directory
if not exist logs mkdir logs

:: Copy .env.example to .env if it doesn't exist
if not exist .env (
    echo Creating default environment configuration...
    copy .env.example .env
    echo Please edit the .env file with your specific configuration.
)

echo.
echo Installation completed successfully!
echo.
echo To start the RCN Valuation Engine, run start_rcn.bat
echo.
pause