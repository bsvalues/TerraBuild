@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Dependencies Setup
echo =====================================================
echo.

setlocal

set INSTALL_DIR=%~dp0
set PYTHON_REQUIRED=3.8
set VENV_NAME=venv

echo Checking for Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found in PATH. Checking for Python in standard locations...
    
    if exist "%ProgramFiles%\Python38\python.exe" (
        set PYTHON_EXE="%ProgramFiles%\Python38\python.exe"
    ) else if exist "%ProgramFiles%\Python39\python.exe" (
        set PYTHON_EXE="%ProgramFiles%\Python39\python.exe"
    ) else if exist "%ProgramFiles%\Python310\python.exe" (
        set PYTHON_EXE="%ProgramFiles%\Python310\python.exe"
    ) else if exist "%ProgramFiles%\Python311\python.exe" (
        set PYTHON_EXE="%ProgramFiles%\Python311\python.exe"
    ) else if exist "%LocalAppData%\Programs\Python\Python38\python.exe" (
        set PYTHON_EXE="%LocalAppData%\Programs\Python\Python38\python.exe"
    ) else if exist "%LocalAppData%\Programs\Python\Python39\python.exe" (
        set PYTHON_EXE="%LocalAppData%\Programs\Python\Python39\python.exe"
    ) else if exist "%LocalAppData%\Programs\Python\Python310\python.exe" (
        set PYTHON_EXE="%LocalAppData%\Programs\Python\Python310\python.exe"
    ) else if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
        set PYTHON_EXE="%LocalAppData%\Programs\Python\Python311\python.exe"
    ) else (
        echo Error: Python 3.8 or higher is required but not found.
        echo Please install Python from https://www.python.org/downloads/
        echo and make sure it is added to PATH.
        echo.
        goto :error
    )
    
    echo Found Python at %PYTHON_EXE%
) else (
    set PYTHON_EXE=python
)

echo Checking Python version...
%PYTHON_EXE% -c "import sys; print(sys.version_info.major, sys.version_info.minor)" > temp.txt
set /p PYTHON_VERSION=<temp.txt
del temp.txt

for /f "tokens=1,2" %%a in ("%PYTHON_VERSION%") do (
    set PYTHON_MAJOR=%%a
    set PYTHON_MINOR=%%b
)

if %PYTHON_MAJOR% lss 3 (
    echo Error: Python 3.8 or higher is required.
    echo Current version: %PYTHON_MAJOR%.%PYTHON_MINOR%
    echo Please install a newer version of Python.
    goto :error
)

if %PYTHON_MAJOR% equ 3 (
    if %PYTHON_MINOR% lss 8 (
        echo Error: Python 3.8 or higher is required.
        echo Current version: %PYTHON_MAJOR%.%PYTHON_MINOR%
        echo Please install a newer version of Python.
        goto :error
    )
)

echo Python version check passed: %PYTHON_MAJOR%.%PYTHON_MINOR%
echo.

echo Creating Python virtual environment...
if exist "%INSTALL_DIR%\%VENV_NAME%" (
    echo Virtual environment already exists. Updating...
) else (
    %PYTHON_EXE% -m venv "%INSTALL_DIR%\%VENV_NAME%"
    if %errorlevel% neq 0 (
        echo Error: Failed to create virtual environment.
        goto :error
    )
    echo Virtual environment created successfully.
)

echo.
echo Activating virtual environment...
call "%INSTALL_DIR%\%VENV_NAME%\Scripts\activate"
if %errorlevel% neq 0 (
    echo Error: Failed to activate virtual environment.
    goto :error
)

echo.
echo Upgrading pip...
python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo Warning: Failed to upgrade pip, but continuing...
)

echo.
echo Installing required Python packages...
python -m pip install fastapi uvicorn python-dotenv pydantic
if %errorlevel% neq 0 (
    echo Error: Failed to install required packages.
    goto :error
)

echo.
echo Installing optional dependencies...
python -m pip install pyinstaller
if %errorlevel% neq 0 (
    echo Warning: Failed to install PyInstaller (needed only for executable building).
)

echo.
echo Creating Windows service directory structure...
if not exist "%INSTALL_DIR%\windows_service\bin" mkdir "%INSTALL_DIR%\windows_service\bin"

echo.
echo Checking for NSSM (Non-Sucking Service Manager)...
if not exist "%INSTALL_DIR%\windows_service\bin\nssm.exe" (
    echo NSSM (Non-Sucking Service Manager) is required for Windows service support.
    echo Please download it from http://nssm.cc/download and extract nssm.exe
    echo to %INSTALL_DIR%\windows_service\bin\nssm.exe
    
    echo.
    set /p DOWNLOAD_NSSM=Would you like the script to attempt to download NSSM for you? (Y/N): 
    
    if /i "%DOWNLOAD_NSSM%"=="Y" (
        echo Attempting to download NSSM...
        
        :: Create PowerShell script to download and extract NSSM
        echo $webClient = New-Object System.Net.WebClient > download_nssm.ps1
        echo $url = "https://nssm.cc/release/nssm-2.24.zip" >> download_nssm.ps1
        echo $outputFile = "%TEMP%\nssm.zip" >> download_nssm.ps1
        echo $webClient.DownloadFile($url, $outputFile) >> download_nssm.ps1
        echo Expand-Archive -Path $outputFile -DestinationPath "%TEMP%\nssm" -Force >> download_nssm.ps1
        echo $nssmExe = Get-ChildItem -Path "%TEMP%\nssm" -Recurse -Filter "nssm.exe" ^| Where-Object { $_.FullName -like "*win64*" } ^| Select-Object -First 1 >> download_nssm.ps1
        echo Copy-Item -Path $nssmExe.FullName -Destination "%INSTALL_DIR%\windows_service\bin\nssm.exe" -Force >> download_nssm.ps1
        
        powershell -ExecutionPolicy Bypass -File download_nssm.ps1
        del download_nssm.ps1
        
        if exist "%INSTALL_DIR%\windows_service\bin\nssm.exe" (
            echo NSSM downloaded and extracted successfully.
        ) else (
            echo Failed to download NSSM automatically.
            echo Please download it manually from http://nssm.cc/download
            echo and extract nssm.exe to %INSTALL_DIR%\windows_service\bin\nssm.exe
            echo.
            echo You can still use the RCN Valuation Engine without Windows service support.
        )
    ) else (
        echo Skipping NSSM download.
        echo You can still use the RCN Valuation Engine without Windows service support.
    )
) else (
    echo NSSM already exists.
)

echo.
echo Setup completed successfully!
echo.
echo To start the RCN Valuation Engine API:
echo   "%INSTALL_DIR%\start_rcn.bat"
echo.
echo To install as a Windows Service:
echo   "%INSTALL_DIR%\windows_service\install_service.bat"
echo.

:: Deactivate virtual environment
call "%INSTALL_DIR%\%VENV_NAME%\Scripts\deactivate"

goto :end

:error
echo.
echo Setup failed. Please fix the errors above and try again.
exit /b 1

:end
echo Press any key to exit...
pause > nul