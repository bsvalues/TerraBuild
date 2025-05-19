@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Deployment Package Creation
echo ===================================================================
echo.

REM Set package name with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"

set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "PACKAGE_NAME=TerraFusionBuild_RCN_Package_%TIMESTAMP%.zip"

REM Check for 7-Zip or PowerShell
where 7z >nul 2>&1
set HAS_7ZIP=%ERRORLEVEL%

REM Create temporary directory
set "TEMP_DIR=temp_package"
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

echo Preparing package files...

REM Copy main files
copy install_deps.bat %TEMP_DIR%\
copy start_rcn.bat %TEMP_DIR%\
copy rcn_api_stub.py %TEMP_DIR%\
copy README.md %TEMP_DIR%\

REM Create directories
mkdir %TEMP_DIR%\sample_data
mkdir %TEMP_DIR%\html_ui
mkdir %TEMP_DIR%\windows_service
mkdir %TEMP_DIR%\logs

REM Copy HTML UI files
copy html_ui\index.html %TEMP_DIR%\html_ui\

REM Copy Windows service scripts
copy windows_service\install_service.bat %TEMP_DIR%\windows_service\
copy windows_service\uninstall_service.bat %TEMP_DIR%\windows_service\

REM Create sample data files (if they don't exist yet)
call start_rcn.bat /nostart

REM Copy sample data files (if they exist)
if exist sample_data\cost_profiles.json copy sample_data\cost_profiles.json %TEMP_DIR%\sample_data\
if exist sample_data\depreciation_tables.json copy sample_data\depreciation_tables.json %TEMP_DIR%\sample_data\
if exist sample_data\example_building_inputs.json copy sample_data\example_building_inputs.json %TEMP_DIR%\sample_data\

REM Create a placeholder file for logs directory
echo # Log files will be stored here > %TEMP_DIR%\logs\README.txt

REM Create an info.txt file with build info
echo TerraFusionBuild RCN Valuation Engine Package > %TEMP_DIR%\info.txt
echo Created: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec% >> %TEMP_DIR%\info.txt
echo Version: 1.0.0 >> %TEMP_DIR%\info.txt
echo. >> %TEMP_DIR%\info.txt
echo Package Contents: >> %TEMP_DIR%\info.txt
echo - RCN API Server >> %TEMP_DIR%\info.txt
echo - Web UI Interface >> %TEMP_DIR%\info.txt
echo - Sample Cost Data >> %TEMP_DIR%\info.txt
echo - Windows Service Scripts >> %TEMP_DIR%\info.txt

REM Create the zip file
echo Creating deployment package...

if %HAS_7ZIP% EQU 0 (
    echo Using 7-Zip for compression...
    7z a -tzip "%PACKAGE_NAME%" "%TEMP_DIR%\*" -r
) else (
    echo Using PowerShell for compression...
    powershell -command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%PACKAGE_NAME%' -Force"
)

REM Clean up temporary directory
rmdir /s /q %TEMP_DIR%

if exist "%PACKAGE_NAME%" (
    echo.
    echo ===================================================================
    echo Package created successfully!
    echo ===================================================================
    echo.
    echo Package name: %PACKAGE_NAME%
    echo.
    echo The deployment package contains everything needed to install and run
    echo the TerraFusionBuild RCN Valuation Engine.
    echo.
) else (
    echo.
    echo ===================================================================
    echo Package creation failed!
    echo ===================================================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause