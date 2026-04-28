import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

from langchain_core.messages import HumanMessage
from agent import app

# Mistral free tier is ~6 RPM (requests per minute).
# Each test can burn 2-4 LLM calls (agent reasoning loop), so we space them out.
# 35 seconds gives ~10s buffer even for multi-call tests.
RATE_LIMIT_DELAY_SECONDS = 35
MAX_RETRIES = 2


def run_test(query: str):
    """Simulates a single interaction with the FinShield Agent and prints the result."""
    print(f"\n{'='*55}")
    print(f"USER QUERY: {query}")
    print(f"{'='*55}")

    inputs = {"messages": [HumanMessage(content=query)]}

    for event in app.stream(inputs, stream_mode="values"):
        if "messages" in event:
            last_msg = event["messages"][-1]

            # Show tool calls as they happen
            if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                for tool_call in last_msg.tool_calls:
                    print(f"\n🛠️  [TOOL CALL]: {tool_call['name']}")
                    print(f"    Args: {tool_call['args']}")

            # Show final AI answer
            elif last_msg.type == "ai" and last_msg.content:
                print(f"\n🤖 [FINSHIELD]:\n{last_msg.content}")


def run_test_with_retry(query: str, attempt: int = 1) -> bool:
    """Runs a test with automatic retry on 429 rate-limit errors."""
    try:
        run_test(query)
        return True
    except Exception as e:
        err = str(e)
        if "429" in err and attempt <= MAX_RETRIES:
            wait = RATE_LIMIT_DELAY_SECONDS * attempt  # back-off: 35s, 70s
            print(f"⚠️  Rate limit hit (attempt {attempt}/{MAX_RETRIES}). Retrying in {wait}s...")
            time.sleep(wait)
            return run_test_with_retry(query, attempt + 1)
        else:
            print(f"❌ Test Failed: {err}")
            return False


if __name__ == "__main__":
    test_suite = [
        # Tier 1: SQL — Transaction Facts
        "Show me the last 3 transactions for user 3b6b6f3c-2b5c-47b7-9f53-5daad4906c6c.",

        # Tier 2: Supabase Graph — Fraud Connections
        "Check if user 3b6b6f3c-2b5c-47b7-9f53-5daad4906c6c is connected to any high-risk users within 2 hops.",

        # Tier 3: Vector/RAG — Policy & Multilingual
        "What is the daily cash-out limit for a personal account?",
        "আমার অ্যাকাউন্ট ব্লক হয়ে গেলে খোলার নিয়ম কি?",  # Bengali RAG Test

        # Complex/Hybrid: Graph + SQL
        "Does user 3b6b6f3c-2b5c-47b7-9f53-5daad4906c6c have any suspicious connections? Also check their last balance.",
    ]

    print("🚀 Starting FinShield Integrated Test Suite...")
    print(f"⏱️  {RATE_LIMIT_DELAY_SECONDS}s delay + auto-retry between tests (Mistral rate limit guard).\n")

    passed = 0
    failed = 0

    for i, test in enumerate(test_suite):
        success = run_test_with_retry(test)
        if success:
            passed += 1
        else:
            failed += 1

        # Delay between tests (skip after the last one)
        if i < len(test_suite) - 1:
            print(f"\n⏳ Waiting {RATE_LIMIT_DELAY_SECONDS}s before next test...")
            time.sleep(RATE_LIMIT_DELAY_SECONDS)

    print(f"\n{'='*55}")
    print(f"✅ Tests Passed: {passed}/{len(test_suite)}")
    if failed:
        print(f"❌ Tests Failed: {failed}/{len(test_suite)}")
    print("Review the logs above before pushing to GitHub.")