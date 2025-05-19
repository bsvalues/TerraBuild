@echo off
REM ======================================================================
REM TerraFusionBuild RCN Valuation Engine - Executable Builder
REM
REM This script builds a standalone executable of the RCN Valuation Engine.
REM ======================================================================

echo.
echo TerraFusionBuild RCN Valuation Engine - Executable Builder
echo =======================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python not found. Please install Python 3.8 or higher.
    echo You can download it from https://www.python.org/downloads/
    echo.
    echo After installing Python, run install_deps.bat first.
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo Virtual environment not found. Running dependency installer...
    call install_deps.bat
    if %ERRORLEVEL% NEQ 0 (
        echo Error installing dependencies. Please check the logs.
        exit /b 1
    )
)

REM Create dist directory if it doesn't exist
if not exist dist mkdir dist

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install PyInstaller if not already installed
pip show pyinstaller >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
)

REM Build the executable
echo Building standalone executable...
echo This may take a few minutes...

pyinstaller --noconfirm --onefile ^
    --add-data "sample_data;sample_data" ^
    --add-data "html_ui;html_ui" ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.protocols ^
    --hidden-import fastapi ^
    --name TerraFusionRCN ^
    rcn_api_stub.py

REM Copy the executable to dist directory
if exist dist\TerraFusionRCN.exe (
    echo Executable built successfully!
    echo.
    echo The executable is available at: dist\TerraFusionRCN.exe
    echo.
    echo Usage:
    echo   TerraFusionRCN.exe [--port PORT]
    echo.
    echo Example:
    echo   TerraFusionRCN.exe --port 8080
) else (
    echo Failed to build executable. Please check the logs.
    exit /b 1
)

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

exit /b 0