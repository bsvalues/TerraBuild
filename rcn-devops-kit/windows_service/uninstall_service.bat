@echo off
echo ====================================================
echo TerraFusionBuild RCN Valuation Engine - Service Uninstaller
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

REM Check if NSSM is available
set "SCRIPT_DIR=%~dp0"
if not exist "%SCRIPT_DIR%\nssm.exe" (
    echo NSSM (Non-Sucking Service Manager) not found.
    echo Please run install_service.bat first to download NSSM.
    echo.
    pause
    exit /b 1
)

REM Check if service exists
sc query RcnValuationEngine >nul 2>&1
if %errorlevel% neq 0 (
    echo The RCN Valuation Engine service is not installed.
    echo.
    pause
    exit /b 1
)

echo Stopping the RCN Valuation Engine service...
"%SCRIPT_DIR%\nssm.exe" stop RcnValuationEngine
if %errorlevel% neq 0 (
    echo Warning: Failed to stop the service. It may already be stopped.
)

echo Removing the RCN Valuation Engine service...
"%SCRIPT_DIR%\nssm.exe" remove RcnValuationEngine confirm
if %errorlevel% neq 0 (
    echo Failed to remove the service.
    echo.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo RCN Valuation Engine service has been successfully uninstalled.
echo ====================================================
echo.

pause