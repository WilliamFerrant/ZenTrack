#!/bin/bash

# Zentracker Backend Quick Start Script

echo "🚀 Starting Zentracker Backend..."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database configuration!"
fi

# Run migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

# Create admin user
echo "👤 Creating admin user..."
python scripts/create_admin.py

# Start the server
echo "🌟 Starting FastAPI server..."
python run.py