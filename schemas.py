from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

# Schema for Login/Token Request
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone: Optional[str] = None
    user_id: Optional[str] = None

# Schema for User Profile (What we send to the frontend)
class UserOut(BaseModel):
    user_id: str
    name: str
    phone: str
    balance: float
    risk_score: float
    is_verified: bool
    last_active: datetime

    class Config:
        from_attributes = True # Allows Pydantic to read Supabase dicts

# Schema for User Registration
class UserCreate(BaseModel):
    name: str
    phone: str = Field(..., pattern=r"^\d{11}$") # Validates 11-digit BD numbers
    password: str = Field(..., min_length=8, max_length=72)


class SimpleLoginRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r"^\d{11}$")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str
    user_id: str


class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    items: list[ChatHistoryItem]
    total: int
    limit: int
    offset: int
    has_more: bool