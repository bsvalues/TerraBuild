@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Service Removal
echo =====================================================
echo.

setlocal

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

:: Set paths
set "INSTALL_DIR=%~dp0.."
set "NSSM_PATH=%INSTALL_DIR%\windows_service\nssm.exe"
set "SERVICE_NAME=TerraFusionRCN"

:: Check if NSSM exists
if not exist "%NSSM_PATH%" (
    echo Error: NSSM executable not found at %NSSM_PATH%
    echo Attempting to remove service using native Windows commands...
    
    :: Try to stop the service
    sc stop "%SERVICE_NAME%" >nul 2>&1
    
    :: Try to remove the service
    sc delete "%SERVICE_NAME%" >nul 2>&1
    if %errorLevel% neq 0 (
        echo Failed to remove service. Please try again or remove manually.
        pause
        exit /b %errorLevel%
    ) else (
        echo Service removed successfully.
        pause
        exit /b 0
    )
)

:: Check if service exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% neq 0 (
    echo Service %SERVICE_NAME% does not exist or is already uninstalled.
    pause
    exit /b 0
)

echo Stopping service...
net stop "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% neq 0 (
    echo Warning: Failed to stop service, it may not be running.
    echo Proceeding with removal...
) else (
    echo Service stopped successfully.
)

echo.
echo Removing service...
"%NSSM_PATH%" remove "%SERVICE_NAME%" confirm
if %errorLevel% neq 0 (
    echo Failed to remove service. Please try again or remove manually.
    pause
    exit /b %errorLevel%
)

echo.
echo Service uninstalled successfully.
echo.

pause