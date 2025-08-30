# Pintu Monorepo

A full-stack application with React frontend and FastAPI backend.

## Project Structure

```
pintu/
├── client/          # React + Vite + TypeScript frontend
├── server/          # FastAPI + Python backend
├── .env.example     # Environment variables template
├── .gitignore       # Git ignore rules
├── LICENSE          # MIT License
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Set up the client and server applications (see individual READMEs)

### Client (React + Vite + TypeScript)

```bash
cd client
npm install
npm run dev
```

The client will be available at `http://localhost:5173`

### Server (FastAPI + Python)

```bash
cd server
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

The server will be available at `http://localhost:8000`

## Development

- Client runs on port 5173
- Server runs on port 8000
- API documentation available at `http://localhost:8000/docs`

## License

MIT License - see [LICENSE](LICENSE) file for details.
