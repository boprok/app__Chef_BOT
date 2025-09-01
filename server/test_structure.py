#!/usr/bin/env python3
"""Test script for the modular ChefBot API"""

from main import app

print("✅ FastAPI app created successfully")
print("\n📍 Available routes:")

for route in app.routes:
    methods = getattr(route, "methods", ["GET"])
    if hasattr(route, 'path'):
        print(f"  {route.path:<25} - {list(methods)}")

print("\n🔧 App configuration:")
print(f"  Title: {app.title}")
print(f"  Version: {app.version}")
print(f"  Docs URL: {app.docs_url}")

print("\n🎯 Modular structure test completed successfully!")
