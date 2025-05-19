@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Service Uninstall
echo =====================================================
echo.

setlocal

:: Define service name
set SERVICE_NAME=TerraFusionRCNEngine
set INSTALL_DIR=%~dp0
set NSSM_PATH=%INSTALL_DIR%\bin\nssm.exe

:: Check if NSSM exists
if not exist "%NSSM_PATH%" (
    echo Error: NSSM (Non-Sucking Service Manager) not found at %NSSM_PATH%
    echo Please download NSSM from http://nssm.cc and place it in the bin directory.
    echo.
    goto :error
)

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    echo.
    goto :error
)

:: Check if service exists
"%NSSM_PATH%" status "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo Service "%SERVICE_NAME%" is not installed.
    echo.
    goto :end
)

echo Checking if service is running...

:: Check if the service is running
sc query "%SERVICE_NAME%" | find "STATE" | find "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo Stopping service "%SERVICE_NAME%"...
    net stop "%SERVICE_NAME%"
    
    if %errorlevel% neq 0 (
        echo Warning: Failed to stop the service. It may be in use or already stopped.
        
        :: Ask to force remove
        set /p FORCE_REMOVE=Force remove the service? (Y/N): 
        
        if /i not "%FORCE_REMOVE%"=="Y" (
            echo Uninstallation cancelled.
            goto :end
        )
    )
)

echo Removing service "%SERVICE_NAME%"...
"%NSSM_PATH%" remove "%SERVICE_NAME%" confirm

if %errorlevel% equ 0 (
    echo Service "%SERVICE_NAME%" has been successfully removed.
) else (
    echo Error: Failed to remove service "%SERVICE_NAME%".
    goto :error
)

echo.
echo Service uninstallation complete!
echo.

goto :end

:error
echo.
echo Service uninstallation failed. Please fix the errors above and try again.
exit /b 1

:end
pause