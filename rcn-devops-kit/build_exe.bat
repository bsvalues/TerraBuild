@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Build Executable
echo =====================================================
echo.

setlocal

set INSTALL_DIR=%~dp0
set VENV_NAME=venv
set DIST_DIR=%INSTALL_DIR%\dist
set BUILD_DIR=%INSTALL_DIR%\build
set SPEC_DIR=%INSTALL_DIR%

:: Check if Python virtual environment exists
if not exist "%INSTALL_DIR%\%VENV_NAME%" (
    echo Error: Python virtual environment not found.
    echo Please run install_deps.bat first to set up the environment.
    goto :error
)

:: Check if PyInstaller is installed
call "%INSTALL_DIR%\%VENV_NAME%\Scripts\activate"
python -c "import PyInstaller" >nul 2>&1
if %errorlevel% neq 0 (
    echo PyInstaller not found. Installing...
    python -m pip install pyinstaller
    if %errorlevel% neq 0 (
        echo Error: Failed to install PyInstaller.
        goto :error
    )
)

echo Creating directories...
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo Cleaning previous build files...
if exist "%DIST_DIR%\rcn_valuation_engine.exe" del /q "%DIST_DIR%\rcn_valuation_engine.exe"
if exist "%BUILD_DIR%\rcn_valuation_engine" rd /s /q "%BUILD_DIR%\rcn_valuation_engine"
if exist "%SPEC_DIR%\rcn_valuation_engine.spec" del /q "%SPEC_DIR%\rcn_valuation_engine.spec"

echo Building executable with PyInstaller...
python -m PyInstaller --clean ^
    --name="rcn_valuation_engine" ^
    --onefile ^
    --add-data "%INSTALL_DIR%\sample_data;sample_data" ^
    --add-data "%INSTALL_DIR%\html_ui;html_ui" ^
    --hidden-import="uvicorn.logging" ^
    --hidden-import="uvicorn.protocols" ^
    --hidden-import="uvicorn.protocols.http" ^
    --hidden-import="uvicorn.protocols.http.auto" ^
    --hidden-import="uvicorn.protocols.websockets" ^
    --hidden-import="uvicorn.protocols.websockets.auto" ^
    --hidden-import="uvicorn.lifespan" ^
    --hidden-import="uvicorn.lifespan.on" ^
    --hidden-import="uvicorn.lifespan.off" ^
    "%INSTALL_DIR%\rcn_api_stub.py"

if %errorlevel% neq 0 (
    echo Error: Build failed.
    goto :error
)

echo.
echo Checking if executable was created...
if not exist "%DIST_DIR%\rcn_valuation_engine.exe" (
    echo Error: Executable not found after build.
    goto :error
)

echo.
echo Executable built successfully!
echo Location: %DIST_DIR%\rcn_valuation_engine.exe
echo.
echo You can now run the RCN Valuation Engine without Python:
echo   "%DIST_DIR%\rcn_valuation_engine.exe"
echo.
echo To create a complete deployment package with the executable:
echo   "%INSTALL_DIR%\create_deployment_package.bat"
echo.

call "%INSTALL_DIR%\%VENV_NAME%\Scripts\deactivate"

goto :end

:error
echo.
echo Build failed. Please fix the errors above and try again.
call "%INSTALL_DIR%\%VENV_NAME%\Scripts\deactivate" 2>nul
exit /b 1

:end
pause