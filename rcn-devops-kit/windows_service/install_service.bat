@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Windows Service Installation
echo ===================================================================
echo.

REM Check for administrator rights
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: This script requires administrator privileges.
    echo Please right-click and select "Run as administrator".
    pause
    exit /b 1
)

REM Set working directory to the script location
cd /d %~dp0
cd ..

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in the PATH.
    echo Please run install_deps.bat first to install the dependencies.
    pause
    exit /b 1
)

REM Check if NSSM is available
if not exist windows_service\nssm.exe (
    echo Error: NSSM (Non-Sucking Service Manager) not found.
    echo Please make sure nssm.exe is in the windows_service directory.
    pause
    exit /b 1
)

REM Check if the service already exists
sc query TerraFusionRCN >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo The TerraFusionRCN service is already installed.
    echo If you want to reinstall it, please run uninstall_service.bat first.
    pause
    exit /b 0
)

REM Check if virtual environment exists, create if not
if not exist venv (
    echo Virtual environment not found. Creating it...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
)

REM Install dependencies in virtual environment
echo Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt 2>nul || pip install fastapi uvicorn numpy pandas 
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Some dependencies may not have been installed correctly.
    echo The service might not function properly.
    pause
)

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Define the service parameters
set SERVICE_NAME=TerraFusionRCN
set SERVICE_DISPLAY=TerraFusionBuild RCN Valuation Engine
set SERVICE_DESC=Provides property valuation calculations for county assessors
set PYTHON_EXE=%CD%\venv\Scripts\python.exe
set APP_SCRIPT=%CD%\rcn_api_stub.py
set LOG_FILE=%CD%\logs\rcn_service.log

REM Install the service
echo Installing the TerraFusionRCN service...
windows_service\nssm.exe install %SERVICE_NAME% %PYTHON_EXE% %APP_SCRIPT%
windows_service\nssm.exe set %SERVICE_NAME% DisplayName "%SERVICE_DISPLAY%"
windows_service\nssm.exe set %SERVICE_NAME% Description "%SERVICE_DESC%"
windows_service\nssm.exe set %SERVICE_NAME% AppDirectory "%CD%"
windows_service\nssm.exe set %SERVICE_NAME% AppStdout "%LOG_FILE%"
windows_service\nssm.exe set %SERVICE_NAME% AppStderr "%LOG_FILE%"
windows_service\nssm.exe set %SERVICE_NAME% AppRotateFiles 1
windows_service\nssm.exe set %SERVICE_NAME% AppRotateBytes 10485760
windows_service\nssm.exe set %SERVICE_NAME% Start SERVICE_AUTO_START

REM Start the service
echo Starting the TerraFusionRCN service...
net start %SERVICE_NAME%
if %ERRORLEVEL% NEQ 0 (
    echo Failed to start the TerraFusionRCN service.
    echo Please check the logs for more information.
    pause
    exit /b 1
)

echo.
echo ===================================================================
echo The TerraFusionRCN service has been installed and started!
echo ===================================================================
echo.
echo The RCN Valuation Engine is now running as a Windows service.
echo You can access it by opening http://localhost:8000 in your browser.
echo.
echo The service will automatically start when the computer boots.
echo To stop or uninstall the service, use the Windows Services Manager
echo or run the uninstall_service.bat script.
echo.
echo Service logs are saved to: %LOG_FILE%
echo.
pause