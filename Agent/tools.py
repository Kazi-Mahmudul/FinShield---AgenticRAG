import os
from google import genai      
from google.genai import types 
from langchain.tools import tool
from neo4j import GraphDatabase
from supabase import create_client
from dotenv import load_dotenv, find_dotenv

# Load variables
load_dotenv(find_dotenv())

# --- INITIALIZATION ---
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("❌ ERROR: GOOGLE_API_KEY not found in environment.")

# Initialize the client ONCE globally
client = genai.Client(api_key=api_key)

# Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@tool
def query_banking_policies(user_query: str):
    """
    Search for Bangladeshi banking regulations, limits, and security policies. 
    Ideal for FAQs, rules, or queries in Bengali/Banglish.
    """
    print(f"\n[Vector Tool] Searching policies for: '{user_query}'")
    
    try:
        # 1. Generate Embedding using the CLIENT instance
        emb_response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=user_query,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY", 
                output_dimensionality=768
            )
        )
        
        # Access vector: New SDK uses .embeddings[0].values
        query_embedding = emb_response.embeddings[0].values

        # 2. Query Supabase
        rpc_params = {
            "query_embedding": query_embedding,
            "match_threshold": 0.4, 
            "match_count": 3
        }
        
        response = supabase.rpc("match_policies", rpc_params).execute()
        
        if not response.data:
            return "No relevant policy found in the database."
            
        return response.data
        
    except Exception as e:
        print(f"❌ Vector Error: {str(e)}")
        return f"Error: {str(e)}"

# --- SQL Tool: Transaction Database ---
@tool
def query_transaction_history(sql_query: str):
    """
    Useful for precise facts: transaction amounts, balances, and account status. 
    Input must be a valid SQL query for the 'transactions' table.
    """
    print(f"\n[SQL Tool] Executing: {sql_query}")
    
    try:
        # In production, you'd pass the actual sql_query to a secure stored procedure.
        response = supabase.table("transactions").select("*").limit(5).execute()
        return response.data
    except Exception as e:
        print(f"❌ SQL Error: {str(e)}")
        return f"Database error: {str(e)}"

# --- Graph Tool: Relationship Analysis ---
@tool
def check_fraud_patterns(cypher_query: str):
    """
    Useful for identifying fraud rings, circular transfers, and connections. 
    Input must be a valid Cypher query for Neo4j.
    """
    print(f"\n[Graph Tool] Executing Cypher: {cypher_query}")
    
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USERNAME")
    pwd = os.getenv("NEO4J_PASSWORD")
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, pwd))
        with driver.session() as session:
            result = session.run(cypher_query)
            return [record.data() for record in result]
    except Exception as e:
        print(f"❌ Graph Error: {str(e)}")
        return f"Graph error: {str(e)}"
    finally:
        if 'driver' in locals():
            driver.close()

# --- Test Block ---
if __name__ == "__main__":
    print("🧪 Testing Cloud-Ready Tools...")
    # Test Vector Search (Will return 'No matches' if DB is empty)
    print(query_banking_policies.invoke("What is the cash out limit?"))