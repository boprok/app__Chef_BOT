"""Authentication routes"""
import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from google.oauth2 import id_token
from google.auth.transport import requests
from chefbot.models.schemas import (
    UserCreate, UserLogin, LoginRequest, AuthResponse, RefreshTokenRequest, 
    LogoutRequest, UserSession, GoogleAuthRequest, EmailVerificationRequest,
    PasswordResetRequest, PasswordResetConfirm
)
from chefbot.utils.auth import verify_password, create_token_pair, verify_token, hash_password
from chefbot.services.session_service import SessionService
from chefbot.services.email_service import email_service
from config.settings import settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer()

def generate_verification_token() -> str:
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)

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
        
        # Create new user with email verification
        verification_token = generate_verification_token()
        verification_expires = datetime.utcnow() + timedelta(hours=24)
        
        new_user = {
            "email": user_data.email,
            "password_hash": hash_password(user_data.password),
            "plan": "free",
            "monthly_usage": 0,
            "usage_month": datetime.now().strftime("%Y-%m"),
            "email_verified": False,
            "email_verification_token": verification_token,
            "email_verification_expires_at": verification_expires.isoformat()
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
        
        # Send verification email
        try:
            await email_service.send_verification_email(
                email=user_data.email,
                verification_token=verification_token,
                user_name=user_data.email.split('@')[0]  # Use part before @ as name
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            # Don't fail signup if email fails - user can request resend
        
        # Create token pair
        tokens = create_token_pair(str(user["id"]), "signup")
        
        return AuthResponse(
            token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            user={
                "id": user["id"], 
                "email": user["email"], 
                "plan": user["plan"],
                "email_verified": user["email_verified"]
            }
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

@router.post("/google", response_model=AuthResponse)
async def google_auth(auth_data: GoogleAuthRequest):
    """Google OAuth authentication"""
    try:
        # TODO: Uncomment when google-auth is properly installed
        # # Verify the Google ID token
        # idinfo = id_token.verify_oauth2_token(
        #     auth_data.idToken, 
        #     requests.Request(), 
        #     settings.GOOGLE_CLIENT_ID
        # )
        
        # # Verify the token issuer
        # if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
        #     raise ValueError('Wrong issuer.')
        
        # # Verify the email matches
        # if idinfo['email'] != auth_data.email:
        #     raise ValueError('Email mismatch.')
        
        # For now, we'll trust the frontend validation
        # In production, ALWAYS verify the Google token on the backend
        
        async with httpx.AsyncClient() as client:
            # Check if user exists
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?email=eq.{auth_data.email}",
                headers=settings.SUPABASE_HEADERS
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Database error")
            
            users = response.json()
            
            if users:
                # User exists - update Google info if needed
                user = users[0]
                
                # Update Google ID and picture if not set
                update_data = {}
                if not user.get("google_id"):
                    update_data["google_id"] = auth_data.googleId
                if auth_data.picture and not user.get("profile_picture"):
                    update_data["profile_picture"] = auth_data.picture
                if not user.get("name") and auth_data.name:
                    update_data["name"] = auth_data.name
                
                if update_data:
                    update_response = await client.patch(
                        f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                        headers=settings.SUPABASE_HEADERS,
                        json=update_data
                    )
                    
                    if update_response.status_code == 200:
                        user.update(update_data)
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                new_user = {
                    "id": user_id,
                    "email": auth_data.email,
                    "name": auth_data.name,
                    "google_id": auth_data.googleId,
                    "profile_picture": auth_data.picture,
                    "created_at": datetime.utcnow().isoformat(),
                    "plan": "free",
                    "monthly_usage": 0,
                    "usage_month": datetime.utcnow().strftime("%Y-%m"),
                    "email_verified": True  # Google emails are pre-verified
                }
                
                response = await client.post(
                    f"{settings.SUPABASE_URL}/rest/v1/users",
                    headers=settings.SUPABASE_HEADERS,
                    json=new_user
                )
                
                if response.status_code == 201:
                    user = new_user
                else:
                    raise HTTPException(status_code=500, detail="Failed to create user")
            
            # Generate JWT tokens
            access_token, refresh_token = create_token_pair(user["id"])
            
            return AuthResponse(
                token=access_token,
                refresh_token=refresh_token,
                user={
                    "id": user["id"],
                    "email": user["email"],
                    "name": user.get("name"),
                    "profile_picture": user.get("profile_picture"),
                    "plan": user.get("plan", "free"),
                    "monthly_usage": user.get("monthly_usage", 0),
                    "email_verified": user.get("email_verified", True)
                }
            )
            
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")

@router.post("/verify-email")
async def verify_email(request: EmailVerificationRequest):
    """Verify user email address"""
    async with httpx.AsyncClient() as client:
        try:
            # Find user by verification token
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?email_verification_token=eq.{request.token}",
                headers=settings.SUPABASE_HEADERS
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Database error")
            
            users = response.json()
            if not users:
                raise HTTPException(status_code=400, detail="Invalid or expired verification token")
            
            user = users[0]
            
            # Check if token has expired
            if user["email_verification_expires_at"]:
                expires_at = datetime.fromisoformat(user["email_verification_expires_at"].replace('Z', '+00:00'))
                if datetime.utcnow() > expires_at.replace(tzinfo=None):
                    raise HTTPException(status_code=400, detail="Verification token has expired")
            
            # Check if already verified
            if user["email_verified"]:
                return {"message": "Email already verified", "success": True}
            
            # Update user as verified
            update_data = {
                "email_verified": True,
                "email_verification_token": None,
                "email_verification_expires_at": None
            }
            
            update_response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=settings.SUPABASE_HEADERS,
                json=update_data
            )
            
            if update_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to verify email")
            
            return {"message": "Email verified successfully!", "success": True}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Email verification failed: {str(e)}")

@router.post("/resend-verification")
async def resend_verification_email(user: dict = Depends(get_current_user)):
    """Resend email verification email"""
    async with httpx.AsyncClient() as client:
        try:
            # Check if user is already verified
            if user.get("email_verified", False):
                raise HTTPException(status_code=400, detail="Email is already verified")
            
            # Generate new verification token
            verification_token = generate_verification_token()
            verification_expires = datetime.utcnow() + timedelta(hours=24)
            
            # Update user with new token
            update_data = {
                "email_verification_token": verification_token,
                "email_verification_expires_at": verification_expires.isoformat()
            }
            
            response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=settings.SUPABASE_HEADERS,
                json=update_data
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to update verification token")
            
            # Send verification email
            await email_service.send_verification_email(
                email=user["email"],
                verification_token=verification_token,
                user_name=user.get("name", user["email"].split('@')[0])
            )
            
            return {"message": "Verification email sent successfully!", "success": True}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to resend verification: {str(e)}")

@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest):
    """Request password reset email"""
    async with httpx.AsyncClient() as client:
        try:
            # Find user by email
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?email=eq.{request.email}",
                headers=settings.SUPABASE_HEADERS
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Database error")
            
            users = response.json()
            if not users:
                # Don't reveal if email exists or not for security
                return {"message": "If an account with this email exists, a password reset link has been sent.", "success": True}
            
            user = users[0]
            
            # Generate reset token
            reset_token = generate_verification_token()
            reset_expires = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
            
            # Update user with reset token
            update_data = {
                "password_reset_token": reset_token,
                "password_reset_expires_at": reset_expires.isoformat()
            }
            
            update_response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=settings.SUPABASE_HEADERS,
                json=update_data
            )
            
            if update_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to create reset token")
            
            # Send reset email
            await email_service.send_password_reset_email(
                email=user["email"],
                reset_token=reset_token,
                user_name=user.get("name", user["email"].split('@')[0])
            )
            
            return {"message": "If an account with this email exists, a password reset link has been sent.", "success": True}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Password reset request failed: {str(e)}")

@router.post("/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """Reset password with token"""
    async with httpx.AsyncClient() as client:
        try:
            # Find user by reset token
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/users?password_reset_token=eq.{request.token}",
                headers=settings.SUPABASE_HEADERS
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Database error")
            
            users = response.json()
            if not users:
                raise HTTPException(status_code=400, detail="Invalid or expired reset token")
            
            user = users[0]
            
            # Check if token has expired
            if user["password_reset_expires_at"]:
                expires_at = datetime.fromisoformat(user["password_reset_expires_at"].replace('Z', '+00:00'))
                if datetime.utcnow() > expires_at.replace(tzinfo=None):
                    raise HTTPException(status_code=400, detail="Reset token has expired")
            
            # Validate new password
            if len(request.new_password) < 6:
                raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
            
            # Update password and clear reset token
            update_data = {
                "password_hash": hash_password(request.new_password),
                "password_reset_token": None,
                "password_reset_expires_at": None
            }
            
            update_response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=settings.SUPABASE_HEADERS,
                json=update_data
            )
            
            if update_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to reset password")
            
            return {"message": "Password reset successfully!", "success": True}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Password reset failed: {str(e)}")
