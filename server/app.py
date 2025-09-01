"""
Legacy compatibility layer for the modular ChefBot API
This file maintains backward compatibility while using the new modular structure
"""

# Import the new modular app and make it directly available
try:
    from main import app
    print("✅ Successfully imported app from main module")
except ImportError as e:
    print(f"❌ Failed to import app from main: {e}")
    # Create a minimal fallback app for debugging
    from fastapi import FastAPI
    app = FastAPI(title="ChefBot API - Import Error", description="Failed to load main app")
    
    @app.get("/")
    def root():
        return {"error": "Failed to import main app", "message": str(e)}

# Ensure app is accessible at module level for uvicorn
# This is what uvicorn looks for when using 'app:app'
__all__ = ["app"]
