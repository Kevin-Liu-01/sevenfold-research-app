"""
Test script to verify Supabase database operations
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add parent directory to path if running from tests folder
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from db.supabase import supabase

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Test configuration
TEST_PROJECT_ID = os.getenv("TEST_PROJECT_ID")

def test_database():
    """Test database connectivity and basic operations"""
    
    print("\n" + "="*50)
    print("DATABASE TEST")
    print("="*50)
    
    test_tab_id = None
    
    # Test 1: Connection
    print("\nTest 1: Database Connection")
    try:
        result = supabase.table("chat_convos").select("id").limit(1).execute()
        print("✓ Database connected")
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False
    
    # Test 2: Write Operations (if TEST_PROJECT_ID is set)
    if TEST_PROJECT_ID:
        print("\nTest 2: Write Operations")
        try:
            # Create tab
            tab_result = supabase.table("chat_convos").insert({
                "project_id": TEST_PROJECT_ID,
                "name": "Test Tab",
                "paper_ids": ["test.pdf"],
                "metadata": {"test": True}
            }).execute()
            
            test_tab_id = tab_result.data[0]["id"]
            print(f"✓ Created tab: {test_tab_id[:8]}...")
            
            # Create message
            msg_result = supabase.table("chat_messages").insert({
                "convo_id": test_tab_id,
                "role": "user",
                "data": "Test message"
            }).execute()
            
            print(f"✓ Created message: {msg_result.data[0]['id'][:8]}...")
            
        except Exception as e:
            print(f"✗ Write failed: {e}")
            return False
    else:
        print("\nTest 2: Write Operations")
        print("⚠ Skipped - Set TEST_PROJECT_ID in .env to test writes")
    
    # Test 3: Read Operations
    print("\nTest 3: Read Operations")
    try:
        # Read tabs
        tabs = supabase.table("chat_convos").select("*").limit(3).execute()
        print(f"✓ Read {len(tabs.data)} tabs")
        
        # Read with filter
        if test_tab_id:
            filtered = supabase.table("chat_messages")\
                .select("*")\
                .eq("convo_id", test_tab_id)\
                .execute()
            print(f"✓ Filtered query returned {len(filtered.data)} messages")
        
    except Exception as e:
        print(f"✗ Read failed: {e}")
    
    # Test 4: Cleanup
    if test_tab_id:
        print("\nTest 4: Cleanup")
        try:
            supabase.table("chat_convos").delete().eq("id", test_tab_id).execute()
            print("✓ Test data cleaned up")
        except Exception as e:
            print(f"✗ Cleanup failed: {e}")
    
    print("\n" + "="*50)
    print("DATABASE TEST COMPLETE")
    print("="*50 + "\n")
    
    return True

if __name__ == "__main__":
    success = test_database()
    
    if success:
        print("Database tests passed!")
        if not TEST_PROJECT_ID:
            print("\nTo test write operations, add to .env:")
            print("  TEST_PROJECT_ID=<any-valid-project-id>")
    else:
        print("Database tests failed.")