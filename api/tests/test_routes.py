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

# Track created resources for cleanup
test_tab_id = None

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
            .eq("user_id", user_id)\
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
    
    global test_tab_id
    
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
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Create Chat Tab
    print("\nTest 1: Create Chat Tab (POST /chatbot/tabs)")
    try:
        response = requests.post(
            f"{API_BASE_URL}/chatbot/tabs",
            json={"project_id": project_id},
            headers=headers
        )
        
        if response.status_code == 201:
            data = response.json()
            test_tab_id = data["id"]
            print(f"✓ Tab created: {test_tab_id[:8]}...")
        else:
            print(f"✗ Failed: {response.status_code} - {response.text[:100]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to API. Is the server running?")
        print(f"  Start with: uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"✗ Request failed: {e}")
        return False
    
    # Test 2: Get Project Tabs
    print("\nTest 2: Get Tabs (GET /chatbot/tabs/project/{id})")
    try:
        response = requests.get(
            f"{API_BASE_URL}/chatbot/tabs/project/{project_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {len(data)} tabs")
        else:
            print(f"✗ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Request failed: {e}")
    
    # Test 3: Send Chat Message
    print("\nTest 3: Send Message (POST /chatbot/chat)")
    try:
        response = requests.post(
            f"{API_BASE_URL}/chatbot/chat",
            json={
                "tab_id": test_tab_id,
                "message": "Hello, this is a test message"
            },
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Message sent and response received")
            print(f"  Response preview: {data['message']['content'][:50]}...")
            if "tab_name_generated" in data:
                print(f"  Tab renamed to: {data['tab_name_generated']}")
        else:
            print(f"✗ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Request failed: {e}")
    
    # Test 4: Get Messages
    print("\nTest 4: Get Messages (GET /chatbot/tabs/{id}/messages)")
    try:
        response = requests.get(
            f"{API_BASE_URL}/chatbot/tabs/{test_tab_id}/messages",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {len(data)} messages")
        else:
            print(f"✗ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Request failed: {e}")
    
    # Test 5: Update Tab
    print("\nTest 5: Update Tab (PUT /chatbot/tabs/{id})")
    try:
        response = requests.put(
            f"{API_BASE_URL}/chatbot/tabs/{test_tab_id}",
            json={"name": "Updated Test Tab"},
            headers=headers
        )
        
        if response.status_code == 200:
            print("✓ Tab updated successfully")
        else:
            print(f"✗ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Request failed: {e}")
    
    # Test 6: Delete Tab (Cleanup)
    print("\nTest 6: Delete Tab (DELETE /chatbot/tabs/{id})")
    try:
        response = requests.delete(
            f"{API_BASE_URL}/chatbot/tabs/{test_tab_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✓ Tab deleted (cleanup complete)")
        else:
            print(f"✗ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Cleanup failed: {e}")
    
    print("\n" + "="*50)
    print("API ROUTES TEST COMPLETE")
    print("="*50 + "\n")
    
    return True

if __name__ == "__main__":
    print("Starting API routes test...")
    print("Note: Make sure your FastAPI server is running!")
    
    success = test_api_routes()
    
    if success:
        print("API routes test completed!")
    else:
        print("API routes test failed or incomplete.")