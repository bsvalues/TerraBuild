@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - API Server
echo =====================================================
echo.

setlocal

set INSTALL_DIR=%~dp0
set VENV_NAME=venv
set PORT=8000
set HOST=0.0.0.0
set DEFAULT_BROWSER=chrome

:: Check if port number is provided as parameter
if not "%~1"=="" (
    if "%~1"=="--help" (
        echo Usage: start_rcn.bat [port] [--browser=chrome|edge|firefox|none]
        echo.
        echo Examples:
        echo   start_rcn.bat            - Start server on default port 8000
        echo   start_rcn.bat 8080       - Start server on port 8080
        echo   start_rcn.bat --browser=edge   - Start server and open in Edge browser
        echo   start_rcn.bat 9000 --browser=none  - Start server on port 9000 without opening browser
        echo.
        goto :end
    ) else (
        :: Check if the first parameter is a port number
        echo %~1 | findstr /r "^[0-9][0-9]*$" >nul
        if not errorlevel 1 (
            set PORT=%~1
        )
    )
)

:: Check if browser parameter is provided
for %%i in (%*) do (
    echo %%i | findstr /r /c:"--browser=" >nul
    if not errorlevel 1 (
        for /f "tokens=2 delims==" %%a in ("%%i") do (
            set DEFAULT_BROWSER=%%a
        )
    )
)

:: Check if Python virtual environment exists
if not exist "%INSTALL_DIR%\%VENV_NAME%" (
    echo Error: Python virtual environment not found.
    echo Please run install_deps.bat first to set up the environment.
    goto :error
)

:: Check if standalone executable exists and use that if available
if exist "%INSTALL_DIR%\dist\rcn_valuation_engine.exe" (
    echo Standalone executable found, using it instead of Python script.
    set USE_EXE=1
) else (
    set USE_EXE=0
)

echo Starting TerraFusionBuild RCN Valuation Engine API Server...
echo.
echo Server will be available at:
echo   http://localhost:%PORT%/
echo   http://%HOST%:%PORT%/ (for access from other devices)
echo.
echo Documentation will be available at:
echo   http://localhost:%PORT%/docs
echo.
echo UI will be available at:
echo   http://localhost:%PORT%/ui
echo.
echo Press Ctrl+C to stop the server.
echo.

if "%DEFAULT_BROWSER%"=="none" (
    echo Browser auto-launch disabled.
) else (
    echo Will open browser automatically in 3 seconds...
    
    :: Create a temporary VBS script to open the browser without command prompt
    echo Set objShell = CreateObject("WScript.Shell") > "%TEMP%\open_browser.vbs"
    
    if "%DEFAULT_BROWSER%"=="edge" (
        echo objShell.Run """microsoft-edge:http://localhost:%PORT%/ui""", 1, False >> "%TEMP%\open_browser.vbs"
    ) else if "%DEFAULT_BROWSER%"=="firefox" (
        echo objShell.Run """firefox.exe http://localhost:%PORT%/ui""", 1, False >> "%TEMP%\open_browser.vbs"
    ) else (
        echo objShell.Run """chrome.exe http://localhost:%PORT%/ui""", 1, False >> "%TEMP%\open_browser.vbs"
    )
    
    :: Schedule browser opening after a delay
    ping -n 4 127.0.0.1 > nul
    start /b wscript.exe "%TEMP%\open_browser.vbs"
)

:: Start the server
if %USE_EXE%==1 (
    echo Starting executable version...
    start /b "RCN Valuation Engine" "%INSTALL_DIR%\dist\rcn_valuation_engine.exe"
) else (
    echo Starting Python version...
    :: Activate virtual environment and start the server
    call "%INSTALL_DIR%\%VENV_NAME%\Scripts\activate"
    
    :: Set environment variables for the server
    set HOST=%HOST%
    set PORT=%PORT%
    
    :: Start the FastAPI server
    python "%INSTALL_DIR%\rcn_api_stub.py"
    
    :: Deactivate virtual environment
    call "%INSTALL_DIR%\%VENV_NAME%\Scripts\deactivate"
)

goto :end

:error
echo.
echo Error starting the server. Please check the messages above.
exit /b 1

:end