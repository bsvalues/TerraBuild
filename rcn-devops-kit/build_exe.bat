@echo off
echo ====================================================
echo TerraFusionBuild RCN Valuation Engine - Executable Builder
echo ====================================================
echo.

REM Check if virtual environment exists
if not exist venv (
    echo Python virtual environment not found.
    echo Please run install_deps.bat first.
    echo.
    pause
    exit /b 1
)

REM Create output directory if it doesn't exist
if not exist dist (
    mkdir dist
)

REM Install required build packages
echo Installing build dependencies...
call venv\Scripts\activate.bat
python -m pip install pyinstaller
if %errorlevel% neq 0 (
    echo Failed to install PyInstaller.
    echo.
    pause
    exit /b 1
)

REM Build executable
echo Building standalone executable...
pyinstaller --clean --onefile ^
    --add-data "sample_data;sample_data" ^
    --add-data "html_ui;html_ui" ^
    --name "RcnValuationEngine" ^
    --icon "html_ui\favicon.ico" ^
    --hidden-import "fastapi" ^
    --hidden-import "uvicorn" ^
    --hidden-import "pydantic" ^
    rcn_api_stub.py

if %errorlevel% neq 0 (
    echo Failed to build executable.
    echo.
    pause
    exit /b 1
)

REM Copy additional files to dist directory
echo Copying additional files...
copy README.md dist\
copy windows_service\*.bat dist\
if not exist dist\windows_service mkdir dist\windows_service
copy windows_service\*.bat dist\windows_service\

echo Creating startup script...
(
    echo @echo off
    echo echo Starting RCN Valuation Engine...
    echo echo API will be available at http://localhost:5000
    echo echo Press Ctrl+C to stop the server
    echo echo.
    echo start http://localhost:5000/documentation
    echo RcnValuationEngine.exe
) > dist\start_engine.bat

echo.
echo ====================================================
echo Build completed successfully!
echo.
echo The standalone executable package is available in the dist directory.
echo.
echo To use the package:
echo   1. Copy the entire dist directory to the target system
echo   2. Run start_engine.bat to start the RCN Valuation Engine
echo   3. To install as a Windows service, run windows_service\install_service.bat
echo ====================================================
echo.

pause