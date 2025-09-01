"""Main FastAPI application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx
from config.settings import settings
from app.api.routes import auth, analyze, utility
from app.services.session_service import SessionService

# Initialize session service
session_service = SessionService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    print("🚀 Starting ChefBot API...")
    print(f"Provider: {settings.PROVIDER}")
    print(f"Environment: {'✅ Configured' if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY else '❌ Missing env vars'}")
    
    # Test database connection
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?select=count",
                headers=settings.SUPABASE_HEADERS
            )
            if response.status_code == 200:
                print("✅ Database connection successful")
            else:
                print(f"❌ Database connection failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
    
    # Cleanup old sessions on startup
    try:
        await session_service.cleanup_expired_sessions()
        print("✅ Cleaned up expired sessions")
    except Exception as e:
        print(f"⚠️ Failed to cleanup expired sessions: {str(e)}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down ChefBot API...")

# Create FastAPI application
app = FastAPI(
    title="ChefBot API",
    description="AI-powered recipe analysis from food images",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(utility.router)

# Root endpoint
@app.get("/")
async def read_root():
    """Root endpoint"""
    return {
        "message": "🍳 ChefBot API is running!",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
