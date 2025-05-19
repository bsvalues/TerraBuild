@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Windows Service Uninstallation
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

REM Set service name
set "SERVICE_NAME=TerraFusionRCN"

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Service '%SERVICE_NAME%' does not exist or is not installed.
    pause
    exit /b 1
)

REM Stop the service if it's running
echo Stopping service '%SERVICE_NAME%'...
net stop %SERVICE_NAME% >nul 2>&1

REM Remove the service
echo Removing service '%SERVICE_NAME%'...
"%SCRIPT_DIR%nssm.exe" remove %SERVICE_NAME% confirm

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================================
    echo Service uninstallation complete!
    echo ===================================================================
    echo.
    echo The RCN Valuation Engine service has been successfully uninstalled.
    echo.
    echo You can still run the API manually using start_rcn.bat
    echo.
) else (
    echo.
    echo ===================================================================
    echo Service uninstallation failed!
    echo ===================================================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause