@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Deployment Package
echo =====================================================
echo.

setlocal

set INSTALL_DIR=%~dp0
set OUTPUT_DIR=%INSTALL_DIR%\deployment
set PACKAGE_NAME=TerraFusionBuild_RCN_Valuation_Engine
set VERSION=1.0.0
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%

:: Check if executable exists or needs to be built
if not exist "%INSTALL_DIR%\dist\rcn_valuation_engine.exe" (
    echo Executable not found. Would you like to build it now?
    set /p BUILD_EXE=Build executable (Y/N): 
    
    if /i "%BUILD_EXE%"=="Y" (
        echo Running build_exe.bat...
        call "%INSTALL_DIR%\build_exe.bat"
        
        if %errorlevel% neq 0 (
            echo Error: Executable build failed.
            goto :error
        )
    ) else (
        echo Continuing without executable. Python runtime will be required on target system.
    )
)

echo Creating deployment package...

:: Create output directory
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: Clean previous package
if exist "%OUTPUT_DIR%\%PACKAGE_NAME%_%VERSION%.zip" del /q "%OUTPUT_DIR%\%PACKAGE_NAME%_%VERSION%.zip"
if exist "%OUTPUT_DIR%\%PACKAGE_NAME%" rd /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%"

:: Create package directory structure
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\sample_data"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\html_ui"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service\bin"

echo Copying files to package...

:: Copy README and documentation
echo. > "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo TerraFusionBuild RCN Valuation Engine v%VERSION% >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo ================================================= >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo This package contains the RCN Valuation Engine for property assessment. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo Quick Start: >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo 1. Run install_deps.bat to set up required dependencies (one-time setup) >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo 2. Run start_rcn.bat to start the RCN Valuation Engine API Server >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo 3. Open http://localhost:8000/ui in your web browser >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo Windows Service Installation: >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo - Run windows_service\install_service.bat as Administrator to install as a Windows service >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo - Run windows_service\uninstall_service.bat as Administrator to remove the service >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo For more information and support, contact TerraFusionBuild support. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"
echo Package created on: %date% %time% >> "%OUTPUT_DIR%\%PACKAGE_NAME%\README.txt"

:: Copy batch files
copy "%INSTALL_DIR%\start_rcn.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\"
copy "%INSTALL_DIR%\install_deps.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\"
copy "%INSTALL_DIR%\build_exe.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\"

:: Copy service scripts
copy "%INSTALL_DIR%\windows_service\install_service.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service\"
copy "%INSTALL_DIR%\windows_service\uninstall_service.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service\"

:: Copy sample data
copy "%INSTALL_DIR%\sample_data\*.json" "%OUTPUT_DIR%\%PACKAGE_NAME%\sample_data\"

:: Copy HTML UI
copy "%INSTALL_DIR%\html_ui\*.*" "%OUTPUT_DIR%\%PACKAGE_NAME%\html_ui\"

:: Copy API implementation
if exist "%INSTALL_DIR%\dist\rcn_valuation_engine.exe" (
    :: Copy compiled executable if available
    mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\dist"
    copy "%INSTALL_DIR%\dist\rcn_valuation_engine.exe" "%OUTPUT_DIR%\%PACKAGE_NAME%\dist\"
    echo Included standalone executable - no Python installation needed on target.
) else (
    :: Copy Python script if no executable
    copy "%INSTALL_DIR%\rcn_api_stub.py" "%OUTPUT_DIR%\%PACKAGE_NAME%\"
    echo Included Python script - Python installation required on target.
)

:: Copy NSSM if it exists
if exist "%INSTALL_DIR%\windows_service\bin\nssm.exe" (
    copy "%INSTALL_DIR%\windows_service\bin\nssm.exe" "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service\bin\"
    echo Included NSSM for Windows service support.
) else (
    echo NSSM not found. Windows service functionality will require manual NSSM installation.
    
    :: Create README for NSSM
    echo. > "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service\bin\README.txt"
    echo To enable Windows service support, download NSSM from http://nssm.cc/ >> "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service\bin\README.txt"
    echo and place nssm.exe in this directory. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\windows_service\bin\README.txt"
)

:: Create ZIP package
echo Creating final ZIP package...
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%OUTPUT_DIR%\%PACKAGE_NAME%', '%OUTPUT_DIR%\%PACKAGE_NAME%_%VERSION%_%TIMESTAMP%.zip')"

if %errorlevel% neq 0 (
    echo Error: Failed to create ZIP package.
    goto :error
)

echo.
echo Deployment package created successfully:
echo %OUTPUT_DIR%\%PACKAGE_NAME%_%VERSION%_%TIMESTAMP%.zip
echo.
echo The package includes:
echo - RCN Valuation Engine API
echo - Sample data for testing
echo - HTML UI for interactive usage
echo - Windows service scripts for persistent deployment
echo.

goto :end

:error
echo.
echo Package creation failed. Please fix the errors above and try again.
exit /b 1

:end
pause