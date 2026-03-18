#!/bin/bash

# Quick Start Script for Alzheimer's Detection Tool (Python Version)

echo "🧠 Alzheimer's Early Detection Tool - Setup Script"
echo "=================================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1)
if [ $? -eq 0 ]; then
    echo "✓ Python found: $python_version"
else
    echo "✗ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Create .env file if it doesn't exist
echo ""
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    # Generate random secret key
    secret_key=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    # Replace placeholder in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-here-change-this-in-production/$secret_key/" .env
    else
        # Linux
        sed -i "s/your-secret-key-here-change-this-in-production/$secret_key/" .env
    fi
    echo "✓ .env file created with random secret key"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "=================================================="
echo "Setup complete! 🎉"
echo ""
echo "To start the development server:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run the app: python app.py"
echo "  3. Open browser: http://localhost:5000"
echo ""
echo "For production deployment, see DEPLOYMENT.md"
echo "=================================================="
