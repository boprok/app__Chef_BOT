#!/usr/bin/env python3
"""
Simple test script for Chef Bot API endpoints
"""

import requests
import json
import os
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_auth():
    """Test authentication endpoints"""
    print("\n🔐 Testing authentication...")
    
    # Test signup
    test_user = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=test_user, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Signup successful: {data['user']['email']}")
            token = data['token']
        elif response.status_code == 400 and "already registered" in response.text:
            print("⚠️ User already exists, trying login...")
            response = requests.post(f"{BASE_URL}/api/auth/login", json=test_user, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful: {data['user']['email']}")
                token = data['token']
            else:
                print(f"❌ Login failed: {response.text}")
                return None
        else:
            print(f"❌ Signup failed: {response.text}")
            return None
            
        # Test profile endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=5)
        if response.status_code == 200:
            profile = response.json()
            print(f"✅ Profile retrieved: {profile['email']}, usage: {profile['monthly_usage']}/{profile['monthly_limit']}")
        else:
            print(f"❌ Profile retrieval failed: {response.text}")
            
        return token
        
    except Exception as e:
        print(f"❌ Auth test failed: {e}")
        return None

def test_analyze(token):
    """Test analyze endpoint with a dummy image"""
    print("\n🖼️ Testing analyze endpoint...")
    
    if not token:
        print("❌ No token available for analyze test")
        return
    
    # Create a minimal test image (1x1 pixel PNG)
    # This is a base64 encoded 1x1 transparent PNG
    import base64
    test_image_data = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        files = {"file": ("test.png", test_image_data, "image/png")}
        data = {"prompt": "Test prompt"}
        
        response = requests.post(f"{BASE_URL}/api/analyze", headers=headers, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Analysis successful!")
            print(f"   Ingredients: {result.get('ingredients', [])}")
            print(f"   Recipes: {len(result.get('recipes', []))} found")
        else:
            print(f"❌ Analysis failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Analyze test failed: {e}")

def main():
    print("🚀 Chef Bot API Test Suite")
    print("=" * 40)
    
    # Test health first
    if not test_health():
        print("❌ Server not responding. Make sure it's running with ./start.sh")
        return
    
    # Test authentication
    token = test_auth()
    
    # Test analyze endpoint
    test_analyze(token)
    
    print("\n" + "=" * 40)
    print("✅ API test suite completed!")
    print("\n📱 Your React Native app can now connect to:")
    print(f"   Base URL: {BASE_URL}")
    print("   Health: /api/health")
    print("   Auth: /api/auth/signup, /api/auth/login, /api/auth/me") 
    print("   Analyze: /api/analyze")

if __name__ == "__main__":
    main()
