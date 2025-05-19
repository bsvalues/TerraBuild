@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Windows Service Uninstallation
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

REM Check if NSSM is available
if not exist windows_service\nssm.exe (
    echo Error: NSSM (Non-Sucking Service Manager) not found.
    echo Please make sure nssm.exe is in the windows_service directory.
    pause
    exit /b 1
)

REM Check if the service exists
sc query TerraFusionRCN >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo The TerraFusionRCN service is not installed.
    pause
    exit /b 0
)

REM Stop the service
echo Stopping the TerraFusionRCN service...
net stop TerraFusionRCN >nul 2>&1

REM Remove the service
echo Removing the TerraFusionRCN service...
windows_service\nssm.exe remove TerraFusionRCN confirm

echo.
echo The TerraFusionRCN service has been removed.
echo You can reinstall it any time by running install_service.bat.
echo.
pause