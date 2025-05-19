@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Build Executable
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

:: Install PyInstaller if not already installed
pip show pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
    if %errorlevel% neq 0 (
        echo Failed to install PyInstaller.
        pause
        exit /b 1
    )
)

:: Create build directory if it doesn't exist
if not exist build mkdir build

:: Create dist directory if it doesn't exist
if not exist dist mkdir dist

echo Building executable with PyInstaller...
echo This may take a few minutes...

:: Build the executable
pyinstaller --noconfirm --onefile --windowed ^
    --add-data "sample_data;sample_data" ^
    --add-data "html_ui;html_ui" ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.lifespan.on ^
    --name rcn_valuation_engine ^
    rcn_api_stub.py

if %errorlevel% neq 0 (
    echo Failed to build executable.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo The executable is located at:
echo   dist\rcn_valuation_engine.exe
echo.
echo This executable contains the RCN Valuation Engine API server
echo and can be distributed to run on Windows systems without Python installed.
echo.
echo To run the executable:
echo   1. Double-click on dist\rcn_valuation_engine.exe
echo   2. Or run it from command line with: dist\rcn_valuation_engine.exe
echo.
echo Note: The executable uses the .env file from the same directory for configuration.
echo If .env doesn't exist, default values will be used.
echo.

pause