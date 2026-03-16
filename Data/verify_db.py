import os
from dotenv import load_dotenv, find_dotenv
from supabase import create_client

# 1. Force check if .env exists
if load_dotenv(find_dotenv()):
    print("✅ .env file loaded.")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

# 2. Check if variables are empty
if not url or not key:
    print(f"❌ Error: Missing credentials. URL: {url}, KEY: {'Loaded' if key else 'None'}")
else:
    print(f"🔗 Attempting to connect to: {url}")

try:
    supabase = create_client(url, key)
    
    # Correct way to get exact count in supabase-py:
    # We use head=True via the select options to avoid fetching rows
    response = supabase.table("users").select("*", count="exact").limit(0).execute()
    
    print(f"🚀 Connection Successful!")
    print(f"📊 Total Users in Database: {response.count}")

except Exception as e:
    print(f"🔥 Connection Failed: {str(e)}")