@echo off
echo ====================================================
echo TerraFusionBuild RCN Valuation Engine - Service Installer
echo ====================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script needs to be run as Administrator.
    echo Please right-click on the script and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

REM Check if NSSM is available or download it
set DOWNLOAD_NSSM=0
if not exist "%~dp0\nssm.exe" (
    set DOWNLOAD_NSSM=1
    echo NSSM (Non-Sucking Service Manager) not found. Downloading...
    
    REM Create temp directory for downloading
    if not exist "%TEMP%\rcn_temp" mkdir "%TEMP%\rcn_temp"
    
    REM Download NSSM
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%TEMP%\rcn_temp\nssm.zip'}"
    if %errorlevel% neq 0 (
        echo Failed to download NSSM.
        echo Please download it manually from https://nssm.cc/release/nssm-2.24.zip
        echo Extract the zip and place nssm.exe in the same directory as this script.
        echo.
        pause
        exit /b 1
    )
    
    REM Extract NSSM
    powershell -Command "& {Expand-Archive -Path '%TEMP%\rcn_temp\nssm.zip' -DestinationPath '%TEMP%\rcn_temp'}"
    
    REM Copy the correct version based on architecture
    if exist "%PROGRAMFILES(X86)%" (
        copy "%TEMP%\rcn_temp\nssm-2.24\win64\nssm.exe" "%~dp0"
    ) else (
        copy "%TEMP%\rcn_temp\nssm-2.24\win32\nssm.exe" "%~dp0"
    )
    
    REM Clean up
    rmdir /s /q "%TEMP%\rcn_temp"
    
    echo NSSM downloaded successfully.
)

REM Get absolute paths
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."
cd /d "%ROOT_DIR%"
set "APP_PATH=%CD%\venv\Scripts\python.exe"
set "APP_DIR=%CD%"
set "APP_SCRIPT=%CD%\rcn_api_stub.py"

REM Create logs directory if it doesn't exist
if not exist "%APP_DIR%\logs" (
    mkdir "%APP_DIR%\logs"
)

REM Install the service
echo Installing RCN Valuation Engine as a Windows service...
"%SCRIPT_DIR%\nssm.exe" install RcnValuationEngine "%APP_PATH%" "%APP_SCRIPT%"
if %errorlevel% neq 0 (
    echo Failed to install service.
    echo Please ensure that you have administrative privileges.
    echo.
    pause
    exit /b 1
)

REM Configure service parameters
echo Configuring service parameters...
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine AppDirectory "%APP_DIR%"
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine DisplayName "TerraFusionBuild RCN Valuation Engine"
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine Description "API service for calculating Replacement Cost New (RCN) values for buildings"
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine Start SERVICE_AUTO_START
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine AppStdout "%APP_DIR%\logs\service_stdout.log"
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine AppStderr "%APP_DIR%\logs\service_stderr.log"
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine AppRotateFiles 1
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine AppRotateOnline 1
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine AppRotateSeconds 86400
"%SCRIPT_DIR%\nssm.exe" set RcnValuationEngine AppRotateBytes 10485760

REM Start the service
echo Starting the service...
"%SCRIPT_DIR%\nssm.exe" start RcnValuationEngine
if %errorlevel% neq 0 (
    echo Warning: Failed to start the service.
    echo You may need to start it manually from the Services management console.
    echo.
) else (
    echo Service started successfully.
)

echo.
echo ====================================================
echo RCN Valuation Engine has been installed as a Windows service.
echo.
echo Service Name: RcnValuationEngine
echo Display Name: TerraFusionBuild RCN Valuation Engine
echo.
echo The service will start automatically when the system boots.
echo API will be available at http://localhost:5000
echo.
echo To uninstall the service:
echo   1. Run windows_service/uninstall_service.bat as Administrator
echo ====================================================
echo.

pause