import pandas as pd
import numpy as np
import random
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext

# --- Configuration ---
NUM_USERS = 5000
NUM_MERCHANTS = 500
NUM_TRANSACTIONS = 10000

# Setup Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PW_PLAIN = "FinShield@2026"
# Generate once to save time
print("🔐 Generating master hash for default password...")
DEFAULT_PW_HASH = pwd_context.hash(DEFAULT_PW_PLAIN)

# Localization Data
BD_NAMES = ["Abir", "Sadia", "Tanvir", "Nusrat", "Arif", "Sumaiya", "Rashed", "Farhana", "Kamal", "Liza"]
BD_SURNAMES = ["Hossain", "Ahmed", "Islam", "Rahman", "Khan", "Akter", "Chowdhury", "Sarker"]
OPERATORS = ["017", "018", "019", "016", "013", "015"]
CATEGORIES = ["Groceries", "Utilities", "Travel", "Food", "Pharmacy", "Electronics"]
LOCATIONS = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Rangpur", "Mymensingh"]

def generate_users(num):
    users = []
    
    test_credentials = [
        {"phone": "01711223344", "pass": "finshield123"},
        {"phone": "01811223344", "pass": "securepass2026"},
        {"phone": "01911223344", "pass": "dhaka@2026"},
        {"phone": "01511223344", "pass": "admin786"},
        {"phone": "01611223344", "pass": "softvenceAI"}
    ]

    print(f"👤 Generating {num} users...")
    for i in range(num):
        u_id = str(uuid.uuid4())
        name = f"{random.choice(BD_NAMES)} {random.choice(BD_SURNAMES)}"
        balance = round(random.uniform(500, 50000), 2)
        risk_score = round(random.uniform(0.01, 0.2), 2)
        is_verified = random.choice([True, True, True, False])
        last_active = datetime.now() - timedelta(days=random.randint(0, 90))
        
        if i < len(test_credentials):
            phone = test_credentials[i]["phone"]
            # FIX: Truncate to 72 bytes inside the hash function call
            h_pass = pwd_context.hash(test_credentials[i]["pass"][:72])
        else:
            phone = f"{random.choice(OPERATORS)}{random.randint(10000000, 99999999)}"
            # DEFAULT_PW_HASH was already generated safely at the top of the script
            h_pass = DEFAULT_PW_HASH
            
        users.append([u_id, name, phone, balance, risk_score, is_verified, last_active, h_pass])
    
    cols = ['user_id', 'name', 'phone', 'balance', 'risk_score', 'is_verified', 'last_active', 'hashed_password']
    return pd.DataFrame(users, columns=cols)

def generate_merchants(num):
    merchants = []
    for _ in range(num):
        m_id = str(uuid.uuid4())
        name = f"{random.choice(['Shop', 'Mart', 'Express', 'Telecom', 'Pharma'])} {random.choice(BD_SURNAMES)}"
        category = random.choice(CATEGORIES)
        location = random.choice(LOCATIONS)
        risk_level = random.choice(['Low', 'Low', 'Low', 'Medium', 'High'])
        merchants.append([m_id, name, category, location, risk_level])
    return pd.DataFrame(merchants, columns=['merchant_id', 'name', 'category', 'location', 'risk_level'])

# --- Core Execution ---
df_users = generate_users(NUM_USERS)
df_merchants = generate_merchants(NUM_MERCHANTS)

user_ids = df_users['user_id'].tolist()
merchant_ids = df_merchants['merchant_id'].tolist()
transactions = []
start_date = datetime.now() - timedelta(days=30)

print(f"💸 Generating {NUM_TRANSACTIONS} transactions...")

# 1. Normal Transactions
for _ in range(9500):
    t_type = random.choice(['CASH_IN', 'CASH_OUT', 'SEND_MONEY', 'PAYMENT', 'PAY_BILL'])
    sender = random.choice(user_ids)
    receiver = random.choice(merchant_ids) if t_type in ['PAYMENT', 'PAY_BILL'] else random.choice(user_ids)
    
    amount = round(random.uniform(10, 5000), 2)
    timestamp = start_date + timedelta(seconds=random.randint(0, 30*24*3600))
    status = "FAILED" if (amount > 30000 and t_type == 'CASH_OUT') else "SUCCESS"
    
    transactions.append([str(uuid.uuid4()), sender, receiver, amount, t_type, timestamp, f"dev_{random.randint(10,99)}", random.choice(LOCATIONS), status])

# 2. Fraud Injection (Simplified)
# Smurfing
target_user = user_ids[0]
for i in range(20):
    transactions.append([str(uuid.uuid4()), user_ids[i+1], target_user, 150.0, 'SEND_MONEY', start_date + timedelta(days=5, minutes=i*2), "dev_99", "Dhaka", "FLAGGED"])

# Velocity
v_user = user_ids[100]
for i in range(10):
    transactions.append([str(uuid.uuid4()), v_user, random.choice(merchant_ids), 500.0, 'PAYMENT', start_date + timedelta(days=10, minutes=i), "dev_88", "Chittagong", "FLAGGED"])

df_transactions = pd.DataFrame(transactions, columns=['transaction_id', 'sender_id', 'receiver_id', 'amount', 'trx_type', 'timestamp', 'device_id', 'location', 'status'])

# --- Saving ---
df_users.to_csv('users.csv', index=False)
df_merchants.to_csv('merchants.csv', index=False)
df_transactions.to_csv('transactions.csv', index=False)

print("\n✨ CSV generation complete with hashed_password column.")
print(f"👉 Default Password for most users: {DEFAULT_PW_PLAIN}")