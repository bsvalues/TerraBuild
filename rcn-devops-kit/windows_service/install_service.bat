@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Service Setup
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
set "SERVICE_DISPLAY_NAME=TerraFusionBuild RCN Valuation Engine"
set "SERVICE_DESCRIPTION=Provides RCN valuation API for property assessments"

:: Check if NSSM exists
if not exist "%NSSM_PATH%" (
    echo Error: NSSM executable not found at %NSSM_PATH%
    echo Please ensure the NSSM utility is properly installed.
    pause
    exit /b 1
)

:: Check if service already exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo Service %SERVICE_NAME% already exists.
    echo To reinstall, please run uninstall_service.bat first.
    pause
    exit /b 1
)

echo Installing %SERVICE_DISPLAY_NAME% as a Windows service...
echo.

:: Create logs directory if it doesn't exist
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"

:: Get Python path
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo Python not found in PATH. Please ensure Python is installed.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('where python') do set PYTHON_PATH=%%i

:: Install the service
"%NSSM_PATH%" install "%SERVICE_NAME%" "%PYTHON_PATH%"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppParameters "%INSTALL_DIR%\rcn_api_stub.py"
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "%SERVICE_DISPLAY_NAME%"
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "%SERVICE_DESCRIPTION%"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%INSTALL_DIR%"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%INSTALL_DIR%\logs\rcn_service_stdout.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%INSTALL_DIR%\logs\rcn_service_stderr.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStopMethodSkip 0
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStopMethodConsole 1500
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStopMethodWindow 1500
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStopMethodThreads 1500
"%NSSM_PATH%" set "%SERVICE_NAME%" AppThrottle 5000
"%NSSM_PATH%" set "%SERVICE_NAME%" AppExit Default Restart
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRestartDelay 5000
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START

:: Start the service
echo Starting service...
net start "%SERVICE_NAME%"
if %errorLevel% neq 0 (
    echo Failed to start service. Please check logs for details.
    pause
    exit /b %errorLevel%
)

echo.
echo Service successfully installed and started.
echo.
echo The RCN Valuation Engine API is now running as a Windows service.
echo API URL: http://localhost:8000
echo.
echo To uninstall the service, run uninstall_service.bat
echo.

pause