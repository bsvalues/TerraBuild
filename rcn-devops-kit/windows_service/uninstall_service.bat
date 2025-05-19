@echo off
if not "%1"=="quiet" (
    echo =====================================================
    echo TerraFusionBuild RCN Valuation Engine - Service Uninstall
    echo =====================================================
    echo.
)

setlocal

set NSSM_PATH=%~dp0bin\nssm.exe
set SERVICE_NAME=TerraFusionRCN

:: Check for administrative privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    if not "%1"=="quiet" (
        echo Error: Administrative privileges required.
        echo Please run this script as Administrator.
    )
    goto :error
)

:: Check if NSSM is available
if not exist "%NSSM_PATH%" (
    if not "%1"=="quiet" (
        echo Error: NSSM (Non-Sucking Service Manager) not found at %NSSM_PATH%
        echo Please download NSSM from http://nssm.cc/ and place in the bin directory.
    )
    goto :error
)

:: Check if the service exists
%NSSM_PATH% status %SERVICE_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    if not "%1"=="quiet" (
        echo Service '%SERVICE_NAME%' is not installed.
    )
    goto :end
)

:: Stop the service if it's running
%NSSM_PATH% status %SERVICE_NAME% | findstr /C:"SERVICE_RUNNING" >nul
if %errorlevel% equ 0 (
    if not "%1"=="quiet" echo Stopping service '%SERVICE_NAME%'...
    %NSSM_PATH% stop %SERVICE_NAME% >nul 2>&1
    
    :: Wait for the service to stop (max 10 seconds)
    for /l %%i in (1, 1, 10) do (
        %NSSM_PATH% status %SERVICE_NAME% | findstr /C:"SERVICE_STOPPED" >nul
        if %errorlevel% equ 0 goto :remove_service
        timeout /t 1 >nul
    )
)

:remove_service
if not "%1"=="quiet" echo Removing service '%SERVICE_NAME%'...
%NSSM_PATH% remove %SERVICE_NAME% confirm >nul 2>&1

if %errorlevel% equ 0 (
    if not "%1"=="quiet" (
        echo Service '%SERVICE_NAME%' has been successfully removed.
    )
) else (
    if not "%1"=="quiet" (
        echo Warning: Failed to remove service '%SERVICE_NAME%'.
        echo You may need to remove it manually using the Services console.
    )
)

goto :end

:error
exit /b 1

:end
if not "%1"=="quiet" pause