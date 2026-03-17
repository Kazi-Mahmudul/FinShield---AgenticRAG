import os
from langchain.tools import tool
from supabase import create_client
from neo4j import GraphDatabase
from dotenv import load_dotenv, find_dotenv

# Load credentials
print("🔍 Loading environment variables...")
load_dotenv(find_dotenv())

# --- SQL Tool for Supabase ---
@tool
def query_transaction_history(query: str):
    """
    Useful for answering questions about specific transaction amounts, 
    user balances, and account statuses. Input should be a valid SQL query.
    """
    print(f"\n[SQL Tool] Received Query: {query}")
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    try:
        supabase = create_client(url, key)
        print("📡 Connecting to Supabase...")
        
        # Note: In a real agentic setup, we'd use a safe SQL executor. 
        # For now, we are testing by fetching the first 5 transactions.
        response = supabase.table("transactions").select("*").limit(5).execute()
        
        print(f"✅ SQL Query Successful. Retrieved {len(response.data)} rows.")
        return response.data
    except Exception as e:
        print(f"❌ SQL Error: {str(e)}")
        return f"Error: {str(e)}"

# --- Graph Tool for Neo4j ---
@tool
def check_fraud_patterns(cypher_query: str):
    """
    Useful for finding relationships between users, circular transfers, 
    and identifying fraud rings. Input should be a valid Cypher query.
    """
    print(f"\n[Graph Tool] Received Cypher: {cypher_query}")
    
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USERNAME")
    pwd = os.getenv("NEO4J_PASSWORD")
    
    try:
        print("📡 Connecting to Neo4j...")
        driver = GraphDatabase.driver(uri, auth=(user, pwd))
        with driver.session() as session:
            result = session.run(cypher_query)
            data = [record.data() for record in result]
            print(f"✅ Graph Query Successful. Retrieved {len(data)} nodes/edges.")
            return data
    except Exception as e:
        print(f"❌ Graph Error: {str(e)}")
        return f"Error: {str(e)}"
    finally:
        if 'driver' in locals():
            driver.close()

# --- Test Execution Block ---
if __name__ == "__main__":
    print("\n--- Testing Tools Locally ---")
    
    # Test SQL Tool
    print("Testing SQL Tool...")
    sql_result = query_transaction_history.invoke("SELECT * FROM transactions LIMIT 5")
    
    # Test Graph Tool
    print("\nTesting Graph Tool...")
    # This query finds a user and their immediate payment connections
    cypher_test = "MATCH (u:User)-[r:PAID]->(m:Merchant) RETURN u.name, m.name LIMIT 3"
    graph_result = check_fraud_patterns.invoke(cypher_test)
    
    print("\n--- Final Results Preview ---")
    print(f"SQL Sample: {sql_result[0] if sql_result else 'No Data'}")
    print(f"Graph Sample: {graph_result[0] if graph_result else 'No Data'}")