@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Dependencies Setup
echo =====================================================
echo.

setlocal

set INSTALL_DIR=%~dp0
set VENV_NAME=venv
set LOG_FILE=%INSTALL_DIR%\install_log.txt
set PYTHON_MIN_VERSION=3.8
set NSSM_URL=https://nssm.cc/release/nssm-2.24.zip
set NSSM_ZIP=%TEMP%\nssm.zip
set NSSM_DIR=%INSTALL_DIR%\windows_service\bin

:: Optional command line parameters
set PYTHON_PATH=%1

echo Installation starting at %date% %time% > "%LOG_FILE%"
echo Install directory: %INSTALL_DIR% >> "%LOG_FILE%"

:: Create necessary directories
echo Creating required directories...
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"
if not exist "%NSSM_DIR%" mkdir "%NSSM_DIR%"
if not exist "%INSTALL_DIR%\sample_data" mkdir "%INSTALL_DIR%\sample_data"
if not exist "%INSTALL_DIR%\html_ui" mkdir "%INSTALL_DIR%\html_ui"

:: Check for Python installation
if not "%PYTHON_PATH%"=="" (
    echo Using provided Python path: %PYTHON_PATH%
    set PYTHON_CMD=%PYTHON_PATH%
) else (
    echo Checking for Python installation...
    where python >nul 2>&1
    if %errorlevel% neq 0 (
        echo Error: Python not found in PATH.
        echo Please install Python %PYTHON_MIN_VERSION% or higher, or provide the path to the Python executable.
        echo Usage: %0 [path\to\python.exe]
        goto :error
    )
    set PYTHON_CMD=python
)

:: Check Python version
echo Checking Python version...
%PYTHON_CMD% -c "import sys; version=sys.version_info; print(f'{version.major}.{version.minor}.{version.micro}'); sys.exit(0 if version.major >= 3 and version.minor >= 8 else 1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python %PYTHON_MIN_VERSION% or higher is required.
    echo Current Python version:
    %PYTHON_CMD% --version
    goto :error
)

echo Python version check passed >> "%LOG_FILE%"
%PYTHON_CMD% --version >> "%LOG_FILE%"

:: Setup virtual environment
echo Setting up Python virtual environment...
if exist "%INSTALL_DIR%\%VENV_NAME%" (
    echo Virtual environment already exists. Do you want to recreate it?
    set /p RECREATE_VENV=Recreate virtual environment? (y/n): 
    if /i "%RECREATE_VENV%"=="y" (
        echo Removing existing virtual environment...
        rd /s /q "%INSTALL_DIR%\%VENV_NAME%"
    ) else (
        echo Using existing virtual environment.
        goto :install_deps
    )
)

echo Creating virtual environment...
%PYTHON_CMD% -m venv "%INSTALL_DIR%\%VENV_NAME%"
if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment.
    goto :error
)

:install_deps
:: Activate virtual environment and install dependencies
echo Installing Python dependencies...
call "%INSTALL_DIR%\%VENV_NAME%\Scripts\activate"

:: Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo Warning: Failed to upgrade pip. Continuing with installation...
)

:: Install required packages
echo Installing required packages...
python -m pip install fastapi uvicorn pydantic python-dotenv
if %errorlevel% neq 0 (
    echo Error: Failed to install required packages.
    goto :error
)

:: Download NSSM for Windows service functionality
if not exist "%NSSM_DIR%\nssm.exe" (
    echo Downloading NSSM for Windows service management...
    
    :: Try with PowerShell first (preferred)
    powershell -Command "& {try { Invoke-WebRequest -Uri '%NSSM_URL%' -OutFile '%NSSM_ZIP%'; Write-Host 'Download successful.' } catch { Write-Host 'Download failed using PowerShell.'; exit 1 }}"
    
    if %errorlevel% equ 0 (
        echo Extracting NSSM...
        powershell -Command "& {try { Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%NSSM_ZIP%', '%TEMP%\nssm'); Write-Host 'Extraction successful.' } catch { Write-Host 'Extraction failed.'; exit 1 }}"
        
        if %errorlevel% equ 0 (
            :: Find the nssm.exe and copy it to the bin directory
            for /r "%TEMP%\nssm" %%f in (nssm.exe) do (
                if exist "%%f" (
                    copy "%%f" "%NSSM_DIR%\"
                    echo NSSM installed successfully.
                    goto :nssm_done
                )
            )
            echo Warning: NSSM executable not found in extracted files.
        ) else (
            echo Warning: Failed to extract NSSM.
        )
    ) else (
        echo Warning: Failed to download NSSM.
    )
    
    echo.
    echo NSSM (Non-Sucking Service Manager) is required for Windows service functionality.
    echo Please download NSSM manually from http://nssm.cc/ and place nssm.exe in:
    echo %NSSM_DIR%
)

:nssm_done
:: Create example data files if they don't exist
if not exist "%INSTALL_DIR%\sample_data\example_building_inputs.json" (
    echo Creating sample data files...
    
    echo [
    echo   {
    echo     "use_type": "Residential",
    echo     "construction_type": "Wood Frame",
    echo     "sqft": 1800,
    echo     "year_built": 2010,
    echo     "quality_class": "B",
    echo     "locality_index": 1.05,
    echo     "condition": "Good",
    echo     "name": "Single Family Home"
    echo   },
    echo   {
    echo     "use_type": "Commercial",
    echo     "construction_type": "Steel Frame",
    echo     "sqft": 5000,
    echo     "year_built": 2015,
    echo     "quality_class": "A",
    echo     "locality_index": 1.15,
    echo     "condition": "Excellent",
    echo     "name": "Retail Store"
    echo   },
    echo   {
    echo     "use_type": "Industrial",
    echo     "construction_type": "Concrete",
    echo     "sqft": 12000,
    echo     "year_built": 2005,
    echo     "quality_class": "C+",
    echo     "locality_index": 0.95,
    echo     "condition": "Average",
    echo     "name": "Warehouse"
    echo   },
    echo   {
    echo     "use_type": "Agricultural",
    echo     "construction_type": "Wood Frame",
    echo     "sqft": 3600,
    echo     "year_built": 1995,
    echo     "quality_class": "D+",
    echo     "locality_index": 0.85,
    echo     "condition": "Fair",
    echo     "name": "Barn"
    echo   }
    echo ] > "%INSTALL_DIR%\sample_data\example_building_inputs.json"
    
    echo {
    echo   "quality_factors": {
    echo     "A+": 1.30,
    echo     "A": 1.20,
    echo     "B+": 1.15,
    echo     "B": 1.10,
    echo     "C+": 1.05,
    echo     "C": 1.00,
    echo     "D+": 0.95,
    echo     "D": 0.90,
    echo     "E": 0.80
    echo   },
    echo   "depreciation_table": {
    echo     "Excellent": 0.70,
    echo     "Good": 0.85,
    echo     "Average": 1.00,
    echo     "Fair": 1.15,
    echo     "Poor": 1.30
    echo   },
    echo   "base_costs": {
    echo     "Residential": {
    echo       "Wood Frame": 175.00,
    echo       "Masonry": 185.00,
    echo       "Steel Frame": 195.00,
    echo       "Concrete": 205.00
    echo     },
    echo     "Commercial": {
    echo       "Wood Frame": 165.00,
    echo       "Masonry": 180.00,
    echo       "Steel Frame": 210.00,
    echo       "Concrete": 225.00
    echo     },
    echo     "Industrial": {
    echo       "Wood Frame": 145.00,
    echo       "Masonry": 160.00,
    echo       "Steel Frame": 185.00,
    echo       "Concrete": 200.00
    echo     },
    echo     "Agricultural": {
    echo       "Wood Frame": 95.00,
    echo       "Masonry": 115.00,
    echo       "Steel Frame": 135.00,
    echo       "Concrete": 155.00
    echo     }
    echo   }
    echo } > "%INSTALL_DIR%\sample_data\cost_profiles.json"
)

:: Create a simple HTML UI file if it doesn't exist
if not exist "%INSTALL_DIR%\html_ui\index.html" (
    echo Creating basic HTML UI...
    (
        echo ^<!DOCTYPE html^>
        echo ^<html^>
        echo ^<head^>
        echo     ^<title^>TerraFusionBuild RCN Valuation Engine^</title^>
        echo     ^<style^>
        echo         body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        echo         h1 { color: #2c3e50; }
        echo         .logo { text-align: center; margin-bottom: 20px; }
        echo         .form-group { margin-bottom: 15px; }
        echo         label { display: block; margin-bottom: 5px; font-weight: bold; }
        echo         input, select { width: 100%%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        echo         button { background: #2980b9; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        echo         button:hover { background: #3498db; }
        echo         #result { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; display: none; }
        echo         .error { color: #e74c3c; margin-top: 10px; }
        echo         .info-box { background: #f8f9fa; border-left: 4px solid #2980b9; padding: 10px 15px; margin-bottom: 20px; }
        echo         .calculation { background: #eaf2f8; padding: 10px; border-radius: 4px; margin-top: 10px; }
        echo         .result-value { font-size: 24px; font-weight: bold; color: #2c3e50; margin: 10px 0; }
        echo         .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        echo         .footer { text-align: center; margin-top: 40px; font-size: 0.9em; color: #7f8c8d; }
        echo     ^</style^>
        echo ^</head^>
        echo ^<body^>
        echo     ^<div class="logo"^>
        echo         ^<h1^>TerraFusionBuild^</h1^>
        echo         ^<h2^>RCN Valuation Engine^</h2^>
        echo     ^</div^>
        echo.
        echo     ^<div class="info-box"^>
        echo         ^<p^>Enter building details below to calculate the Replacement Cost New ^(RCN^) value for property assessment.^</p^>
        echo     ^</div^>
        echo.
        echo     ^<div class="card"^>
        echo         ^<div class="form-group"^>
        echo             ^<label for="use_type"^>Building Use Type:^</label^>
        echo             ^<select id="use_type"^>
        echo                 ^<option value="Residential"^>Residential^</option^>
        echo                 ^<option value="Commercial"^>Commercial^</option^>
        echo                 ^<option value="Industrial"^>Industrial^</option^>
        echo                 ^<option value="Agricultural"^>Agricultural^</option^>
        echo             ^</select^>
        echo         ^</div^>
        echo.
        echo         ^<div class="form-group"^>
        echo             ^<label for="construction_type"^>Construction Type:^</label^>
        echo             ^<select id="construction_type"^>
        echo                 ^<option value="Wood Frame"^>Wood Frame^</option^>
        echo                 ^<option value="Masonry"^>Masonry^</option^>
        echo                 ^<option value="Steel Frame"^>Steel Frame^</option^>
        echo                 ^<option value="Concrete"^>Concrete^</option^>
        echo             ^</select^>
        echo         ^</div^>
        echo.
        echo         ^<div class="form-group"^>
        echo             ^<label for="sqft"^>Square Footage:^</label^>
        echo             ^<input type="number" id="sqft" min="1" value="1800"^>
        echo         ^</div^>
        echo.
        echo         ^<div class="form-group"^>
        echo             ^<label for="year_built"^>Year Built:^</label^>
        echo             ^<input type="number" id="year_built" min="1800" max="2025" value="2010"^>
        echo         ^</div^>
        echo.
        echo         ^<div class="form-group"^>
        echo             ^<label for="quality_class"^>Quality Class:^</label^>
        echo             ^<select id="quality_class"^>
        echo                 ^<option value="A+"^>A+ ^(Premium^)^</option^>
        echo                 ^<option value="A"^>A ^(Excellent^)^</option^>
        echo                 ^<option value="B+"^>B+ ^(Very Good^)^</option^>
        echo                 ^<option value="B" selected^>B ^(Good^)^</option^>
        echo                 ^<option value="C+"^>C+ ^(Above Average^)^</option^>
        echo                 ^<option value="C"^>C ^(Average^)^</option^>
        echo                 ^<option value="D+"^>D+ ^(Below Average^)^</option^>
        echo                 ^<option value="D"^>D ^(Low^)^</option^>
        echo                 ^<option value="E"^>E ^(Minimal^)^</option^>
        echo             ^</select^>
        echo         ^</div^>
        echo.
        echo         ^<div class="form-group"^>
        echo             ^<label for="locality_index"^>Locality Index ^(0.5-2.0^):^</label^>
        echo             ^<input type="number" id="locality_index" min="0.5" max="2.0" step="0.01" value="1.05"^>
        echo         ^</div^>
        echo.
        echo         ^<div class="form-group"^>
        echo             ^<label for="condition"^>Condition:^</label^>
        echo             ^<select id="condition"^>
        echo                 ^<option value="Excellent"^>Excellent^</option^>
        echo                 ^<option value="Good" selected^>Good^</option^>
        echo                 ^<option value="Average"^>Average^</option^>
        echo                 ^<option value="Fair"^>Fair^</option^>
        echo                 ^<option value="Poor"^>Poor^</option^>
        echo             ^</select^>
        echo         ^</div^>
        echo.
        echo         ^<button id="calculate"^>Calculate RCN Value^</button^>
        echo         ^<div id="error" class="error"^>^</div^>
        echo     ^</div^>
        echo.
        echo     ^<div id="result" class="card"^>
        echo         ^<h2^>Calculation Results^</h2^>
        echo         ^<div id="result_content"^>^</div^>
        echo     ^</div^>
        echo.
        echo     ^<div class="footer"^>
        echo         ^<p^>TerraFusionBuild RCN Valuation Engine v1.0.0 | ^&copy; 2025 TerraFusionBuild^</p^>
        echo         ^<p^>^<a href="/docs"^>API Documentation^</a^>^</p^>
        echo     ^</div^>
        echo.
        echo     ^<script^>
        echo         document.getElementById^('calculate'^).addEventListener^('click', async ^(^) =^> {
        echo             const useType = document.getElementById^('use_type'^).value;
        echo             const constructionType = document.getElementById^('construction_type'^).value;
        echo             const sqft = parseFloat^(document.getElementById^('sqft'^).value^);
        echo             const yearBuilt = parseInt^(document.getElementById^('year_built'^).value^);
        echo             const qualityClass = document.getElementById^('quality_class'^).value;
        echo             const localityIndex = parseFloat^(document.getElementById^('locality_index'^).value^);
        echo             const condition = document.getElementById^('condition'^).value;
        echo.
        echo             // Validate inputs
        echo             if ^(isNaN^(sqft^) ^|^| sqft ^<= 0^) {
        echo                 document.getElementById^('error'^).textContent = 'Square footage must be a positive number';
        echo                 return;
        echo             }
        echo.
        echo             if ^(isNaN^(yearBuilt^) ^|^| yearBuilt ^< 1800 ^|^| yearBuilt ^> 2025^) {
        echo                 document.getElementById^('error'^).textContent = 'Year built must be between 1800 and 2025';
        echo                 return;
        echo             }
        echo.
        echo             if ^(isNaN^(localityIndex^) ^|^| localityIndex ^< 0.5 ^|^| localityIndex ^> 2.0^) {
        echo                 document.getElementById^('error'^).textContent = 'Locality index must be between 0.5 and 2.0';
        echo                 return;
        echo             }
        echo.
        echo             const data = {
        echo                 use_type: useType,
        echo                 construction_type: constructionType,
        echo                 sqft: sqft,
        echo                 year_built: yearBuilt,
        echo                 quality_class: qualityClass,
        echo                 locality_index: localityIndex,
        echo                 condition: condition
        echo             };
        echo.
        echo             try {
        echo                 document.getElementById^('error'^).textContent = '';
        echo                 document.getElementById^('result'^).style.display = 'none';
        echo.
        echo                 const response = await fetch^('/rcn/calculate', {
        echo                     method: 'POST',
        echo                     headers: {
        echo                         'Content-Type': 'application/json'
        echo                     },
        echo                     body: JSON.stringify^(data^)
        echo                 }^);
        echo.
        echo                 if ^(!response.ok^) {
        echo                     const errorData = await response.json^(^);
        echo                     throw new Error^(errorData.detail ^|^| errorData.message ^|^| 'Error calculating RCN'^);
        echo                 }
        echo.
        echo                 const result = await response.json^(^);
        echo.
        echo                 // Format the result
        echo                 let resultHtml = `
        echo                     ^<div class="result-value"^>$${result.depreciated_rcn.toLocaleString^(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}^)}^</div^>
        echo                     ^<p^>^<strong^>Building Type:^</strong^> ${data.use_type}, ${data.construction_type}^</p^>
        echo                     ^<p^>^<strong^>Building Size:^</strong^> ${data.sqft.toLocaleString^(^)} sq ft^</p^>
        echo                     ^<p^>^<strong^>Effective Age:^</strong^> ${result.effective_age} years ^(built in ${data.year_built}^)^</p^>
        echo                     ^<p^>^<strong^>Confidence Level:^</strong^> ${result.confidence_level}^</p^>
        echo.
        echo                     ^<h3^>Calculation Details^</h3^>
        echo                     ^<div class="calculation"^>
        echo                         ^<p^>^<strong^>Base Cost:^</strong^> $${result.base_cost.toFixed^(2^)} per sq ft^</p^>
        echo                         ^<p^>^<strong^>Quality Factor:^</strong^> ${result.quality_factor.toFixed^(2^)} ^(${data.quality_class}^)^</p^>
        echo                         ^<p^>^<strong^>Locality Factor:^</strong^> ${result.locality_factor.toFixed^(2^)}^</p^>
        echo                         ^<p^>^<strong^>Adjusted Cost:^</strong^> $${^(result.base_cost * result.quality_factor * result.locality_factor^).toFixed^(2^)} per sq ft^</p^>
        echo                         ^<p^>^<strong^>Adjusted RCN:^</strong^> $${result.adjusted_rcn.toLocaleString^(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}^)}^</p^>
        echo                         ^<p^>^<strong^>Depreciation:^</strong^> ${result.depreciation_pct.toFixed^(1^)}%% ^(${data.condition} condition^)^</p^>
        echo                         ^<p^>^<strong^>Final RCN:^</strong^> $${result.depreciated_rcn.toLocaleString^(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}^)}^</p^>
        echo                     ^</div^>
        echo.
        echo                     ^<h3^>Notes^</h3^>
        echo                     ^<ul^>
        echo                 `;
        echo.
        echo                 for ^(const note of result.calculation_notes^) {
        echo                     resultHtml += `^<li^>${note}^</li^>`;
        echo                 }
        echo.
        echo                 resultHtml += `
        echo                     ^</ul^>
        echo                     ^<p^>^<strong^>Calculation Date:^</strong^> ${new Date^(result.calculation_date^).toLocaleString^(^)}^</p^>
        echo                 `;
        echo.
        echo                 document.getElementById^('result_content'^).innerHTML = resultHtml;
        echo                 document.getElementById^('result'^).style.display = 'block';
        echo             } catch ^(error^) {
        echo                 document.getElementById^('error'^).textContent = error.message;
        echo                 document.getElementById^('result'^).style.display = 'none';
        echo             }
        echo         }^);
        echo.
        echo         // Load examples
        echo         async function loadExamples^(^) {
        echo             try {
        echo                 const response = await fetch^('/examples'^);
        echo                 if ^(response.ok^) {
        echo                     const examples = await response.json^(^);
        echo                     // Could implement an examples dropdown here
        echo                 }
        echo             } catch ^(error^) {
        echo                 console.error^('Failed to load examples:', error^);
        echo             }
        echo         }
        echo.
        echo         // Check API status on page load
        echo         async function checkApiStatus^(^) {
        echo             try {
        echo                 const response = await fetch^('/health'^);
        echo                 if ^(!response.ok^) {
        echo                     document.getElementById^('error'^).textContent = 'API service unavailable. Please try again later.';
        echo                 }
        echo             } catch ^(error^) {
        echo                 document.getElementById^('error'^).textContent = 'Cannot connect to API. Please ensure the service is running.';
        echo             }
        echo         }
        echo.
        echo         // Initialize
        echo         window.addEventListener^('load', ^(^) =^> {
        echo             checkApiStatus^(^);
        echo             loadExamples^(^);
        echo         }^);
        echo     ^</script^>
        echo ^</body^>
        echo ^</html^>
    ) > "%INSTALL_DIR%\html_ui\index.html"
)

:: Deactivate virtual environment
call "%INSTALL_DIR%\%VENV_NAME%\Scripts\deactivate"

echo.
echo Installation completed successfully!
echo.
echo To start the RCN Valuation Engine:
echo   %INSTALL_DIR%\start_rcn.bat
echo.
echo To install as a Windows service (run as Administrator):
echo   %INSTALL_DIR%\windows_service\install_service.bat
echo.
echo To create a standalone executable:
echo   %INSTALL_DIR%\build_exe.bat
echo.

goto :end

:error
echo.
echo Installation failed. Please fix the errors above and try again.
echo Check the log file for more details: %LOG_FILE%
exit /b 1

:end
pause