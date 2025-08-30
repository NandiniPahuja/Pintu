# Pintu Server

FastAPI + Python backend application.

## Getting Started

### Prerequisites

- Python (v3.8 or higher)
- pip

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Development

```bash
uvicorn main:app --reload
```

This will start the development server at `http://localhost:8000`.

### API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

Copy the root `.env.example` to `.env` and configure:

- `SECRET_KEY` - Secret key for your application

## Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/test` - Test endpoint for client communication

## Project Structure

```
server/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── README.md           # This file
```
