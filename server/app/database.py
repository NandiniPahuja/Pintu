from sqlmodel import SQLModel, Session, create_engine
import os
from pathlib import Path

# Create storage directory if it doesn't exist
STORAGE_DIR = Path(os.path.dirname(__file__)) / "../storage"
ELEMENTS_DIR = STORAGE_DIR / "elements"

os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(ELEMENTS_DIR, exist_ok=True)

# Database file path
DATABASE_FILE = "sqlite:///./pintu.db"

# Create engine
engine = create_engine(DATABASE_FILE)

def create_db_and_tables():
    """Create database and tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
