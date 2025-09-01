"""Authentication routes"""
import httpx
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.schemas import (
    UserCreate, UserLogin, LoginRequest, RefreshTokenRequest, 
    LogoutRequest, AuthResponse
)
from app.utils.auth import verify_password, create_token_pair, verify_token
from app.services.session_service import SessionService
from config.settings import settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer()

# Helper function to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        user_id = verify_token(credentials.credentials)
        
        # Get user from database
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
                headers=settings.SUPABASE_HEADERS
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Database error")
            
            users = response.json()
            if not users:
                raise HTTPException(status_code=401, detail="User not found")
            
            return users[0]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate):
    """User registration"""
    async with httpx.AsyncClient() as client:
        # Check if user already exists
        response = await client.get(
            f"{settings.SUPABASE_URL}/rest/v1/users?email=eq.{user_data.email}",
            headers=settings.SUPABASE_HEADERS
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Database error")
        
        if response.json():
            raise HTTPException(status_code=409, detail="Email already registered")
        
        # Create new user
        from app.utils.auth import hash_password
        new_user = {
            "email": user_data.email,
            "password_hash": hash_password(user_data.password),
            "plan": "free",
            "monthly_usage": 0,
            "usage_month": datetime.now().strftime("%Y-%m")
        }
        
        response = await client.post(
            f"{settings.SUPABASE_URL}/rest/v1/users",
            headers=settings.SUPABASE_HEADERS,
            json=new_user
        )
        
        if response.status_code not in [200, 201]:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user = response.json()
        if isinstance(user, list):
            user = user[0]
        
        # Create token pair
        tokens = create_token_pair(str(user["id"]), "signup")
        
        return AuthResponse(
            token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            user={"id": user["id"], "email": user["email"], "plan": user["plan"]}
        )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    """User login"""
    async with httpx.AsyncClient() as client:
        # Get user from database
        response = await client.get(
            f"{settings.SUPABASE_URL}/rest/v1/users?email=eq.{user_data.email}",
            headers=settings.SUPABASE_HEADERS
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Database error")
        
        users = response.json()
        if not users or not verify_password(user_data.password, users[0]["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = users[0]
        user_id = str(user["id"])
        
        # Create token pair
        tokens = create_token_pair(user_id, "login")
        
        return AuthResponse(
            token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            user={"id": user_id, "email": user["email"], "plan": user["plan"]}
        )

@router.post("/login-secure", response_model=AuthResponse)
async def login_secure(login_data: LoginRequest):
    """Secure login with device tracking (one device per user)"""
    async with httpx.AsyncClient() as client:
        # Validate user credentials
        response = await client.get(
            f"{settings.SUPABASE_URL}/rest/v1/users?email=eq.{login_data.email}",
            headers=settings.SUPABASE_HEADERS
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Database error")
        
        users = response.json()
        if not users:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = users[0]
        if not verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_id = str(user["id"])
        
        # Check for existing active sessions (enforce one device policy)
        existing_sessions = await client.get(
            f"{settings.SUPABASE_URL}/rest/v1/user_sessions?user_id=eq.{user_id}&is_active=eq.true",
            headers=settings.SUPABASE_HEADERS
        )
        
        if existing_sessions.status_code == 200:
            active_sessions = existing_sessions.json()
            if active_sessions:
                # Check if it's the same device
                same_device = any(session["device_id"] == login_data.device_id for session in active_sessions)
                if not same_device:
                    raise HTTPException(
                        status_code=409, 
                        detail="Account is already logged in on another device. Only one device allowed at a time."
                    )
        
        # Create token pair
        tokens = create_token_pair(user_id, login_data.device_id)
        
        # Create/update user session
        await SessionService.create_user_session(
            user_id=user_id,
            device_id=login_data.device_id,
            device_info=login_data.device_info,
            refresh_token=tokens["refresh_token"]
        )
        
        return AuthResponse(
            token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            user={"id": user_id, "email": user["email"], "plan": user["plan"]}
        )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_access_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token with session validation"""
    try:
        # Verify refresh token
        user_id = verify_token(request.refresh_token, required_type="refresh")
        
        # Validate session is active
        session = await SessionService.validate_user_session(user_id, request.refresh_token)
        
        # Create new token pair
        tokens = create_token_pair(user_id, session["device_id"])
        
        # Update session with new refresh token
        await SessionService.create_user_session(
            user_id=user_id,
            device_id=session["device_id"],
            device_info=session["device_info"],
            refresh_token=tokens["refresh_token"]
        )
        
        # Get user info
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
                headers=settings.SUPABASE_HEADERS
            )
            user = response.json()[0] if response.json() else {}
        
        return AuthResponse(
            token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            user={"id": user_id, "email": user.get("email"), "plan": user.get("plan")}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(request: LogoutRequest):
    """Logout user and invalidate session"""
    try:
        # Verify refresh token to get user_id
        user_id = verify_token(request.refresh_token, required_type="refresh")
        
        # Invalidate the specific session
        await SessionService.invalidate_user_session(user_id, request.refresh_token)
        
        return {"message": "Logged out successfully"}
        
    except HTTPException:
        # Even if token is invalid, consider logout successful
        return {"message": "Logged out successfully"}
    except Exception as e:
        return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Get current user profile information"""
    from datetime import datetime
    current_month = datetime.now().strftime("%Y-%m")
    
    # Update usage month if needed
    if user.get("usage_month") != current_month:
        async with httpx.AsyncClient() as client:
            update_data = {"monthly_usage": 0, "usage_month": current_month}
            await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=settings.SUPABASE_HEADERS,
                json=update_data
            )
            user.update(update_data)
    
    return {
        "id": user["id"],
        "email": user["email"],
        "plan": user.get("plan", "free"),
        "monthly_usage": user.get("monthly_usage", 0),
        "usage_month": user.get("usage_month")
    }

@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user: dict = Depends(get_current_user)):
    """Delete the current authenticated user from the database."""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
            headers=settings.SUPABASE_HEADERS
        )
        
        if response.status_code not in [200, 204]:
            raise HTTPException(status_code=500, detail="Failed to delete user")
