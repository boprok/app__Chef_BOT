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
# Always load .env from this server directory (works no matter the CWD)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
PROVIDER = os.getenv("PROVIDER", "auto").lower()
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Supabase headers for REST API
SUPABASE_HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

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

# Database setup - Using Supabase REST API
async def init_db():
    """Initialize database tables using Supabase SQL"""
    # Note: In Supabase, you typically create tables via the dashboard or migration files
    # This is just for logging purposes
    print("✅ Using Supabase database - tables should be created via dashboard")

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
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
            headers=SUPABASE_HEADERS
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Database error")
        
        users = response.json()
        if not users:
            raise HTTPException(status_code=401, detail="User not found")
        
        return users[0]

# --- User management ---
FREE_MAX_MONTHLY = int(os.getenv("FREE_MAX_MONTHLY", "10"))
FREE_DELAY_SECONDS = float(os.getenv("FREE_DELAY_SECONDS", "1.5"))

def _current_month() -> str:
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}"

async def check_and_update_usage(user: dict) -> bool:
    """Check if user can make analysis and update usage. Returns True if allowed."""
    if user["plan"] == "plus":
        return True

    # Use used_free_analyses for usage tracking
    used = user.get("used_free_analyses")
    if used is None:
        used = 0
    log_debug(f"check_and_update_usage: user_id={user['id']} used_free_analyses={used} plan={user.get('plan')}")

    # --- Monthly reset logic ---
    from datetime import datetime
    now = datetime.utcnow()
    current_month = f"{now.year}-{now.month:02d}"
    user_month = user.get("usage_month")
    if user_month != current_month:
        log_debug(f"Resetting used_free_analyses for user_id={user['id']} (was {used}) for new month {current_month}")
        used = 0
        async with httpx.AsyncClient() as client:
            update_data = {"used_free_analyses": 0, "usage_month": current_month}
            headers = SUPABASE_HEADERS.copy()
            headers["Prefer"] = "return=representation"
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=headers,
                json=update_data
            )
            if response.status_code not in [200, 204]:
                log_debug(f"Failed to reset used_free_analyses for user_id={user['id']}, status={response.status_code}, body={response.text}")
                return False
        user["used_free_analyses"] = 0
        user["usage_month"] = current_month
    # --- End monthly reset logic ---

    if used >= FREE_MAX_MONTHLY:
        log_debug(f"LIMIT REACHED: user_id={user['id']} used_free_analyses={used} limit={FREE_MAX_MONTHLY}")
        return False

    # Increment usage
    async with httpx.AsyncClient() as client:
        new_usage = used + 1
        update_data = {"used_free_analyses": new_usage}
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
            headers=SUPABASE_HEADERS,
            json=update_data
        )
        if response.status_code not in [200, 204]:
            log_debug(f"Failed to update used_free_analyses for user_id={user['id']}")
            return False
    log_debug(f"USAGE ALLOWED: user_id={user['id']} new_used_free_analyses={new_usage}")
    return True

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate):
    async with httpx.AsyncClient() as client:
        # Check if user exists
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/users?email=eq.{user_data.email}&select=id",
            headers=SUPABASE_HEADERS
        )
        
        if response.status_code == 200 and response.json():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        password_hash = hash_password(user_data.password)
        user_id = str(uuid.uuid4())
        
        user_payload = {
            "id": user_id,
            "email": user_data.email,
            "password_hash": password_hash,
            "plan": "free",
            "is_verified": 0,  # Use 0/1 instead of False/True for smallint fields
            "used_free_analyses": 0
        }
        
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/users",
            headers=SUPABASE_HEADERS,
            json=user_payload
        )
        
        if response.status_code not in [200, 201]:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        token = create_token(user_id)
        return AuthResponse(
            token=token,
            user={"id": user_id, "email": user_data.email, "plan": "free"}
        )

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/users?email=eq.{user_data.email}",
            headers=SUPABASE_HEADERS
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Database error")
        
        users = response.json()
        if not users or not verify_password(user_data.password, users[0]["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = users[0]
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
    if user.get("usage_month") != current_month:
        async with httpx.AsyncClient() as client:
            update_data = {"monthly_usage": 0, "usage_month": current_month}
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=SUPABASE_HEADERS,
                json=update_data
            )
        user["monthly_usage"] = 0
        user["usage_month"] = current_month
    
    return {
        "id": user["id"],
        "email": user["email"],
        "plan": user["plan"],
        "monthly_usage": user.get("monthly_usage", 0),
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
    log_debug("ANALYZE endpoint called")
    image_bytes = await file.read()
    # Determine MIME type for Gemini
    mime_type = file.content_type or "image/jpeg"
    if not (mime_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    # Check usage limits for free tier
    if not await check_and_update_usage(user):
        log_debug(f"RAISING 429 for user_id={user['id']}")
        raise HTTPException(
            status_code=429, 
            detail=f"Free plan limit reached: {FREE_MAX_MONTHLY} analyses this month. Upgrade to Plus for unlimited usage."
        )

    # Add small delay for free tier
    if user["plan"] != "plus":
        await asyncio.sleep(FREE_DELAY_SECONDS)

    provider = _choose_provider()
    print(f"ANALYZE: user_id={user['id']} email={user.get('email')} plan={user.get('plan')} monthly_usage={user.get('monthly_usage')} usage_month={user.get('usage_month')}")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import sys

def log_debug(msg):
    print(msg)
    sys.stdout.flush()
