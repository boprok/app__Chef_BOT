"""Authentication utilities and JWT token management"""
import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

# Password hashing context with fallback
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    BCRYPT_AVAILABLE = True
    logger.info("✅ Bcrypt initialized successfully")
except Exception as e:
    logger.warning(f"⚠️ Bcrypt initialization failed: {e}")
    # Fallback to a simpler but less secure method
    pwd_context = None
    BCRYPT_AVAILABLE = False

def hash_password(password: str) -> str:
    """Hash a password using bcrypt or fallback method"""
    try:
        if BCRYPT_AVAILABLE and pwd_context:
            return pwd_context.hash(password)
        else:
            # Fallback: SHA-256 with salt (less secure but functional)
            import secrets
            salt = secrets.token_hex(16)
            hashed = hashlib.sha256((password + salt).encode()).hexdigest()
            return f"sha256${salt}${hashed}"
    except Exception as e:
        logger.error(f"❌ Hash password error: {e}")
        # Emergency fallback
        import secrets
        salt = secrets.token_hex(16)
        hashed = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"sha256${salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash with multiple format support"""
    try:
        # Try bcrypt first (modern format)
        if BCRYPT_AVAILABLE and pwd_context and not hashed_password.startswith(('sha256$', 'md5$', 'sha1$')):
            try:
                return pwd_context.verify(plain_password, hashed_password)
            except UnknownHashError:
                pass  # Fall through to legacy formats
        
        # Handle custom SHA-256 format (fallback format)
        if hashed_password.startswith('sha256$'):
            parts = hashed_password.split('$')
            if len(parts) == 3:
                _, salt, stored_hash = parts
                computed_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
                return computed_hash == stored_hash
        
        # Legacy hash formats (for existing users)
        if len(hashed_password) == 64:  # SHA-256 (no salt)
            return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
        
        if len(hashed_password) == 32:  # MD5
            return hashlib.md5(plain_password.encode()).hexdigest() == hashed_password
        
        if len(hashed_password) == 40:  # SHA-1
            return hashlib.sha1(plain_password.encode()).hexdigest() == hashed_password
        
        logger.warning(f"⚠️ Unknown hash format, length: {len(hashed_password)}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Password verification error: {e}")
        return False

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
