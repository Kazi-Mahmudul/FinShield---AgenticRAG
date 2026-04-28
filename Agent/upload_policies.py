import os
from dotenv import load_dotenv
from supabase import create_client
import google.genai as genai  # Modern library
from google.genai import types

load_dotenv()

# Initialize Clients
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Use the list from your previous setup
policies = [
    {
        "content": "The daily cash-out limit for MFS personal accounts is 30,000 BDT from agent points and 2,500 BDT via ATM per transaction.",
        "content_bn": "এমএফএস ব্যক্তিগত অ্যাকাউন্টের জন্য এজেন্ট পয়েন্ট থেকে দৈনিক ক্যাশ-আউট সীমা ৩০,০০০ টাকা এবং এটিএম-এর মাধ্যমে প্রতি লেনদেনে ২,৫০০ টাকা।",
        "category": "Limits"
    },
    {
        "content": "Maximum account balance for a personal MFS wallet is 500,000 BDT. Exceeding this will restrict incoming funds.",
        "content_bn": "ব্যক্তিগত এমএফএস ওয়ালেটের সর্বোচ্চ ব্যালেন্স ৫,০০,০০০ টাকা। এর বেশি হলে ইনকামিং ফান্ড সীমাবদ্ধ করা হবে।",
        "category": "Limits"
    },
    {
        "content": "Suspicious transactions over 100,000 BDT must be reported to the AML (Anti-Money Laundering) unit within 24 hours.",
        "content_bn": "১,০০,০০০ টাকার বেশি সন্দেহজনক লেনদেন ২৪ ঘণ্টার মধ্যে এএমএল ইউনিটে রিপোর্ট করতে হবে।",
        "category": "Compliance"
    },
    {
        "content": "To unblock an account, the user must provide a physical copy of their NID and a live photo at a customer care center.",
        "content_bn": "অ্যাকাউন্ট আনব্লক করতে গ্রাহককে কাস্টমার কেয়ার সেন্টারে এনআইডির ফিজিক্যাল কপি এবং একটি লাইভ ছবি প্রদান করতে হবে।",
        "category": "Security"
    },
    {
        "content": "The monthly Send Money limit to non-saved numbers is 25,000 BDT, while saved numbers allow up to 100,000 BDT.",
        "content_bn": "অসংরক্ষিত নাম্বারে মাসিক সেন্ড মানি সীমা ২৫,০০০ টাকা, তবে সংরক্ষিত নাম্বারে ১,০০,০০০ টাকা পর্যন্ত পাঠানো যায়।",
        "category": "Limits"
    },
    {
        "content": "Daily mobile recharge limit is 5,000 BDT per transaction and 20,000 BDT aggregate per day.",
        "content_bn": "দৈনিক মোবাইল রিচার্জ সীমা প্রতি লেনদেনে ৫,০০০ টাকা এবং দিনে মোট ২০,০০০ টাকা।",
        "category": "Limits"
    },
    {
        "content": "A 1.25% cash-out fee applies for amounts over 1,000 BDT at agent points.",
        "content_bn": "এজেন্ট পয়েন্টে ১,০০০ টাকার বেশি ক্যাশ-আউটের জন্য ১.২৫% ফি প্রযোজ্য।",
        "category": "Fees"
    },
    {
        "content": "Accounts inactive for 12 consecutive months may be frozen and require KYC reactivation.",
        "content_bn": "১২ মাস ধরে নিষ্ক্রিয় অ্যাকাউন্ট ফ্রিজ করা যেতে পারে এবং কেওয়াইসি পুনরায় সক্রিয় করতে হবে।",
        "category": "Security"
    },
    {
        "content": "PIN must be changed every 90 days; reusing previous PINs is not allowed.",
        "content_bn": "পিন ৯০ দিন অন্তর পরিবর্তন করতে হবে; পূর্ববর্তী পিন পুনরায় ব্যবহার করা যাবে না।",
        "category": "Security"
    },
    {
        "content": "Merchant payments over 50,000 BDT require additional OTP verification.",
        "content_bn": "৫০,০০০ টাকার বেশি মার্চেন্ট পেমেন্টের জন্য অতিরিক্ত ওটিপি যাচাই প্রয়োজন।",
        "category": "Transactions"
    },
    {
        "content": "All users must complete full KYC (NID/Birth Certificate) within 30 days of registration.",
        "content_bn": "সকল ব্যবহারকারীকে নিবন্ধনের ৩০ দিনের মধ্যে সম্পূর্ণ কেওয়াইসি (এনআইডি/জন্ম সনদ) সম্পন্ন করতে হবে।",
        "category": "Compliance"
    },
    {
        "content": "Send Money fees are 0% for up to 1,000 BDT and 0.5% thereafter, capped at 50 BDT.",
        "content_bn": "সেন্ড মানির ফি ১,০০০ টাকা পর্যন্ত ০% এবং তারপর ০.৫%, সর্বোচ্চ ৫০ টাকা।",
        "category": "Fees"
    },
    {
        "content": "Three failed PIN attempts lock the account for 30 minutes.",
        "content_bn": "তিনবার ভুল পিন চেষ্টায় অ্যাকাউন্ট ৩০ মিনিটের জন্য লক হয়।",
        "category": "Security"
    },
    {
        "content": "Bill payments are limited to 10,000 BDT per transaction and 50,000 BDT daily.",
        "content_bn": "বিল পেমেন্ট প্রতি লেনদেনে ১০,০০০ টাকা এবং দৈনিক ৫০,০০০ টাকার সীমা।",
        "category": "Limits"
    },
    {
        "content": "Transactions to international numbers or unverified merchants are prohibited.",
        "content_bn": "আন্তর্জাতিক নাম্বার বা অযাচাইকৃত মার্চেন্টে লেনদেন নিষিদ্ধ।",
        "category": "Compliance"
    }
]


def upload():
    for p in policies:
        text_to_embed = f"Category: {p['category']} | English: {p['content']} | Bengali: {p['content_bn']}"
        print(f"📡 Generating 768-dim Embedding for {p['category']}...")
        
        # Generate embedding with EXPLICIT dimension setting
        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text_to_embed,
            config=types.EmbedContentConfig(
                output_dimensionality=768  # FIX: Forces the vector to be 768
            )
        )
        
        embedding = result.embeddings[0].values
        
        data = {
            "content": text_to_embed,
            "content_bn": p['content_bn'],
            "metadata": {"category": p['category']},
            "embedding": embedding
        }
        supabase.table("policy_vectors").insert(data).execute()
    
    print("\n✅ Successfully uploaded.")

if __name__ == "__main__":
    upload()