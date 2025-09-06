# Configuration settings for Chef Bot API
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class Settings:
    # API Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL")
    PROVIDER: str = os.getenv("PROVIDER", "auto").lower()
    
    # JWT Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET")
    JWT_ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")
    
    # Email Configuration (Resend)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://your-app-domain.com")
    
    # Usage Limits
    FREE_MAX_MONTHLY: int = int(os.getenv("FREE_MAX_MONTHLY", "10"))
    FREE_DELAY_SECONDS: float = float(os.getenv("FREE_DELAY_SECONDS", "2.0"))
    
    # Rate Limiting
    RATE_LIMIT_FREE_PER_HOUR: int = int(os.getenv("RATE_LIMIT_FREE_PER_HOUR", "3"))
    RATE_LIMIT_PRO_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PRO_PER_HOUR", "70"))
    
    # Security
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")
    
    # API Configuration
    API_TITLE: str = "Chef Bot API"
    API_DESCRIPTION: str = "AI-powered recipe analysis API for mobile applications"
    API_VERSION: str = "1.0.0"
    
    # CORS Configuration
    CORS_ORIGINS: list = ["*"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]
    
    @property
    def SUPABASE_HEADERS(self) -> dict:
        """Get Supabase headers for API requests"""
        return {
            "apikey": self.SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {self.SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
    
    def validate_required_vars(self) -> bool:
        """Validate that all required environment variables are set"""
        required_vars = {
            "GEMINI_API_KEY": self.GEMINI_API_KEY,
            "GEMINI_MODEL": self.GEMINI_MODEL,
            "JWT_SECRET": self.JWT_SECRET,
            "SUPABASE_URL": self.SUPABASE_URL,
            "SUPABASE_SERVICE_KEY": self.SUPABASE_SERVICE_KEY,
        }
        
        missing_vars = [var for var, value in required_vars.items() if not value]
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        return True

# Create global settings instance
settings = Settings()
