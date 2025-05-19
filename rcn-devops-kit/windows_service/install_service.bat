@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Windows Service Installation
echo ===================================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: This script requires administrator privileges.
    echo Please right-click and select "Run as administrator".
    pause
    exit /b 1
)

REM Get the current directory of the script
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."
cd "%ROOT_DIR%"

REM Check if NSSM is present
if not exist "%SCRIPT_DIR%nssm.exe" (
    echo Error: NSSM (Non-Sucking Service Manager) is missing.
    echo Please download NSSM from https://nssm.cc/download and place nssm.exe in the windows_service directory.
    pause
    exit /b 1
)

REM Check if Python virtual environment exists
if not exist venv (
    echo Virtual environment not found. Please run install_deps.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment (for environment setup only, service will use absolute paths)
call venv\Scripts\activate.bat

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Set service information
set "SERVICE_NAME=TerraFusionRCN"
set "SERVICE_DISPLAY_NAME=TerraFusionBuild RCN Valuation Engine"
set "SERVICE_DESCRIPTION=Provides API endpoints for calculating Replacement Cost New (RCN) values for buildings."
set "PYTHON_EXE=%ROOT_DIR%\venv\Scripts\python.exe"
set "SCRIPT_PATH=%ROOT_DIR%\rcn_api_stub.py"

REM Check if service already exists
sc query %SERVICE_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Service '%SERVICE_NAME%' already exists. Removing existing service...
    "%SCRIPT_DIR%nssm.exe" remove %SERVICE_NAME% confirm
)

REM Install service
echo Installing service '%SERVICE_DISPLAY_NAME%'...
"%SCRIPT_DIR%nssm.exe" install %SERVICE_NAME% "%PYTHON_EXE%" "%SCRIPT_PATH%"
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% DisplayName "%SERVICE_DISPLAY_NAME%"
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% Description "%SERVICE_DESCRIPTION%"
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% AppDirectory "%ROOT_DIR%"
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% AppStdout "%ROOT_DIR%\logs\service_stdout.log"
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% AppStderr "%ROOT_DIR%\logs\service_stderr.log"
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% AppStopMethodSkip 0
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% AppStopMethodConsole 1500
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% AppStopMethodWindow 1500
"%SCRIPT_DIR%nssm.exe" set %SERVICE_NAME% AppStopMethodThreads 1500

REM Start the service
echo Starting service...
net start %SERVICE_NAME%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================================
    echo Service installation complete!
    echo ===================================================================
    echo.
    echo The RCN Valuation Engine is now running as a Windows service.
    echo.
    echo - Service Name: %SERVICE_NAME%
    echo - Access the API at: http://localhost:8000
    echo - API Documentation: http://localhost:8000/docs
    echo - Service logs are in: %ROOT_DIR%\logs\
    echo.
    echo To uninstall the service, run uninstall_service.bat
    echo.
) else (
    echo.
    echo ===================================================================
    echo Service installation failed!
    echo ===================================================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause