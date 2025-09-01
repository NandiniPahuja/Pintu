#!/bin/bash

# Test runner script for Pintu Server
echo "Running Pintu Server Tests..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run ./run.sh first to set up dependencies."
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash, Cygwin, etc.)
    source venv/Scripts/activate
else
    # Unix/Linux/macOS
    source venv/bin/activate
fi

# Install test dependencies if not already installed
echo "Ensuring test dependencies are installed..."
pip install pytest pytest-asyncio httpx

# Create test assets if they don't exist
echo "Creating test assets..."
python -m tests.create_assets

# Run the tests
echo "Running pytest..."
echo "================================"

# Run with different verbosity levels and options
if [ "$1" = "verbose" ]; then
    pytest tests/ -v --tb=long --color=yes
elif [ "$1" = "coverage" ]; then
    pip install pytest-cov
    pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
elif [ "$1" = "specific" ] && [ -n "$2" ]; then
    pytest tests/test_remove_bg.py::$2 -v --tb=short
else
    pytest tests/ -v --tb=short --color=yes
fi

echo "================================"
echo "Tests completed!"

# Check if any tests failed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Check the output above for details."
    exit 1
fi
