@echo off
REM Pintu Server Startup Script for Windows

echo Starting Pintu Design API Server...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Start the server
echo Starting FastAPI server on http://localhost:8000
echo API Documentation available at http://localhost:8000/docs
echo Press Ctrl+C to stop the server

REM Run the application
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo Server stopped.
pause
