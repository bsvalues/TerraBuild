@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Executable Builder
echo ===================================================================
echo.

REM Check if Python virtual environment exists
if not exist venv (
    echo Python virtual environment not found.
    echo Please run install_deps.bat first to install the dependencies.
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Check if PyInstaller is installed
pip show pyinstaller >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install PyInstaller. Please check your internet connection.
        pause
        exit /b 1
    )
)

REM Check for required files
if not exist rcn_api_stub.py (
    echo Error: rcn_api_stub.py file not found.
    echo Please make sure all files are in the correct location.
    pause
    exit /b 1
)

REM Create build directory
if not exist build mkdir build

REM Building executable
echo.
echo Building standalone executable for RCN Valuation Engine...
echo This may take a few minutes...
echo.

pyinstaller --noconfirm --onefile --console ^
    --add-data "sample_data;sample_data" ^
    --add-data "html_ui;html_ui" ^
    --name "TerraFusionRCN" ^
    --icon=windows_service\app_icon.ico ^
    rcn_api_stub.py

REM Check if build was successful
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Failed to build executable.
    pause
    exit /b 1
)

REM Copy executable to main directory
echo Moving executable to main directory...
copy /Y dist\TerraFusionRCN.exe TerraFusionRCN.exe >nul

REM Cleanup
echo Cleaning up build files...
rmdir /S /Q build >nul 2>&1
rmdir /S /Q dist >nul 2>&1
del /Q TerraFusionRCN.spec >nul 2>&1

echo.
echo ===================================================================
echo Build complete!
echo ===================================================================
echo.
echo The standalone executable TerraFusionRCN.exe has been created.
echo You can now run this executable on any Windows system without 
echo needing to install Python or dependencies.
echo.
echo NOTE: The executable still needs access to the sample_data and 
echo       html_ui folders, which are included in the executable.
echo.
pause