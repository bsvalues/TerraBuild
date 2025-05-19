@echo off
echo ================================================
echo TerraFusionBuild RCN Valuation Engine - Testing
echo ================================================
echo.

:: Check if virtual environment exists
if not exist venv (
    echo Virtual environment not found. Please run install_deps.bat first.
    pause
    exit /b 1
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Create tests directory if it doesn't exist
if not exist tests (
    echo Creating tests directory...
    mkdir tests
)

:: Check if basic test exists
if not exist tests\test_rcn_api.py (
    echo Creating basic test file...
    echo import pytest > tests\test_rcn_api.py
    echo from fastapi.testclient import TestClient >> tests\test_rcn_api.py
    echo from rcn_api_stub import app >> tests\test_rcn_api.py
    echo. >> tests\test_rcn_api.py
    echo client = TestClient(app^) >> tests\test_rcn_api.py
    echo. >> tests\test_rcn_api.py
    echo def test_rcn_calculate_endpoint(^): >> tests\test_rcn_api.py
    echo     test_data = { >> tests\test_rcn_api.py
    echo         "use_type": "Residential", >> tests\test_rcn_api.py
    echo         "construction_type": "Wood Frame", >> tests\test_rcn_api.py
    echo         "sqft": 2000, >> tests\test_rcn_api.py
    echo         "year_built": 2005, >> tests\test_rcn_api.py
    echo         "quality_class": "B", >> tests\test_rcn_api.py
    echo         "locality_index": 1.1, >> tests\test_rcn_api.py
    echo         "condition": "Average" >> tests\test_rcn_api.py
    echo     } >> tests\test_rcn_api.py
    echo     response = client.post("/rcn/calculate", json=test_data^) >> tests\test_rcn_api.py
    echo     assert response.status_code == 200 >> tests\test_rcn_api.py
    echo     assert "base_cost" in response.json(^) >> tests\test_rcn_api.py
    echo     assert "adjusted_rcn" in response.json(^) >> tests\test_rcn_api.py
    echo     assert "depreciated_rcn" in response.json(^) >> tests\test_rcn_api.py
    echo     assert "depreciation_pct" in response.json(^) >> tests\test_rcn_api.py
)

echo Running tests...
echo.

:: Run pytest
python -m pytest tests -v

:: Check test result
if %errorlevel% neq 0 (
    echo.
    echo Tests failed.
    pause
    exit /b %errorlevel%
)

echo.
echo All tests passed successfully!
pause