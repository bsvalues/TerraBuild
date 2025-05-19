@echo off
echo =====================================================
echo TerraFusionBuild RCN Valuation Engine - Build EXE
echo =====================================================
echo.

:: Check if virtual environment exists
if not exist venv (
    echo Virtual environment not found. Please run install_deps.bat first.
    pause
    exit /b 1
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Check if rcn_api_stub.py exists
if not exist rcn_api_stub.py (
    echo Error: rcn_api_stub.py not found.
    echo This file is required to build the executable.
    pause
    exit /b 1
)

echo Creating build directory...
if not exist build mkdir build

echo Creating PyInstaller spec file...
echo # -*- mode: python -*- > rcn_server.spec
echo block_cipher = None >> rcn_server.spec
echo >> rcn_server.spec
echo a = Analysis(['rcn_api_stub.py'], >> rcn_server.spec
echo              pathex=['%CD%'], >> rcn_server.spec
echo              binaries=[], >> rcn_server.spec
echo              datas=[('.env', '.'), ('data', 'data')], >> rcn_server.spec
echo              hiddenimports=['uvicorn.logging', 'uvicorn.protocols', 'uvicorn.lifespan', 'uvicorn.protocols.http.auto'], >> rcn_server.spec
echo              hookspath=[], >> rcn_server.spec
echo              runtime_hooks=[], >> rcn_server.spec
echo              excludes=[], >> rcn_server.spec
echo              win_no_prefer_redirects=False, >> rcn_server.spec
echo              win_private_assemblies=False, >> rcn_server.spec
echo              cipher=block_cipher, >> rcn_server.spec
echo              noarchive=False) >> rcn_server.spec
echo pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher) >> rcn_server.spec
echo exe = EXE(pyz, >> rcn_server.spec
echo           a.scripts, >> rcn_server.spec
echo           a.binaries, >> rcn_server.spec
echo           a.zipfiles, >> rcn_server.spec
echo           a.datas, >> rcn_server.spec
echo           [], >> rcn_server.spec
echo           name='rcn_server', >> rcn_server.spec
echo           debug=False, >> rcn_server.spec
echo           bootloader_ignore_signals=False, >> rcn_server.spec
echo           strip=False, >> rcn_server.spec
echo           upx=True, >> rcn_server.spec
echo           upx_exclude=[], >> rcn_server.spec
echo           runtime_tmpdir=None, >> rcn_server.spec
echo           console=True, >> rcn_server.spec
echo           icon='') >> rcn_server.spec

echo Creating startup script...
echo @echo off > build\start_rcn_server.bat
echo echo Starting RCN Valuation Engine... >> build\start_rcn_server.bat
echo echo. >> build\start_rcn_server.bat
echo echo Web API will be available at: http://127.0.0.1:8000 >> build\start_rcn_server.bat
echo echo Press Ctrl+C to stop the server. >> build\start_rcn_server.bat
echo echo. >> build\start_rcn_server.bat
echo rcn_server.exe >> build\start_rcn_server.bat

echo Building executable with PyInstaller...
pyinstaller --clean --noconfirm rcn_server.spec

echo.
if %errorlevel% neq 0 (
    echo Build failed.
    pause
    exit /b %errorlevel%
)

echo Copying additional files...
copy .env.example build\dist\rcn_server\.env.example
if not exist build\dist\rcn_server\data mkdir build\dist\rcn_server\data

echo.
echo Build completed successfully!
echo.
echo Executable is located at: %CD%\build\dist\rcn_server\rcn_server.exe
echo Startup script is located at: %CD%\build\start_rcn_server.bat
echo.
echo To run the server, use start_rcn_server.bat in the build directory.
echo.
pause