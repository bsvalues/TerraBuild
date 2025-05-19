@echo off
REM ======================================================================
REM TerraFusionBuild RCN Valuation Engine - Windows Service Uninstaller
REM
REM This script removes the RCN Valuation Engine Windows service.
REM Run as Administrator!
REM ======================================================================

echo.
echo TerraFusionBuild RCN Valuation Engine - Windows Service Uninstaller
echo ==================================================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script requires administrator privileges.
    echo Please right-click on the script and select "Run as Administrator".
    exit /b 1
)

REM Get script directory
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
cd /d "%ROOT_DIR%"

REM Check if the service exists
sc query TerraFusionRCN >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo The TerraFusionRCN service does not exist or is not installed.
    exit /b 0
)

REM Stop the service if running
echo Stopping TerraFusionRCN service...
net stop TerraFusionRCN >nul 2>&1

REM Check if NSSM exists
if not exist "%SCRIPT_DIR%nssm.exe" (
    echo NSSM not found in %SCRIPT_DIR%
    echo Attempting to uninstall service using SC command...
    sc delete TerraFusionRCN
) else (
    REM Remove the service
    echo Removing TerraFusionRCN service...
    "%SCRIPT_DIR%nssm.exe" remove TerraFusionRCN confirm
)

echo.
echo TerraFusionRCN service has been uninstalled.
echo.

exit /b 0