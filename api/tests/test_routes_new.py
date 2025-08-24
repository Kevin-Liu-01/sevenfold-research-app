"""
Test script to verify API routes are working
"""

import os
import sys
import json
from pathlib import Path
import requests
from typing import Optional

# Add parent directory to path if running from tests folder
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from db.supabase import supabase

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Test configuration
API_BASE_URL = "http://localhost:8080" # Change to whatever endpoint API is running on
TEST_PROJECT_ID = os.getenv("TEST_PROJECT_ID")
TEST_USER_EMAIL = os.getenv("TEST_USER_EMAIL")
TEST_USER_PASSWORD = os.getenv("TEST_USER_PASSWORD")
TEST_CONVO_ID = os.getenv("TEST_CONVO_ID")

def get_test_token():
    """Get a valid JWT token from Supabase Auth"""
    print("\nGetting authentication token...")
    
    if not TEST_USER_EMAIL or not TEST_USER_PASSWORD:
        print("✗ Missing test credentials in .env")
        print("\nAdd to your .env file:")
        print("  TEST_USER_EMAIL=your-test-email@example.com")
        print("  TEST_USER_PASSWORD=your-test-password")
        return None, None
    
    try:
        # Try to sign in
        response = supabase.auth.sign_in_with_password({
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.session:
            print(f"✓ Logged in as: {TEST_USER_EMAIL}")
            print(f"  User ID: {response.user.id}")
            return response.session.access_token, response.user.id
        else:
            print(f"✗ Login failed for {TEST_USER_EMAIL}")
            print("  Check your credentials or create the user first")
            return None, None
                
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        return None, None

def ensure_test_project(user_id: str):
    """Ensure a test project exists for the user"""
    try:
        # Check if user has any projects
        result = supabase.table("projects")\
            .select("id, name")\
            .eq("owner_id", user_id)\
            .limit(1)\
            .execute()
        
        if result.data:
            project_id = result.data[0]["id"]
            print(f"✓ Using existing project: {result.data[0]['name']}")
            return project_id
        else:
            # Create a test project
            create_result = supabase.table("projects")\
                .insert({
                    "user_id": user_id,
                    "name": "Test Project for API Routes",
                    "description": "Auto-generated for testing"
                })\
                .execute()
            
            if create_result.data:
                project_id = create_result.data[0]["id"]
                print(f"✓ Created test project: {project_id[:8]}...")
                return project_id
            else:
                print("✗ Could not create test project")
                return None
                
    except Exception as e:
        print(f"✗ Project setup failed: {e}")
        return None

def test_api_routes():
    """Test API routes functionality"""
    
    print("\n" + "="*50)
    print("API ROUTES TEST")
    print("="*50)
    
    # Get authentication token
    token, user_id = get_test_token()
    if not token:
        print("\n✗ Cannot proceed without authentication")
        return False
    
    # Ensure test project exists
    project_id = ensure_test_project(user_id)
    if not project_id:
        print("\n✗ Cannot proceed without a project")
        return False
    
    
    # Test 1: Send Chat Message
    print("\nTest 3: Send Message (POST /chatbot/chat/new_message)")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/chat/new_message",
            json={
                "convo_id": TEST_CONVO_ID,
                "message": "Hello, this is a test message"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Message sent and response received")
            print(f"  Response preview: {data['message']['data'][:50]}...")
            if "tab_name_generated" in data:
                print(f"  Tab renamed to: {data['tab_name_generated']}")
            return True
        else:
            print(f"✗ Failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Request failed: {e}")
        return False
    
if __name__ == "__main__":
    print("Starting API routes test...")
    print("Note: Make sure your FastAPI server is running!")
    
    success = test_api_routes()
    
    if success:
        print("API routes test completed!")
    else:
        print("API routes test failed or incomplete.")