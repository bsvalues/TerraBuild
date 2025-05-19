@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Setup
echo =====================================================
echo.

setlocal

:: Check for Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in your PATH.
    echo Please install Python 3.8 or later from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set pyver=%%i
echo Detected Python version: %pyver%

:: Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo Failed to create virtual environment.
        echo Please ensure you have venv module available.
        pause
        exit /b 1
    )
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Failed to activate virtual environment.
    pause
    exit /b 1
)

:: Create requirements.txt if it doesn't exist
if not exist requirements.txt (
    echo Creating requirements.txt file...
    (
        echo fastapi==0.104.1
        echo uvicorn==0.24.0
        echo pydantic==2.4.2
        echo python-dotenv==1.0.0
    ) > requirements.txt
)

:: Install dependencies
echo Installing dependencies from requirements.txt...
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

:: Create .env file from .env.example if it doesn't exist
if exist .env.example (
    if not exist .env (
        echo Creating .env configuration file from template...
        copy .env.example .env
    )
) else (
    :: Create default .env if .env.example doesn't exist and .env doesn't exist
    if not exist .env (
        echo Creating default .env configuration file...
        (
            echo # TerraFusionBuild RCN Valuation Engine Configuration
            echo # Generated on %date% at %time%
            echo 
            echo # API Settings
            echo PORT=8000
            echo HOST=0.0.0.0
            echo 
            echo # Logging Settings
            echo LOG_LEVEL=info
            echo 
            echo # Sample Data Settings
            echo USE_SAMPLE_DATA=true
            echo SAMPLE_DATA_PATH=./sample_data
        ) > .env
    )
)

:: Create logs directory if it doesn't exist
if not exist logs mkdir logs

echo.
echo Setup completed successfully!
echo.
echo To start the RCN Valuation Engine, run:
echo   start_rcn.bat
echo.
echo For more information, see README.md
echo.

pause