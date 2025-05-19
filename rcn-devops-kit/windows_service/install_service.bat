@echo off
REM ======================================================================
REM TerraFusionBuild RCN Valuation Engine - Windows Service Installer
REM
REM This script installs the RCN Valuation Engine as a Windows service.
REM Run as Administrator!
REM ======================================================================

echo.
echo TerraFusionBuild RCN Valuation Engine - Windows Service Installer
echo ================================================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script requires administrator privileges.
    echo Please right-click on the script and select "Run as Administrator".
    exit /b 1
)

REM Set default port
set PORT=8000

REM Get script directory
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
cd /d "%ROOT_DIR%"

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

REM Check if NSSM exists
if not exist "%SCRIPT_DIR%nssm.exe" (
    echo Downloading NSSM (Non-Sucking Service Manager)...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%TEMP%\nssm.zip'"
    powershell -Command "Expand-Archive -Path '%TEMP%\nssm.zip' -DestinationPath '%TEMP%\nssm'"
    
    if exist "%TEMP%\nssm\nssm-2.24\win64\nssm.exe" (
        copy "%TEMP%\nssm\nssm-2.24\win64\nssm.exe" "%SCRIPT_DIR%nssm.exe"
    ) else (
        copy "%TEMP%\nssm\nssm-2.24\win32\nssm.exe" "%SCRIPT_DIR%nssm.exe"
    )
    
    if not exist "%SCRIPT_DIR%nssm.exe" (
        echo Failed to download NSSM.
        echo Please manually download it from https://nssm.cc/
        echo and place nssm.exe in the windows_service directory.
        exit /b 1
    )
)

REM Create full path to python executable in venv
set PYTHON_PATH=%ROOT_DIR%\venv\Scripts\python.exe
set SCRIPT_PATH=%ROOT_DIR%\rcn_api_stub.py

REM Install the service
echo Installing TerraFusionRCN service...
"%SCRIPT_DIR%nssm.exe" install TerraFusionRCN "%PYTHON_PATH%" "%SCRIPT_PATH% --port %PORT%"
"%SCRIPT_DIR%nssm.exe" set TerraFusionRCN DisplayName "TerraFusionBuild RCN Valuation Engine"
"%SCRIPT_DIR%nssm.exe" set TerraFusionRCN Description "RCN Valuation Engine for property assessment calculations"
"%SCRIPT_DIR%nssm.exe" set TerraFusionRCN AppDirectory "%ROOT_DIR%"
"%SCRIPT_DIR%nssm.exe" set TerraFusionRCN AppStdout "%ROOT_DIR%\logs\service_stdout.log"
"%SCRIPT_DIR%nssm.exe" set TerraFusionRCN AppStderr "%ROOT_DIR%\logs\service_stderr.log"
"%SCRIPT_DIR%nssm.exe" set TerraFusionRCN Start SERVICE_AUTO_START

REM Start the service
echo Starting TerraFusionRCN service...
net start TerraFusionRCN

if %ERRORLEVEL% NEQ 0 (
    echo Failed to start service. Please check logs in logs directory.
    exit /b 1
)

echo.
echo TerraFusionRCN service installed and started successfully!
echo The service will automatically start when Windows boots.
echo.
echo API documentation: http://localhost:%PORT%/docs
echo Web interface: http://localhost:%PORT%/ui
echo.
echo To uninstall the service, run: uninstall_service.bat
echo.

exit /b 0