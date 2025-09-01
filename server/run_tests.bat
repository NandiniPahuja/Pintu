@echo off
REM Test runner script for Pintu Server (Windows)

echo Running Pintu Server Tests...

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Please run run.bat first to set up dependencies.
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install test dependencies if not already installed
echo Ensuring test dependencies are installed...
pip install pytest pytest-asyncio httpx

REM Create test assets if they don't exist
echo Creating test assets...
python -m tests.create_assets

REM Run the tests
echo Running pytest...
echo ================================

REM Run with different options based on parameter
if "%1"=="verbose" (
    pytest tests/ -v --tb=long --color=yes
) else if "%1"=="coverage" (
    pip install pytest-cov
    pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
) else if "%1"=="specific" (
    if "%2"=="" (
        echo Please specify a test name after "specific"
        exit /b 1
    )
    pytest tests/test_remove_bg.py::%2 -v --tb=short
) else (
    pytest tests/ -v --tb=short --color=yes
)

echo ================================
echo Tests completed!

REM Check if any tests failed
if %ERRORLEVEL% equ 0 (
    echo ✅ All tests passed!
) else (
    echo ❌ Some tests failed. Check the output above for details.
    exit /b 1
)

pause
