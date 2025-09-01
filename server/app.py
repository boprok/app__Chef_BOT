"""
Legacy compatibility layer for the modular ChefBot API
This file maintains backward compatibility while using the new modular structure
"""

# Import the new modular app
from main import app

# Make app directly accessible at module level
# This ensures uvicorn can find it with 'app:app'
__all__ = ["app"]
