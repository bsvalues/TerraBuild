@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Service Install
echo =====================================================
echo.

setlocal

set INSTALL_DIR=%~dp0..
set NSSM_PATH=%~dp0bin\nssm.exe
set SERVICE_NAME=TerraFusionRCN
set SERVICE_DISPLAY_NAME=TerraFusion RCN Valuation Engine
set SERVICE_DESCRIPTION=Provides RCN (Replacement Cost New) valuation API services for building assessment.
set LOG_DIR=%INSTALL_DIR%\logs
set PORT=8080

:: Check for administrative privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Administrative privileges required.
    echo Please run this script as Administrator.
    goto :error
)

:: Check if NSSM is available
if not exist "%NSSM_PATH%" (
    echo Error: NSSM (Non-Sucking Service Manager) not found at %NSSM_PATH%
    echo Please download NSSM from http://nssm.cc/ and place in the bin directory.
    goto :error
)

:: Check if service already exists
%NSSM_PATH% status %SERVICE_NAME% >nul 2>&1
if %errorlevel% equ 0 (
    echo Service '%SERVICE_NAME%' already exists. Removing...
    call "%~dp0uninstall_service.bat" quiet
    timeout /t 2 >nul
)

:: Create logs directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: Determine if using executable or script
if exist "%INSTALL_DIR%\dist\rcn_valuation_engine.exe" (
    echo Using standalone executable version...
    set SERVICE_EXE=%INSTALL_DIR%\dist\rcn_valuation_engine.exe
    set SERVICE_ARGS=
) else (
    echo Using Python script version...
    if not exist "%INSTALL_DIR%\venv\Scripts\python.exe" (
        echo Error: Python virtual environment not found.
        echo Please run install_deps.bat first to set up the environment.
        goto :error
    )
    set SERVICE_EXE=%INSTALL_DIR%\venv\Scripts\python.exe
    set SERVICE_ARGS=%INSTALL_DIR%\rcn_api_stub.py
)

echo Installing service '%SERVICE_NAME%'...
%NSSM_PATH% install %SERVICE_NAME% "%SERVICE_EXE%" %SERVICE_ARGS%
if %errorlevel% neq 0 (
    echo Error: Failed to install service.
    goto :error
)

echo Configuring service...
%NSSM_PATH% set %SERVICE_NAME% DisplayName "%SERVICE_DISPLAY_NAME%"
%NSSM_PATH% set %SERVICE_NAME% Description "%SERVICE_DESCRIPTION%"
%NSSM_PATH% set %SERVICE_NAME% AppDirectory "%INSTALL_DIR%"
%NSSM_PATH% set %SERVICE_NAME% AppStdout "%LOG_DIR%\service_stdout.log"
%NSSM_PATH% set %SERVICE_NAME% AppStderr "%LOG_DIR%\service_stderr.log"
%NSSM_PATH% set %SERVICE_NAME% AppRotateFiles 1
%NSSM_PATH% set %SERVICE_NAME% AppRotateBytes 1048576
%NSSM_PATH% set %SERVICE_NAME% AppEnvironmentExtra "PORT=%PORT%"
%NSSM_PATH% set %SERVICE_NAME% Start SERVICE_AUTO_START
%NSSM_PATH% set %SERVICE_NAME% ObjectName LocalSystem
%NSSM_PATH% set %SERVICE_NAME% Type SERVICE_WIN32_OWN_PROCESS

echo Starting service...
%NSSM_PATH% start %SERVICE_NAME%
if %errorlevel% neq 0 (
    echo Warning: Failed to start service. You may need to start it manually.
) else (
    echo Service started successfully.
)

echo.
echo Service installation complete!
echo.
echo Service Details:
echo - Name: %SERVICE_NAME%
echo - Display Name: %SERVICE_DISPLAY_NAME%
echo - API available at: http://localhost:%PORT%/
echo - Documentation available at: http://localhost:%PORT%/docs
echo - UI available at: http://localhost:%PORT%/ui
echo.
echo To uninstall the service, run uninstall_service.bat as Administrator.
echo To manually start/stop the service, use Windows Services console or the following commands:
echo   sc start %SERVICE_NAME%
echo   sc stop %SERVICE_NAME%
echo.

goto :end

:error
echo.
echo Service installation failed. Please fix the errors above and try again.
exit /b 1

:end
if "%1"=="quiet" exit /b 0
pause