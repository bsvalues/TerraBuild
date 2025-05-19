@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Dependency Installation
echo ===================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in the PATH.
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM Display Python version
python --version
echo.

REM Check if virtualenv is installed
python -m pip show virtualenv >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing virtualenv...
    python -m pip install virtualenv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install virtualenv. Please check your internet connection.
        pause
        exit /b 1
    )
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo Virtual environment already exists.
)

REM Activate virtual environment
echo Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install required packages
echo Installing required Python packages...
python -m pip install fastapi uvicorn numpy pandas pydantic

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

echo.
echo ===================================================================
echo Installation complete!
echo ===================================================================
echo.
echo All dependencies have been successfully installed.
echo You can now run the RCN Valuation Engine using start_rcn.bat
echo.
pause