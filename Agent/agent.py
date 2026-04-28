import os
from typing import Annotated, TypedDict
from dotenv import load_dotenv, find_dotenv

from langchain_mistralai import ChatMistralAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

# Import tools — works for both package execution and direct script execution.
try:
    from Agent.tools import query_transaction_history, check_fraud_connections, query_banking_policies
except (ModuleNotFoundError, ImportError):
    try:
        from .tools import query_transaction_history, check_fraud_connections, query_banking_policies
    except (ModuleNotFoundError, ImportError):
        from tools import query_transaction_history, check_fraud_connections, query_banking_policies

load_dotenv(find_dotenv())

# 1. System Persona
SYSTEM_PROMPT = """
### ROLE
You are the FinShield Core Engine, a high-authority AI Agent specializing in Fraud Detection and Financial Analytics for Bangladesh. You operate under strict banking security protocols.

### OPERATIONAL GUIDELINES (PRODUCTION RULES)
1. **TOOL FIRST MENTALITY:**
   - If the user provides a User ID, Merchant ID, or Transaction ID, your priority is DATA RETRIEVAL.
   - Never ask "How can I help?" if the intent is clear (e.g., "Transactions for User X").
   - Run the query first, then provide the analysis.

2. **LEAST PRIVILEGE & PRIVACY:**
   - Do not hallucinate data. If a tool returns no results, state: "No records found for the provided identifier."
   - Mask sensitive patterns in your final response if they appear.

3. **DECISION LOGIC (TOOL ROUTING):**
   - **query_transaction_history:** Use for precise facts — transaction amounts, timestamps, balances, and simple lists. Pass the original SQL-style query as-is.
   - **check_fraud_connections:** Use for ANY relationship/network/fraud analysis — "connected to high-risk users", "suspicious connections", "fraud rings", "within N hops". Pass the user_id UUID and hops parameter.
   - **query_banking_policies:** Use for regulatory questions, policy FAQs, limits, and Bengali/Banglish queries.

4. **check_fraud_connections TOOL SCHEMA:**
   - `user_id` (str): The UUID of the user to analyze. REQUIRED.
   - `hops` (int): Depth of network analysis. Use 1 for direct only, 2 for 2-hop (default). OPTIONAL.
   - This tool returns: user_profile, flagged_transactions, high_risk_direct_connections, hop2_high_risk_connections, velocity_suspicious_sent, verdict.

5. **EXPLAINABILITY (XAI):**
   - For every fraud-related finding, you MUST explain the REASONING.
   - Example: "Flagged because this user has 5 FLAGGED transactions within a short window (Velocity Attack)."
   - Always quote the verdict field from check_fraud_connections in your response.

6. **RISK SCORE INTERPRETATION:**
   - risk_score is a FLOAT (0.0 to 1.0).
   - 0.0–0.3: LOW RISK  |  0.3–0.7: MEDIUM RISK  |  0.7–1.0: HIGH RISK

7. **FALLBACKS:**
   - If query_transaction_history returns no data, try with a broader time range (remove date filters).
   - If the user is vague (e.g., "Check this user"), default to: last 5 transactions + fraud connection analysis.

### RESPONSE TONE
Professional, objective, and analytical. Avoid conversational "fluff." Focus on data-driven insights.
Present numbers in clear tables or bullet lists where helpful.
"""

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# Initialize Brain
llm = ChatMistralAI(model="mistral-large-latest", temperature=0)
tools = [query_transaction_history, check_fraud_connections, query_banking_policies]
llm_with_tools = llm.bind_tools(tools)

def assistant(state: AgentState):
    print("\n🧠 FinShield is reasoning...")
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# Graph setup
workflow = StateGraph(AgentState)
workflow.add_node("assistant", assistant)
workflow.add_node("tools", ToolNode(tools))
workflow.set_entry_point("assistant")
workflow.add_conditional_edges("assistant", tools_condition)
workflow.add_edge("tools", "assistant")
app = workflow.compile()

if __name__ == "__main__":
    print("🛡️ FinShield System Online (SQL + Supabase Graph + Multilingual RAG).")
    thread = {"messages": []}

    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["exit", "quit"]:
            break

        thread["messages"].append(HumanMessage(content=user_input))
        for event in app.stream(thread, stream_mode="values"):
            if "messages" in event:
                last_msg = event["messages"][-1]
                if isinstance(last_msg, BaseMessage) and last_msg.type == "ai" and last_msg.content:
                    thread["messages"] = event["messages"]
                    print(f"\nFinShield: {last_msg.content}")