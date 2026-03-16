import os
import pandas as pd
from neo4j import GraphDatabase
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

uri = os.getenv("NEO4J_URI")
user = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(uri, auth=(user, password))

def sync_data():
    # Load all three files
    users_df = pd.read_csv("users.csv")
    merchants_df = pd.read_csv("merchants.csv")
    txs_df = pd.read_csv("transactions.csv")

    with driver.session() as session:
        # 1. Create User Nodes
        print("👤 Syncing Users...")
        session.run("""
            UNWIND $data AS row
            MERGE (u:User {id: row.user_id})
            SET u.name = row.name, u.risk_score = row.risk_score
        """, data=users_df.to_dict('records'))

        # 2. Create Merchant Nodes
        print("🏪 Syncing Merchants...")
        session.run("""
            UNWIND $data AS row
            MERGE (m:Merchant {id: row.merchant_id})
            SET m.name = row.name, m.category = row.category, m.location = row.location
        """, data=merchants_df.to_dict('records'))

        # 3. Create Relationships (The Magic Part)
        print("🔗 Connecting Transactions...")
        # We handle relationships to both Users AND Merchants
        session.run("""
            UNWIND $data AS tx
            // Match the sender (always a user in our mock data)
            MATCH (sender:User {id: tx.sender_id})
            
            // Try to match receiver as a User first, then as a Merchant
            OPTIONAL MATCH (receiverU:User {id: tx.receiver_id})
            OPTIONAL MATCH (receiverM:Merchant {id: tx.receiver_id})
            
            WITH tx, sender, receiverU, receiverM
            
            // Create relationship to User if they exist
            FOREACH (ignore IN CASE WHEN receiverU IS NOT NULL THEN [1] ELSE [] END |
                MERGE (sender)-[:TRANSFERRED {
                    amount: tx.amount, 
                    type: tx.trx_type, 
                    id: tx.transaction_id,
                    status: tx.status
                }]->(receiverU)
            )
            
            // Create relationship to Merchant if they exist
            FOREACH (ignore IN CASE WHEN receiverM IS NOT NULL THEN [1] ELSE [] END |
                MERGE (sender)-[:PAID {
                    amount: tx.amount, 
                    type: tx.trx_type, 
                    id: tx.transaction_id,
                    status: tx.status
                }]->(receiverM)
            )
        """, data=txs_df.to_dict('records'))

    print("✅ Neo4j Fully Synced: Users, Merchants, and Relationships created!")

if __name__ == "__main__":
    sync_data()
    driver.close()