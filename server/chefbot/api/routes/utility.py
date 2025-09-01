"""Utility and debug routes"""
from fastapi import APIRouter
from config.settings import settings
import httpx

router = APIRouter(prefix="/api", tags=["utility"])

@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "message": "API is running"}

@router.get("/debug/status")
async def debug_status():
    """Debug endpoint showing current configuration"""
    return {
        "provider": settings.PROVIDER,
        "actual_provider": "gemini" if settings.GEMINI_API_KEY else "none",
        "free_max_monthly": settings.FREE_MAX_MONTHLY,
        "free_delay": settings.FREE_DELAY_SECONDS,
        "cors_origins": settings.CORS_ORIGINS,
        "environment": "configured" if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY else "missing env vars"
    }

@router.get("/debug/test-db")
async def test_database():
    """Test database connection"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?select=count",
                headers=settings.SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                return {"status": "ok", "message": "Database connection successful"}
            else:
                return {"status": "error", "message": f"Database error: {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection failed: {str(e)}"}

@router.get("/debug/sessions")
async def debug_sessions():
    """Debug endpoint to see current sessions"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/user_sessions?select=*&order=last_activity.desc",
                headers=settings.SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                sessions = response.json()
                # Remove sensitive data
                for session in sessions:
                    if 'hashed_refresh_token' in session:
                        session['hashed_refresh_token'] = session['hashed_refresh_token'][:10] + "..."
                return {"sessions": sessions}
            else:
                return {"error": f"Failed to fetch sessions: {response.status_code}"}
    except Exception as e:
        return {"error": f"Error fetching sessions: {str(e)}"}

@router.get("/debug/openapi")
async def debug_openapi():
    """Debug endpoint to test OpenAPI schema generation"""
    try:
        # Try to access the app's OpenAPI schema
        from main import app
        schema = app.openapi()
        return {
            "status": "ok", 
            "message": "OpenAPI schema generated successfully",
            "paths_count": len(schema.get("paths", {})),
            "schemas_count": len(schema.get("components", {}).get("schemas", {}))
        }
    except Exception as e:
        return {"status": "error", "message": f"OpenAPI generation failed: {str(e)}"}

@router.get("/debug/user-counts")
async def debug_user_counts():
    """Debug endpoint showing user statistics"""
    try:
        async with httpx.AsyncClient() as client:
            # Get total user count
            users_response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?select=count",
                headers=settings.SUPABASE_HEADERS
            )
            
            # Get active sessions count
            sessions_response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/user_sessions?select=count",
                headers=settings.SUPABASE_HEADERS
            )
            
            return {
                "total_users": len(users_response.json()) if users_response.status_code == 200 else "error",
                "active_sessions": len(sessions_response.json()) if sessions_response.status_code == 200 else "error"
            }
    except Exception as e:
        return {"error": f"Error fetching counts: {str(e)}"}
