@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Package Creator
echo =====================================================
echo.

setlocal

set "PACKAGE_NAME=TerraFusionBuild_RCN_Valuation_Engine_v1.0.0"
set "OUTPUT_DIR=%~dp0\dist"

:: Create output directory if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: Check if existing package exists and remove it
if exist "%OUTPUT_DIR%\%PACKAGE_NAME%.zip" del "%OUTPUT_DIR%\%PACKAGE_NAME%.zip"

echo Creating deployment package...
echo.

:: Check for required files
if not exist "rcn_api_stub.py" (
    echo Error: rcn_api_stub.py not found. Required for package creation.
    goto :error
)

if not exist "build_exe.bat" (
    echo Error: build_exe.bat not found. Required for package creation.
    goto :error
)

if not exist "install_deps.bat" (
    echo Error: install_deps.bat not found. Required for package creation.
    goto :error
)

:: Create a temporary directory for the package contents
set "TEMP_DIR=%TEMP%\rcn_package_%RANDOM%"
mkdir "%TEMP_DIR%" 2>nul

:: Copy files to the temporary directory
echo Copying core files...
xcopy /Y "*.py" "%TEMP_DIR%\"
xcopy /Y "*.bat" "%TEMP_DIR%\"
xcopy /Y "*.json" "%TEMP_DIR%\"
if exist ".env.example" xcopy /Y ".env.example" "%TEMP_DIR%\"
if exist "requirements.txt" xcopy /Y "requirements.txt" "%TEMP_DIR%\"
if exist "LICENSE.txt" xcopy /Y "LICENSE.txt" "%TEMP_DIR%\"
if exist "README.md" xcopy /Y "README.md" "%TEMP_DIR%\"
if exist "api_spec.json" xcopy /Y "api_spec.json" "%TEMP_DIR%\"
if exist "PRD.md" xcopy /Y "PRD.md" "%TEMP_DIR%\"

echo Copying sample data...
if exist "sample_data" (
    mkdir "%TEMP_DIR%\sample_data" 2>nul
    xcopy /Y /S "sample_data\*" "%TEMP_DIR%\sample_data\"
)

echo Copying HTML UI files...
if exist "html_ui" (
    mkdir "%TEMP_DIR%\html_ui" 2>nul
    xcopy /Y /S "html_ui\*" "%TEMP_DIR%\html_ui\"
)

echo Copying Windows service files...
if exist "windows_service" (
    mkdir "%TEMP_DIR%\windows_service" 2>nul
    xcopy /Y /S "windows_service\*" "%TEMP_DIR%\windows_service\"
)

:: Create ZIP file using PowerShell
echo Creating ZIP package...
powershell -command "Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('%TEMP_DIR%', '%OUTPUT_DIR%\%PACKAGE_NAME%.zip');"

:: Check if the ZIP file was created successfully
if exist "%OUTPUT_DIR%\%PACKAGE_NAME%.zip" (
    echo.
    echo Deployment package created successfully!
    echo.
    echo Package location: %OUTPUT_DIR%\%PACKAGE_NAME%.zip
    echo.
) else (
    echo.
    echo Error: Failed to create deployment package.
    goto :error
)

:: Clean up temporary directory
rmdir /S /Q "%TEMP_DIR%" 2>nul

echo Package contains:
echo  - RCN Valuation Engine API
echo  - Sample data files
echo  - Windows service wrapper
echo  - HTML dashboard
echo  - Installation and setup scripts
echo.
echo This package can be deployed via:
echo  1. Direct copy to USB drive for portable use
echo  2. Enterprise IT deployment (MSI package)
echo  3. Manual installation on a server
echo.

goto :end

:error
echo.
echo Package creation failed. Please check the errors above.
exit /b 1

:end
pause