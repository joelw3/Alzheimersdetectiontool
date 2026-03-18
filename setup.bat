@echo off
REM Quick Start Script for Windows

echo 🧠 Alzheimer's Early Detection Tool - Setup Script
echo ==================================================
echo.

REM Check Python version
echo Checking Python version...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Python not found. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
python --version
echo ✓ Python found
echo.

REM Create virtual environment
echo Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo ✓ Virtual environment activated
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
echo ✓ Dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo ✓ .env file created
    echo ⚠️  Please edit .env file and set SECRET_KEY
) else (
    echo ✓ .env file already exists
)
echo.

echo ==================================================
echo Setup complete! 🎉
echo.
echo To start the development server:
echo   1. Activate virtual environment: venv\Scripts\activate
echo   2. Run the app: python app.py
echo   3. Open browser: http://localhost:5000
echo.
echo For production deployment, see DEPLOYMENT.md
echo ==================================================
pause
