@echo off
REM Zentracker Backend Quick Start Script for Windows

echo 🚀 Starting Zentracker Backend...

REM Check if virtual environment exists
if not exist ".venv" (
    echo 📦 Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call .venv\Scripts\activate

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo ⚙️ Creating .env file from example...
    copy .env.example .env
    echo ⚠️  Please update .env with your database configuration!
)

REM Run migrations
echo 🗄️ Running database migrations...
alembic upgrade head

REM Create admin user
echo 👤 Creating admin user...
python scripts/create_admin.py

REM Start the server
echo 🌟 Starting FastAPI server...
python run.py