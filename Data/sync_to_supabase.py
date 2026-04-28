"""
sync_to_supabase.py
-------------------
Syncs users, merchants, transactions, and user_transactions
(relationship graph) from local CSV files to Supabase.

Previously this also synced to Neo4j — that dependency has been
removed. All graph-style queries now run directly against Supabase.

Usage:
    python sync_to_supabase.py
"""

import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(supabase_url, supabase_key)


def sync_data():
    # Load CSV files (expected in the parent Codes/ directory)
    base = os.path.join(os.path.dirname(__file__), "..")
    users_df       = pd.read_csv(os.path.join(base, "users.csv"))
    merchants_df   = pd.read_csv(os.path.join(base, "merchants.csv"))
    txs_df         = pd.read_csv(os.path.join(base, "transactions.csv"))

    user_id_set = set(users_df["user_id"].values)

    # ------------------------------------------------------------------
    # 1. Users
    # ------------------------------------------------------------------
    print(f"👤 Syncing {len(users_df)} users to Supabase...")
    BATCH = 500
    for start in range(0, len(users_df), BATCH):
        batch = users_df.iloc[start : start + BATCH]
        records = [
            {
                "user_id":         row["user_id"],
                "name":            row["name"],
                "phone":           row["phone"],
                "balance":         float(row["balance"]),
                "risk_score":      float(row["risk_score"]),
                "is_verified":     bool(row["is_verified"]),
                "hashed_password": row["hashed_password"],
            }
            for _, row in batch.iterrows()
        ]
        supabase.table("users").upsert(records).execute()
        print(f"  ✅ Users {start + 1}–{start + len(batch)} synced.")

    # ------------------------------------------------------------------
    # 2. Merchants
    # ------------------------------------------------------------------
    print(f"\n🏪 Syncing {len(merchants_df)} merchants to Supabase...")
    for start in range(0, len(merchants_df), BATCH):
        batch = merchants_df.iloc[start : start + BATCH]
        records = [
            {
                "merchant_id": row["merchant_id"],
                "name":        row["name"],
                "category":    row["category"],
                "location":    row["location"],
                "risk_level":  row["risk_level"],
            }
            for _, row in batch.iterrows()
        ]
        supabase.table("merchants").upsert(records).execute()
        print(f"  ✅ Merchants {start + 1}–{start + len(batch)} synced.")

    # ------------------------------------------------------------------
    # 3. Transactions + Relationship Graph (user_transactions)
    # ------------------------------------------------------------------
    print(f"\n💸 Syncing {len(txs_df)} transactions to Supabase...")
    relationships = []

    for start in range(0, len(txs_df), BATCH):
        batch = txs_df.iloc[start : start + BATCH]
        tx_records = []
        for _, tx in batch.iterrows():
            tx_records.append({
                "transaction_id": tx["transaction_id"],
                "sender_id":      tx["sender_id"],
                "receiver_id":    tx["receiver_id"],
                "amount":         float(tx["amount"]),
                "trx_type":       tx["trx_type"],
                "timestamp":      str(tx["timestamp"]),
                "device_id":      tx["device_id"],
                "location":       tx["location"],
                "status":         tx["status"],
            })
            # Build relationship record for graph queries
            rel_type = "TRANSFERRED" if tx["receiver_id"] in user_id_set else "PAID"
            relationships.append({
                "transaction_id": tx["transaction_id"],
                "sender_id":      tx["sender_id"],
                "receiver_id":    tx["receiver_id"],
                "type":           rel_type,
            })

        supabase.table("transactions").upsert(tx_records).execute()
        print(f"  ✅ Transactions {start + 1}–{start + len(batch)} synced.")

    # ------------------------------------------------------------------
    # 4. User Transactions (relationship/graph table)
    # ------------------------------------------------------------------
    print(f"\n🔗 Syncing {len(relationships)} relationship records to user_transactions...")
    for start in range(0, len(relationships), BATCH):
        batch = relationships[start : start + BATCH]
        supabase.table("user_transactions").upsert(batch).execute()
        print(f"  ✅ Relationships {start + 1}–{start + len(batch)} synced.")

    print("\n✅ Full Supabase sync complete: users, merchants, transactions, and graph relationships.")


if __name__ == "__main__":
    sync_data()
