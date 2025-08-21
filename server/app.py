# ===== IMPORTS =====
import os
import sys
import base64
import asyncio
import uuid
import hashlib
import jwt
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import httpx

# ===== CONFIGURATION =====
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")
PROVIDER = os.getenv("PROVIDER", "auto").lower()
JWT_SECRET = os.getenv("JWT_SECRET")
FREE_MAX_MONTHLY = int(os.getenv("FREE_MAX_MONTHLY"))
FREE_DELAY_SECONDS = float(os.getenv("FREE_DELAY_SECONDS"))

# Rate limiting configuration
RATE_LIMIT_FREE_PER_HOUR = int(os.getenv("RATE_LIMIT_FREE_PER_HOUR"))
RATE_LIMIT_PRO_PER_HOUR = int(os.getenv("RATE_LIMIT_PRO_PER_HOUR"))

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Validate required environment variables
REQUIRED_ENV_VARS = {
    "GEMINI_API_KEY": GEMINI_API_KEY,
    "GEMINI_MODEL": GEMINI_MODEL,
    "JWT_SECRET": JWT_SECRET,
    "FREE_MAX_MONTHLY": FREE_MAX_MONTHLY,
    "FREE_DELAY_SECONDS": FREE_DELAY_SECONDS,
    "RATE_LIMIT_FREE_PER_HOUR": RATE_LIMIT_FREE_PER_HOUR,
    "RATE_LIMIT_PRO_PER_HOUR": RATE_LIMIT_PRO_PER_HOUR,
    "SUPABASE_URL": SUPABASE_URL,
    "SUPABASE_SERVICE_KEY": SUPABASE_SERVICE_KEY,
}

missing_vars = [var for var, value in REQUIRED_ENV_VARS.items() if value is None]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

SUPABASE_HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

# Validate environment on startup
def validate_environment():
    """Validate that all required environment variables are properly configured"""
    print("🔧 Validating environment configuration...")
    print(f"✅ GEMINI_API_KEY: {'Set' if GEMINI_API_KEY else '❌ Missing'}")
    print(f"✅ GEMINI_MODEL: {GEMINI_MODEL}")
    print(f"✅ JWT_SECRET: {'Set' if JWT_SECRET else '❌ Missing'}")
    print(f"✅ FREE_MAX_MONTHLY: {FREE_MAX_MONTHLY}")
    print(f"✅ RATE_LIMIT_FREE_PER_HOUR: {RATE_LIMIT_FREE_PER_HOUR}")
    print(f"✅ RATE_LIMIT_PRO_PER_HOUR: {RATE_LIMIT_PRO_PER_HOUR}")
    print(f"✅ SUPABASE_URL: {'Set' if SUPABASE_URL else '❌ Missing'}")
    print(f"✅ SUPABASE_SERVICE_KEY: {'Set' if SUPABASE_SERVICE_KEY else '❌ Missing'}")
    print("🚀 Environment validation complete!")

validate_environment()

# AI System prompt
SYSTEM_PROMPT = (
    "You are a helpful chef. Given an image of a fridge, a pantry or just some ingredients "
    "and optional user preferences, "
    "list ingredients you see and propose 3 concise recipes using mostly those ingredients. "
    "Prefer short prep times and minimal extra pantry items. Return strictly JSON with keys: "
    "ingredients (string[]) and recipes (array of {title, ingredients, steps, timeMins})."
)

# ===== APP SETUP =====
app = FastAPI(
    title="Chef Bot API",
    description="AI-powered recipe analysis API for mobile applications",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

security = HTTPBearer()

# ===== MODELS =====
class User(BaseModel):
    id: str
    email: str
    password_hash: str
    plan: str = "free"
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

# ===== UTILITY FUNCTIONS =====
def log_debug(msg):
    print(msg)
    sys.stdout.flush()

def validate_environment():
    """Validate that all required environment variables are properly configured"""
    print("🔧 Validating environment configuration...")
    print(f"✅ GEMINI_API_KEY: {'Set' if GEMINI_API_KEY else '❌ Missing'}")
    print(f"✅ GEMINI_MODEL: {GEMINI_MODEL}")
    print(f"✅ JWT_SECRET: {'Set' if JWT_SECRET else '❌ Missing'}")
    print(f"✅ FREE_MAX_MONTHLY: {FREE_MAX_MONTHLY}")
    print(f"✅ RATE_LIMIT_FREE_PER_HOUR: {RATE_LIMIT_FREE_PER_HOUR}")
    print(f"✅ RATE_LIMIT_PRO_PER_HOUR: {RATE_LIMIT_PRO_PER_HOUR}")
    print(f"✅ SUPABASE_URL: {'Set' if SUPABASE_URL else '❌ Missing'}")
    print(f"✅ SUPABASE_SERVICE_KEY: {'Set' if SUPABASE_SERVICE_KEY else '❌ Missing'}")
    print("🚀 Environment validation complete!")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_token(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": datetime.utcnow().timestamp() + 86400 * 30}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def _current_month() -> str:
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}"

def _choose_provider() -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Please check server configuration.")
    return "gemini"

def _current_hour() -> str:
    """Get current hour in format YYYY-MM-DD-HH for rate limiting"""
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}-{now.day:02d}-{now.hour:02d}"

async def check_rate_limit(user: dict) -> bool:
    """Check if user has exceeded their hourly rate limit. Returns True if allowed."""
    # Determine rate limit based on user plan
    if user["plan"] == "pro":
        hourly_limit = RATE_LIMIT_PRO_PER_HOUR
    else:
        hourly_limit = RATE_LIMIT_FREE_PER_HOUR
    
    current_hour = _current_hour()
    user_id = user["id"]
    
    # Get current hourly usage from database
    async with httpx.AsyncClient() as client:
        # Check if we have a rate limit record for this user and hour
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/rate_limits?user_id=eq.{user_id}&hour_key=eq.{current_hour}",
            headers=SUPABASE_HEADERS
        )
        
        if response.status_code != 200:
            log_debug(f"Failed to fetch rate limit data for user_id={user_id}")
            return True  # Allow on error to avoid blocking users
        
        rate_records = response.json()
        
        if not rate_records:
            # No record exists, create one
            new_record = {
                "user_id": user_id,
                "hour_key": current_hour,
                "request_count": 1,
                "plan": user["plan"]
            }
            
            create_response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rate_limits",
                headers=SUPABASE_HEADERS,
                json=new_record
            )
            
            if create_response.status_code not in [200, 201]:
                log_debug(f"Failed to create rate limit record for user_id={user_id}")
                return True  # Allow on error
            
            log_debug(f"RATE LIMIT: Created new record for user_id={user_id}, count=1, limit={hourly_limit}")
            return True
        
        # Record exists, check current count
        current_count = rate_records[0]["request_count"]
        
        if current_count >= hourly_limit:
            log_debug(f"RATE LIMIT EXCEEDED: user_id={user_id} count={current_count} limit={hourly_limit}")
            return False
        
        # Increment the count
        new_count = current_count + 1
        update_response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/rate_limits?user_id=eq.{user_id}&hour_key=eq.{current_hour}",
            headers=SUPABASE_HEADERS,
            json={"request_count": new_count}
        )
        
        if update_response.status_code not in [200, 204]:
            log_debug(f"Failed to update rate limit count for user_id={user_id}")
            return True  # Allow on error
        
        log_debug(f"RATE LIMIT: Updated user_id={user_id}, new_count={new_count}, limit={hourly_limit}")
        return True

# ===== DATABASE RELATED FUNCTIONS =====
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

async def check_and_update_usage(user: dict) -> bool:
    """Check if user can make analysis and update usage. Returns True if allowed."""
    if user["plan"] == "pro":
        return True

    used = user.get("used_free_analyses")
    if used is None:
        used = 0
    log_debug(f"check_and_update_usage: user_id={user['id']} used_free_analyses={used} plan={user.get('plan')}")

    # Monthly reset logic
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
            detail = getattr(e.response, "text", "")
            raise HTTPException(status_code=e.response.status_code, detail=detail[:1000])
        
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
        try:
            parsed = _json.loads(text)
            return AnalyzeResponse(**parsed)
        except Exception as e:
            log_debug(f"Failed to parse Gemini response: {e}, text: {text}")
            return AnalyzeResponse(ingredients=[], recipes=[])

# ===== API ENDPOINTS =====

# Authentication endpoints
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
            "is_verified": 0,
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
        if not users:
            print(f"LOGIN FAIL: No user found for email={user_data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not verify_password(user_data.password, users[0]["password_hash"]):
            print(f"LOGIN FAIL: Password mismatch for email={user_data.email}")
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
    
    # For free users, recipes_left = FREE_MAX_MONTHLY - used_free_analyses
    recipes_left = None
    if user["plan"] == "free":
        used = user.get("used_free_analyses", 0)
        recipes_left = FREE_MAX_MONTHLY - used
    return {
        "id": user["id"],
        "email": user["email"],
        "plan": user["plan"],
        "recipes_left": recipes_left,
        "monthly_limit": None if user["plan"] == "pro" else FREE_MAX_MONTHLY,
        "usage_month": user["usage_month"],
        "created_at": user["created_at"]
    }

@app.delete("/api/auth/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user: dict = Depends(get_current_user)):
    """Delete the current authenticated user from the database."""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
            headers=SUPABASE_HEADERS
        )
        if response.status_code not in [200, 204]:
            raise HTTPException(status_code=500, detail="Failed to delete user")
    return

# Main functionality endpoints
@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...), prompt: str = Form(""), user: dict = Depends(get_current_user)):
    log_debug("ANALYZE endpoint called")
    image_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    if not (mime_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    # Check usage limits for free tier
    if not await check_and_update_usage(user):
        log_debug(f"RAISING 429 for user_id={user['id']}")
        raise HTTPException(
            status_code=429, 
            detail=f"Free plan limit reached: {FREE_MAX_MONTHLY} analyses this month. Upgrade to Pro for unlimited usage."
        )

    # Check rate limiting (requests per hour)
    if not await check_rate_limit(user):
        rate_limit = RATE_LIMIT_PRO_PER_HOUR if user["plan"] == "pro" else RATE_LIMIT_FREE_PER_HOUR
        log_debug(f"RATE LIMIT EXCEEDED for user_id={user['id']} plan={user['plan']}")
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {rate_limit} requests per hour. Please wait before making another request."
        )

    # Add small delay for free tier
    if user["plan"] != "pro":
        await asyncio.sleep(FREE_DELAY_SECONDS)

    provider = _choose_provider()
    print(f"ANALYZE: user_id={user['id']} email={user.get('email')} plan={user.get('plan')} monthly_usage={user.get('monthly_usage')} usage_month={user.get('usage_month')}")
    return await call_gemini_vision(image_bytes, prompt, mime_type=mime_type)

# Utility endpoints
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

# ===== APP STARTUP =====
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
