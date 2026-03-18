import os
from langchain_core.messages import HumanMessage
from agent import app  

def run_test(query: str):
    """Simulates a single interaction with the FinShield Agent."""
    print(f"\n{'='*50}")
    print(f"USER QUERY: {query}")
    print(f"{'='*50}")

    # Initialize the thread state
    inputs = {"messages": [HumanMessage(content=query)]}
    
    # Stream the events from the LangGraph
    for event in app.stream(inputs, stream_mode="values"):
        if "messages" in event:
            last_msg = event["messages"][-1]
            
            # Identify if it's a Tool Call or a Final Answer
            if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                for tool_call in last_msg.tool_calls:
                    print(f"\n🛠️  [TOOL CALL]: {tool_call['name']}")
                    print(f"    Args: {tool_call['args']}")
            
            elif last_msg.type == "ai" and last_msg.content:
                print(f"\n🤖 [FINSHIELD]:\n{last_msg.content}")

if __name__ == "__main__":
    # Define a suite of test cases to verify all 3 Tiers
    test_suite = [
        # Tier 1: SQL (Transaction Facts)
        "Show me the last 3 transactions for user 3b6b6f3c-2b5c-47b7-9f53-5daad4906c6c.",
        
        # Tier 2: Graph (Fraud Patterns)
        "Check if user 3b6b6f3c-2b5c-47b7-9f53-5daad4906c6c is connected to any high-risk users within 2 hops.",
        
        # Tier 3: Vector/RAG (Policy & Multilingual)
        "What is the daily cash-out limit for a personal account?",
        "আমার অ্যাকাউন্ট ব্লক হয়ে গেলে খোলার নিয়ম কি?", # Bengali RAG Test
        
        # Complex/Hybrid Reasoning
        "Does user 3b6b6f3c-2b5c-47b7-9f53-5daad4906c6c have any suspicious connections? Also check their last balance."
    ]

    print("🚀 Starting FinShield Integrated Test Suite...")
    
    for test in test_suite:
        try:
            run_test(test)
        except Exception as e:
            print(f"❌ Test Failed for query '{test}': {str(e)}")

    print("\n✅ Testing Complete. Review the logs above before pushing to GitHub.")