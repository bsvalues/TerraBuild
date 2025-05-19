@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Service Install
echo =====================================================
echo.

setlocal

:: Define service name and display name
set SERVICE_NAME=TerraFusionRCNEngine
set DISPLAY_NAME=TerraFusionBuild RCN Valuation Engine
set SERVICE_DESCRIPTION=Provides RCN calculation capabilities for building valuation and assessment
set INSTALL_DIR=%~dp0
set ROOT_DIR=%INSTALL_DIR%\..
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

:: Check if service already exists
"%NSSM_PATH%" status "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo Service "%SERVICE_NAME%" is already installed.
    echo To remove it, run uninstall_service.bat
    echo To restart it, run: net stop %SERVICE_NAME% && net start %SERVICE_NAME%
    echo.
    goto :end
)

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in your PATH.
    echo Please run install_deps.bat first.
    goto :error
)

:: Check if the executable exists
if exist "%ROOT_DIR%\dist\rcn_valuation_engine.exe" (
    set EXE_PATH=%ROOT_DIR%\dist\rcn_valuation_engine.exe
) else if exist "%ROOT_DIR%\venv\Scripts\python.exe" (
    set EXE_PATH=%ROOT_DIR%\venv\Scripts\python.exe
    set EXE_ARGS=%ROOT_DIR%\rcn_api_stub.py
) else (
    echo Error: Neither the compiled executable nor the Python environment was found.
    echo Please run build_exe.bat or install_deps.bat first.
    goto :error
)

echo Installing Windows service: %DISPLAY_NAME%
echo.

:: Create work directory for service if it doesn't exist
if not exist "%ROOT_DIR%\service_logs" mkdir "%ROOT_DIR%\service_logs"

:: Install the service using NSSM
if defined EXE_ARGS (
    echo Installing service using Python interpreter...
    "%NSSM_PATH%" install "%SERVICE_NAME%" "%EXE_PATH%" %EXE_ARGS%
) else (
    echo Installing service using compiled executable...
    "%NSSM_PATH%" install "%SERVICE_NAME%" "%EXE_PATH%"
)

:: Configure service details
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "%DISPLAY_NAME%"
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "%SERVICE_DESCRIPTION%"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%ROOT_DIR%"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppEnvironmentExtra "PORT=8000"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppEnvironmentExtra "HOST=0.0.0.0"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%ROOT_DIR%\service_logs\service_stdout.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%ROOT_DIR%\service_logs\service_stderr.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateFiles 1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateBytes 10485760
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START
"%NSSM_PATH%" set "%SERVICE_NAME%" ObjectName LocalSystem

echo.
echo Service installation complete!
echo.
echo Start the service with the following command:
echo   net start %SERVICE_NAME%
echo.
echo Or start the service from the Windows Services management console.
echo.

:: Ask if the user wants to start the service now
set /p START_NOW=Do you want to start the service now? (Y/N): 

if /i "%START_NOW%"=="Y" (
    echo Starting service...
    net start %SERVICE_NAME%
    
    if %errorlevel% equ 0 (
        echo Service started successfully!
        echo The RCN Valuation Engine API is now available at http://localhost:8000
    ) else (
        echo Failed to start the service. Please check the logs in service_logs folder.
    )
) else (
    echo Service installed but not started.
    echo You can start it later using the Services management console or command:
    echo   net start %SERVICE_NAME%
)

goto :end

:error
echo.
echo Service installation failed. Please fix the errors above and try again.
exit /b 1

:end
pause