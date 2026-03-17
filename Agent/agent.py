import os
from typing import Annotated, TypedDict
from dotenv import load_dotenv, find_dotenv

from langchain_mistralai import ChatMistralAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

# Import tools from your previous tools.py file
from tools import query_transaction_history, check_fraud_patterns

load_dotenv(find_dotenv())

# 1. System Persona 
SYSTEM_PROMPT = """
### ROLE
You are the FinShield Core Engine, a high-authority AI Agent specializing in Fraud Detection and Financial Analytics. You operate under strict banking security protocols.

### OPERATIONAL GUIDELINES (PRODUCTION RULES)
1. **TOOL FIRST MENTALITY:** - If the user provides a User ID, Merchant ID, or Transaction ID, your priority is DATA RETRIEVAL. 
   - Never ask "How can I help?" if the intent is clear (e.g., "Transactions for User X"). 
   - Run the query first, then provide the analysis.

2. **LEAST PRIVILEGE & PRIVACY:**
   - Do not hallucinate data. If a tool returns no results, state: "No records found for the provided identifier."
   - Mask sensitive patterns in your final response if they appear (e.g., full account numbers), though your mock data is already safe.

3. **DECISION LOGIC (ROUTING):**
   - **SQL (query_transaction_history):** Use for precise facts, balances, timestamps, and simple lists.
   - **GRAPH (check_fraud_patterns):** Use for relationships, circular transfers, "friends of friends" analysis, and detecting if a user is connected to known flagged entities.

4. **EXPLAINABILITY (XAI):**
   - For every fraud-related finding, you must explain the REASONING. 
   - Example: "Flagged because this user has 5 transactions within 2 minutes (Velocity Attack)."

5. **FALLBACKS:**
   - If a SQL query fails, check the syntax and retry once with a simpler query (e.g., a basic LIMIT 5).
   - If the user is vague (e.g., "Check this user"), default to showing the last 5 transactions + their risk score.

### NEO4J GRAPH SCHEMA
- Nodes: 
    - (:User {id, name, risk_score})
    - (:Merchant {id, name, category, location})
- Relationships: 
    - (:User)-[:TRANSFERRED {amount, status}]->(:User)
    - (:User)-[:PAID {amount, status}]->(:Merchant)

Note: Always use 'TRANSFERRED' for Peer-to-Peer (P2P) and 'PAID' for Merchant transactions.

- Risk Score Logic: 'risk_score' is a FLOAT (0.0 to 1.0). 
  - 0.0 to 0.3: LOW
  - 0.3 to 0.7: MEDIUM
  - 0.7 to 1.0: HIGH
- Always filter using numeric comparisons (e.g., WHERE u.risk_score > 0.7) rather than string matches.

### RESPONSE TONE
Professional, objective, and analytical. Avoid conversational "fluff." Focus on data-driven insights.
"""

# 2. Define the Agent State
class AgentState(TypedDict):
    # This list will store the whole conversation
    messages: Annotated[list[BaseMessage], add_messages]

# 3. Initialize the Brain
# Using mistral-large-latest as it is best at following complex instructions
llm = ChatMistralAI(model="mistral-large-latest", temperature=0)
tools = [query_transaction_history, check_fraud_patterns]
llm_with_tools = llm.bind_tools(tools)

# 4. Node: The Assistant
def assistant(state: AgentState):
    print("\n🧠 FinShield is reasoning...")
    
    # We inject the SystemMessage at the start of every "thought" 
    # so the agent never forgets its rules.
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# 5. Build the Workflow Graph
workflow = StateGraph(AgentState)

# Define the two main nodes
workflow.add_node("assistant", assistant)
workflow.add_node("tools", ToolNode(tools))

# Entry point
workflow.set_entry_point("assistant")

# Logic: After assistant, should we go to tools or end?
workflow.add_conditional_edges(
    "assistant",
    tools_condition, # This checks if the LLM called a tool
)

# Logic: After tools are used, always return to assistant to summarize
workflow.add_edge("tools", "assistant")

# Compile
app = workflow.compile()

# 6. Interaction Loop
if __name__ == "__main__":
    print("🛡️ FinShield System Online.")
    print("(Type 'exit' to stop)")
    
    # We keep a simple list of messages to maintain conversation memory
    thread = {"messages": []}
    
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["exit", "quit"]:
            break
            
        thread["messages"].append(HumanMessage(content=user_input))
        
        # Stream the graph execution
        for event in app.stream(thread, stream_mode="values"):
            # We look for the last message in the state to print the output
            if "messages" in event:
                last_msg = event["messages"][-1]
                # Only print if it's an AI message and has actual text (not tool calls)
                if isinstance(last_msg, BaseMessage) and last_msg.type == "ai" and last_msg.content:
                    # Update our local thread memory so the agent stays 'smart'
                    thread["messages"] = event["messages"]
                    print(f"\nFinShield: {last_msg.content}")