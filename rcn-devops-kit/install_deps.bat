@echo off
echo ====================================================
echo TerraFusionBuild RCN Valuation Engine - Dependencies Installer
echo ====================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script needs to be run as Administrator.
    echo Please right-click on the script and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo Checking for Python installation...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo Checking Python version...
python --version | findstr /r "3\.[8-9]\|3\.1[0-9]" >nul
if %errorlevel% neq 0 (
    echo Warning: Recommended Python version is 3.8 or higher.
    echo You may encounter issues with older versions.
    echo.
    choice /c YN /m "Do you want to continue anyway?"
    if %errorlevel% neq 1 (
        echo Installation aborted.
        exit /b 1
    )
)

echo Checking for pip...
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pip is not installed. Installing pip...
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python get-pip.py
    if %errorlevel% neq 0 (
        echo Failed to install pip.
        exit /b 1
    )
    echo pip installed successfully.
    del get-pip.py
)

echo Creating Python virtual environment...
if not exist venv (
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing required packages...
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn pydantic

echo Installing additional packages for RCN Valuation Engine...
python -m pip install pandas openpyxl numpy

echo Creating log directory...
if not exist logs (
    mkdir logs
)

echo.
echo ====================================================
echo Dependencies installed successfully!
echo.
echo To start the RCN Valuation Engine:
echo   1. Run start_rcn.bat
echo.
echo To install as a Windows service:
echo   1. Run windows_service/install_service.bat as Administrator
echo ====================================================
echo.

pause