"""Pydantic models for API request/response validation"""
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# ===== AUTH MODELS =====
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: str
    device_info: dict = {}

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class AuthResponse(BaseModel):
    token: str
    refresh_token: Optional[str] = None
    user: dict

class GoogleAuthRequest(BaseModel):
    email: EmailStr
    name: str
    googleId: str
    idToken: str
    picture: Optional[str] = None

class EmailVerificationRequest(BaseModel):
    token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# ===== RECIPE MODELS =====
class Recipe(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    timeMins: Optional[int] = None

class AnalyzeResponse(BaseModel):
    ingredients: List[str]
    recipes: List[Recipe]

# ===== HEALTH CHECK MODELS =====
class HealthResponse(BaseModel):
    provider: str
    model: str
    hasKey: bool
    keyPreview: Optional[str] = None

# ===== USER SESSION MODELS =====
class UserSession(BaseModel):
    id: str
    user_id: str
    device_id: str
    device_name: str
    platform: str
    device_info: dict
    is_active: bool
    last_activity: str
    created_at: str
    expires_at: str
