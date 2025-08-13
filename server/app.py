import os
import base64
import asyncio
from datetime import datetime
from typing import List, Optional
import uuid
import hashlib
import jwt
from calendar import monthrange

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import httpx
import psycopg2
import psycopg2.extras
from contextlib import contextmanager

# Always load .env from this server directory (works no matter the CWD)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
PROVIDER = os.getenv("PROVIDER", "auto").lower()
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Database connection string for PostgreSQL
# Database connection string for PostgreSQL
DATABASE_URL = f"postgresql://postgres:{os.getenv('DB_PASSWORD')}@db.qkdsakgxkxyoqyecjvat.supabase.co:5432/postgres"

app = FastAPI(
    title="Chef Bot API",
    description="AI-powered recipe analysis API for mobile applications",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for mobile development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

security = HTTPBearer()

# Database models
class User(BaseModel):
    id: str
    email: str
    password_hash: str
    plan: str = "free"  # "free" or "plus"
    monthly_usage: int = 0
    usage_month: str = ""
    created_at: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class Recipe(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    timeMins: Optional[int] = None

class AnalyzeResponse(BaseModel):
    ingredients: List[str]
    recipes: List[Recipe]

class HealthResponse(BaseModel):
    provider: str
    model: str
    hasKey: bool
    keyPreview: str | None = None

# Database setup
@contextmanager
def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    plan TEXT DEFAULT 'free',
                    is_verified INTEGER DEFAULT 0,
                    used_free_analyses TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)

# Initialize database on startup (commented for now)
# init_db()

# Auth helpers
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_token(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": datetime.utcnow().timestamp() + 86400 * 30}  # 30 days
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user_id = verify_token(credentials.credentials)
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return dict(user)

# --- User management ---
FREE_MAX_MONTHLY = int(os.getenv("FREE_MAX_MONTHLY", "10"))
FREE_DELAY_SECONDS = float(os.getenv("FREE_DELAY_SECONDS", "1.5"))

def _current_month() -> str:
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}"

def check_and_update_usage(user: dict) -> bool:
    """Check if user can make analysis and update usage. Returns True if allowed."""
    if user["plan"] == "plus":
        return True
    
    current_month = _current_month()
    
    # Reset usage if new month
    if user["usage_month"] != current_month:
        with get_db() as conn:
            conn.execute(
                "UPDATE users SET monthly_usage = 0, usage_month = ? WHERE id = ?",
                (current_month, user["id"])
            )
            conn.commit()
        user["monthly_usage"] = 0
        user["usage_month"] = current_month
    
    # Check limit
    if user["monthly_usage"] >= FREE_MAX_MONTHLY:
        return False
    
    # Increment usage
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET monthly_usage = monthly_usage + 1 WHERE id = ?",
            (user["id"],)
        )
        conn.commit()
    
    return True

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Check if user exists
            cur.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
            existing = cur.fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Create user
            password_hash = hash_password(user_data.password)
            
            cur.execute(
                "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
                (user_data.email, password_hash)
            )
            user_id = cur.fetchone()["id"]
            
            token = create_token(str(user_id))
            return AuthResponse(
                token=token,
                user={"id": str(user_id), "email": user_data.email, "plan": "free"}
            )

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (user_data.email,))
            user = cur.fetchone()
            if not user or not verify_password(user_data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            token = create_token(str(user["id"]))
            return AuthResponse(
                token=token,
                user={"id": str(user["id"]), "email": user["email"], "plan": user["plan"]}
            )

@app.get("/api/auth/me")
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Get current user profile information"""
    current_month = _current_month()
    
    # Update usage month if needed
    if user["usage_month"] != current_month:
        with get_db() as conn:
            conn.execute(
                "UPDATE users SET monthly_usage = 0, usage_month = ? WHERE id = ?",
                (current_month, user["id"])
            )
            conn.commit()
        user["monthly_usage"] = 0
        user["usage_month"] = current_month
    
    return {
        "id": user["id"],
        "email": user["email"],
        "plan": user["plan"],
        "monthly_usage": user["monthly_usage"],
        "monthly_limit": None if user["plan"] == "plus" else FREE_MAX_MONTHLY,
        "usage_month": user["usage_month"],
        "created_at": user["created_at"]
    }

SYSTEM_PROMPT = (
    "You are a helpful chef. Given an image of a fridge and optional user preferences, "
    "list ingredients you see and propose 3 concise recipes using mostly those ingredients. "
    "Prefer short prep times and minimal extra pantry items. Return strictly JSON with keys: "
    "ingredients (string[]) and recipes (array of {title, ingredients, steps, timeMins})."
)

def _choose_provider() -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Please check server configuration.")
    return "gemini"

async def call_gemini_vision(image_bytes: bytes, user_prompt: str, mime_type: str = "image/jpeg") -> AnalyzeResponse:
    img_b64 = base64.b64encode(image_bytes).decode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "systemInstruction": {
            "role": "system",
            "parts": [{"text": SYSTEM_PROMPT}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": user_prompt or ""},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": img_b64,
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 800,
            "responseMimeType": "application/json",
        },
    }

    headers = {"Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        except httpx.HTTPStatusError as e:
            # Surface error details to client for easier setup debugging
            detail = getattr(e.response, "text", "")
            raise HTTPException(status_code=e.response.status_code, detail=detail[:1000])
        # Expecting candidates[0].content.parts[0].text containing JSON
        text = None
        try:
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                for p in parts:
                    if "text" in p:
                        text = p["text"]
                        break
        except Exception:
            text = None

        if not text:
            return AnalyzeResponse(ingredients=[], recipes=[])

        import json as _json
        parsed = _json.loads(text)
        return AnalyzeResponse(**parsed)

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...), prompt: str = Form(""), user: dict = Depends(get_current_user)):
    image_bytes = await file.read()
    # Determine MIME type for Gemini
    mime_type = file.content_type or "image/jpeg"
    if not (mime_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    # Check usage limits for free tier
    if not check_and_update_usage(user):
        raise HTTPException(
            status_code=429, 
            detail=f"Free plan limit reached: {FREE_MAX_MONTHLY} analyses this month. Upgrade to Plus for unlimited usage."
        )

    # Add small delay for free tier
    if user["plan"] != "plus":
        await asyncio.sleep(FREE_DELAY_SECONDS)

    provider = _choose_provider()
    return await call_gemini_vision(image_bytes, prompt, mime_type=mime_type)

@app.get("/")
async def root():
    """Root endpoint for health checking"""
    return {
        "message": "Chef Bot API is running",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/signup, /api/auth/login",
            "analyze": "/api/analyze",
            "health": "/api/health",
            "docs": "/docs"
        }
    }

@app.get("/api/health", response_model=HealthResponse)
async def health():
    provider = _choose_provider()
    model = GEMINI_MODEL
    key = GEMINI_API_KEY or ""
    has_key = bool(key)
    preview = (key[:4] + "..." + key[-2:]) if has_key and len(key) > 8 else (key if has_key else None)
    return HealthResponse(provider=provider, model=model, hasKey=has_key, keyPreview=preview)
