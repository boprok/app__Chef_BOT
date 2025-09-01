"""Session management service"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
from fastapi import HTTPException
from config.settings import settings
from chefbot.utils.auth import hash_token

class SessionService:
    """Service for managing user sessions"""
    
    @staticmethod
    async def create_user_session(user_id: str, device_id: str, device_info: dict, refresh_token: str) -> dict:
        """Create a new user session and invalidate previous ones"""
        async with httpx.AsyncClient() as client:
            # First, invalidate all existing sessions for this user (one device policy)
            await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/user_sessions?user_id=eq.{user_id}",
                headers=settings.SUPABASE_HEADERS,
                json={"is_active": False}
            )
            
            # Create new session
            session_data = {
                "user_id": user_id,
                "device_id": device_id,
                "device_info": device_info,
                "refresh_token_hash": hash_token(refresh_token),
                "is_active": True,
                "expires_at": (datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()
            }
            
            # Use UPSERT (INSERT ... ON CONFLICT DO UPDATE)
            response = await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/user_sessions",
                headers={**settings.SUPABASE_HEADERS, "Prefer": "resolution=merge-duplicates"},
                json=session_data
            )
            
            if response.status_code not in [200, 201]:
                print(f"Failed to create session: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail="Failed to create session")
            
            # Handle empty response for successful creation
            try:
                return response.json() if response.text else {"status": "created"}
            except Exception as json_error:
                print(f"Session created but couldn't parse response: {json_error}")
                return {"status": "created"}
    
    @staticmethod
    async def invalidate_user_session(user_id: str, refresh_token: str):
        """Invalidate a specific user session"""
        try:
            # Hash the refresh token for database lookup
            token_hash = hash_token(refresh_token)
            
            async with httpx.AsyncClient() as client:
                # Mark session as inactive
                await client.patch(
                    f"{settings.SUPABASE_URL}/rest/v1/user_sessions?user_id=eq.{user_id}&refresh_token_hash=eq.{token_hash}",
                    headers=settings.SUPABASE_HEADERS,
                    json={
                        "is_active": False,
                        "last_activity": datetime.utcnow().isoformat()
                    }
                )
                
        except Exception as e:
            print(f"Error invalidating session: {str(e)}")
            # Don't raise exception - logout should succeed even if session cleanup fails
    
    @staticmethod
    async def validate_user_session(user_id: str, refresh_token: str) -> dict:
        """Validate if user session is active and return session info"""
        try:
            # Hash the refresh token for database lookup
            token_hash = hash_token(refresh_token)
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.SUPABASE_URL}/rest/v1/user_sessions?user_id=eq.{user_id}&refresh_token_hash=eq.{token_hash}&is_active=eq.true",
                    headers=settings.SUPABASE_HEADERS
                )
                
                if response.status_code == 200 and response.json():
                    session = response.json()[0]
                    # Update last_activity
                    await client.patch(
                        f"{settings.SUPABASE_URL}/rest/v1/user_sessions?id=eq.{session['id']}",
                        headers=settings.SUPABASE_HEADERS,
                        json={"last_activity": datetime.utcnow().isoformat()}
                    )
                    
                    return session
                else:
                    raise HTTPException(status_code=401, detail="Session not found or inactive")
                    
        except Exception as e:
            print(f"Error validating user session: {str(e)}")
            raise HTTPException(status_code=401, detail="Session validation failed")
    
    @staticmethod
    async def cleanup_expired_sessions() -> int:
        """Clean up expired sessions"""
        try:
            async with httpx.AsyncClient() as client:
                # Mark expired sessions as inactive
                await client.patch(
                    f"{settings.SUPABASE_URL}/rest/v1/user_sessions?expires_at=lt.{datetime.utcnow().isoformat()}&is_active=eq.true",
                    headers=settings.SUPABASE_HEADERS,
                    json={"is_active": False}
                )
                
                # Delete old inactive sessions (older than 30 days)
                await client.delete(
                    f"{settings.SUPABASE_URL}/rest/v1/user_sessions?expires_at=lt.{(datetime.utcnow() - timedelta(days=30)).isoformat()}",
                    headers=settings.SUPABASE_HEADERS
                )
                
                return 1  # Return success indicator
                
        except Exception as e:
            print(f"Error cleaning up sessions: {str(e)}")
            return 0
