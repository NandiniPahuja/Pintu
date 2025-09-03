from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship
import uuid

def generate_uuid():
    """Generate a UUID string"""
    return str(uuid.uuid4())

class Element(SQLModel, table=True):
    """Element model for storing reusable design elements"""
    __tablename__ = "elements"
    
    id: Optional[str] = Field(default_factory=generate_uuid, primary_key=True)
    name: str
    tags: str  # Comma-separated tags
    file_path: str  # Path to the stored file
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "tags": self.tags.split(",") if self.tags else [],
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat(),
        }
