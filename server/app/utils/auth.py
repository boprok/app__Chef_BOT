"""Authentication utilities and JWT token management"""
import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from config.settings import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()

def create_token_pair(user_id: str, device_id: str) -> Dict[str, str]:
    """Create access and refresh token pair"""
    # Access token (short-lived)
    access_payload = {
        "user_id": user_id,
        "device_id": device_id,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_ACCESS_TOKEN_EXPIRE_HOURS),
        "iat": datetime.utcnow()
    }
    
    # Refresh token (long-lived)
    refresh_payload = {
        "user_id": user_id,
        "device_id": device_id,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": datetime.utcnow()
    }
    
    access_token = jwt.encode(access_payload, settings.JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET, algorithm="HS256")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }

def verify_token(token: str, required_type: str = "access") -> str:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        
        if payload.get("type") != required_type:
            raise jwt.InvalidTokenError(f"Token type mismatch. Expected {required_type}")
        
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")

def get_token_payload(token: str) -> Optional[Dict[str, Any]]:
    """Get token payload without verification (for debugging)"""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except:
        return None
