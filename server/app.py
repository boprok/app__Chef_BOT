"""
Legacy compatibility layer for the modular ChefBot API
This file maintains backward compatibility while using the new modular structure
"""

# Import the new modular app
from main import app

# Re-export for backward compatibility
__all__ = ["app"]
