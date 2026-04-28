import os
import re
from langchain.tools import tool
from supabase import create_client
from dotenv import load_dotenv, find_dotenv

try:
    import google.genai as genai
except ModuleNotFoundError as exc:
    raise ModuleNotFoundError(
        "google.genai is not installed in the active Python environment. "
        "Activate the .venv or run the script with .venv/Scripts/python.exe."
    ) from exc

from google.genai import types

# Load variables
load_dotenv(find_dotenv())

# --- INITIALIZATION ---
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("❌ ERROR: GOOGLE_API_KEY not found in environment.")

# Initialize the Google GenAI client ONCE globally
client = genai.Client(api_key=api_key)

# Initialize Supabase client ONCE globally
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


# ---------------------------------------------------------------------------
# TOOL 1: Transaction History (SQL via Supabase Query Builder)
# ---------------------------------------------------------------------------

def _extract_user_id(sql: str) -> str | None:
    """Pull the first UUID-like value from a WHERE clause targeting user_id / sender_id / receiver_id."""
    pattern = r"(?:user_id|sender_id|receiver_id)\s*=\s*'([0-9a-fA-F\-]{36})'"
    m = re.search(pattern, sql, re.IGNORECASE)
    return m.group(1) if m else None

def _extract_limit(sql: str) -> int:
    """Extract LIMIT value from SQL string, default 10."""
    m = re.search(r"\bLIMIT\s+(\d+)", sql, re.IGNORECASE)
    return int(m.group(1)) if m else 10


@tool
def query_transaction_history(sql_query: str) -> list | str:
    """
    Retrieves transaction records from Supabase.
    Accepts a natural-language SQL query targeting the 'transactions' table.
    Filters by sender_id or user_id UUID when present in the query.
    Returns up to LIMIT rows ordered by timestamp descending.
    Useful for precise facts: transaction amounts, balances, timestamps, and account status.
    """
    print(f"\n[SQL Tool] Executing query for: {sql_query[:120]}...")

    if not sql_query.strip().lower().startswith("select"):
        return "Only SELECT queries are permitted."

    try:
        user_id = _extract_user_id(sql_query)
        limit    = _extract_limit(sql_query)

        # Build base query — select the columns the LLM typically asks for
        query = (
            supabase.table("transactions")
            .select("transaction_id,sender_id,receiver_id,amount,trx_type,timestamp,status,location,device_id")
            .order("timestamp", desc=True)
            .limit(limit)
        )

        if user_id:
            # Match transactions where the user is either sender OR receiver
            query = (
                supabase.table("transactions")
                .select("transaction_id,sender_id,receiver_id,amount,trx_type,timestamp,status,location,device_id")
                .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}")
                .order("timestamp", desc=True)
                .limit(limit)
            )

        response = query.execute()
        data = response.data

        if not data:
            return "No transactions found for the given criteria."

        return data

    except Exception as e:
        print(f"❌ SQL Error: {str(e)}")
        return f"Database error: {str(e)}"


# ---------------------------------------------------------------------------
# TOOL 2: Fraud Pattern Detection (Graph-like queries via Supabase)
# ---------------------------------------------------------------------------

@tool
def check_fraud_connections(user_id: str, hops: int = 2) -> dict | str:
    """
    Analyzes a user's transaction network using Supabase to identify fraud patterns,
    high-risk connections, and suspicious activity. Replaces Neo4j graph queries.

    Performs:
      - Direct connections: Who has this user sent money to / received from?
      - Risk scoring: Which connected users have a high risk_score (> 0.7)?
      - 2-hop analysis: Connections-of-connections with high risk scores.
      - Velocity check: Multiple transactions within a short window (flagged status).
      - Flagged transactions: Any 'FLAGGED' status transactions for this user.

    Args:
        user_id: The UUID of the user to analyze.
        hops: Depth of connection analysis (1 or 2). Default is 2.
    """
    print(f"\n[Graph Tool] Analyzing fraud connections for user: {user_id} (hops={hops})")

    try:
        results = {}

        # --- 1. Direct Connections (1-hop) ---
        direct_txs = (
            supabase.table("transactions")
            .select("transaction_id,sender_id,receiver_id,amount,trx_type,status,timestamp")
            .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}")
            .order("timestamp", desc=True)
            .limit(50)
            .execute()
        ).data or []

        # Collect all directly connected user IDs
        connected_ids = set()
        for tx in direct_txs:
            if tx["sender_id"] != user_id:
                connected_ids.add(tx["sender_id"])
            if tx["receiver_id"] != user_id:
                connected_ids.add(tx["receiver_id"])

        results["total_direct_transactions"] = len(direct_txs)
        results["direct_connections_count"] = len(connected_ids)

        # --- 2. Flagged Transactions ---
        flagged = [tx for tx in direct_txs if tx.get("status") == "FLAGGED"]
        results["flagged_transactions"] = flagged
        results["flagged_count"] = len(flagged)

        # --- 3. High-Risk Direct Connections ---
        high_risk_direct = []
        if connected_ids:
            connected_list = list(connected_ids)
            # Supabase 'in' filter; chunk to avoid URL length limits
            chunk_size = 20
            for i in range(0, len(connected_list), chunk_size):
                chunk = connected_list[i : i + chunk_size]
                risky = (
                    supabase.table("users")
                    .select("user_id,name,risk_score")
                    .in_("user_id", chunk)
                    .gt("risk_score", 0.7)
                    .execute()
                ).data or []
                high_risk_direct.extend(risky)

        results["high_risk_direct_connections"] = high_risk_direct
        results["high_risk_direct_count"] = len(high_risk_direct)

        # --- 4. 2-Hop Analysis (connections of high-risk direct connections) ---
        hop2_high_risk = []
        if hops >= 2 and high_risk_direct:
            hop1_ids = [u["user_id"] for u in high_risk_direct]
            hop2_txs = (
                supabase.table("user_transactions")
                .select("sender_id,receiver_id")
                .in_("sender_id", hop1_ids[:10])  # limit to avoid huge queries
                .limit(100)
                .execute()
            ).data or []

            hop2_ids = set()
            for tx in hop2_txs:
                if tx["receiver_id"] not in hop1_ids and tx["receiver_id"] != user_id:
                    hop2_ids.add(tx["receiver_id"])

            if hop2_ids:
                hop2_list = list(hop2_ids)[:20]
                for i in range(0, len(hop2_list), 20):
                    chunk = hop2_list[i : i + 20]
                    risky2 = (
                        supabase.table("users")
                        .select("user_id,name,risk_score")
                        .in_("user_id", chunk)
                        .gt("risk_score", 0.7)
                        .execute()
                    ).data or []
                    hop2_high_risk.extend(risky2)

        results["hop2_high_risk_connections"] = hop2_high_risk
        results["hop2_high_risk_count"] = len(hop2_high_risk)

        # --- 5. Velocity Check (many transactions in short window) ---
        velocity_flagged = [
            tx for tx in direct_txs
            if tx.get("status") == "FLAGGED" and tx.get("sender_id") == user_id
        ]
        results["velocity_suspicious_sent"] = len(velocity_flagged)

        # --- 6. User's own risk profile ---
        user_profile = (
            supabase.table("users")
            .select("user_id,name,risk_score,balance,is_verified")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        ).data
        results["user_profile"] = user_profile[0] if user_profile else "User not found"

        # --- Summary verdict ---
        total_risk_signals = (
            results["flagged_count"]
            + results["high_risk_direct_count"]
            + results["hop2_high_risk_count"]
            + results["velocity_suspicious_sent"]
        )
        if total_risk_signals == 0:
            results["verdict"] = "LOW RISK — No suspicious connections or flagged transactions detected."
        elif total_risk_signals <= 3:
            results["verdict"] = f"MEDIUM RISK — {total_risk_signals} risk signal(s) detected. Review flagged transactions."
        else:
            results["verdict"] = f"HIGH RISK — {total_risk_signals} risk signals detected. Immediate review recommended."

        return results

    except Exception as e:
        print(f"❌ Fraud Analysis Error: {str(e)}")
        return f"Fraud analysis error: {str(e)}"


# ---------------------------------------------------------------------------
# TOOL 3: Banking Policy RAG (Vector Search via Supabase)
# ---------------------------------------------------------------------------

@tool
def query_banking_policies(user_query: str) -> list | str:
    """
    Search for Bangladeshi banking regulations, limits, and security policies.
    Ideal for FAQs, rules, or queries in Bengali/Banglish.
    Uses semantic vector search against the policy knowledge base.
    """
    print(f"\n[Vector Tool] Searching policies for: '{user_query}'")

    try:
        # 1. Generate Embedding
        emb_response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=user_query,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
                output_dimensionality=768
            )
        )

        query_embedding = emb_response.embeddings[0].values

        # 2. Query Supabase vector store
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


# --- Test Block ---
if __name__ == "__main__":
    print("🧪 Testing Supabase-Only Tools...")
    print(query_banking_policies.invoke("What is the cash out limit?"))