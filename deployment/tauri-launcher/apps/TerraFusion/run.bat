@echo off
REM TerraFusion Main Application Startup Script
REM This script launches the main TerraFusion application

echo Starting TerraFusion Enterprise Application...

REM Set default port if not provided
if "%PORT%"=="" set PORT=5000

REM Navigate to the application directory
cd /d "%~dp0..\..\..\.."

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Set environment variables for production
set NODE_ENV=production
set TAURI_DEPLOYMENT=true

REM Start the application
echo Starting TerraFusion on port %PORT%...
npm run dev

REM Keep window open on error
if %errorlevel% neq 0 (
    echo ERROR: Failed to start TerraFusion application
    pause
)