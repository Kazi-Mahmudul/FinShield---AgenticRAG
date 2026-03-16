# FinShield-AgenticRAG 🛡️🏦
**An Agentic Financial Intelligence System for Fraud Detection & Multilingual Advisory.**

FinShield-AgenticRAG is a production-grade blueprint for the next generation of Fintech security. It leverages an **Agentic State-Machine** (LangGraph) to orchestrate data across Relational, Graph, and Vector databases to provide real-time fraud insights and multilingual policy advisory.

---

## 🚀 Project Vision
In the modern Fintech landscape (e.g., bKash, Nagad), fraud detection requires more than simple SQL checks. FinShield combines:
- **Relational Integrity:** Using Supabase (PostgreSQL) for transaction ledgering.
- **Relational Patterns:** Using Neo4j to identify "Smurfing" and "Circular Transfer" fraud rings.
- **Multilingual RAG:** Providing policy support in English and Bengali using BGE-M3.
- **Explainable AI (XAI):** Not just flagging transactions, but explaining *why* they were flagged.

---

## 🏗️ System Architecture 
- **Orchestration:** [LangGraph](https://github.com/langchain-ai/langgraph) (State-machine based reasoning)
- **Primary LLM:** Mistral-7B (via Mistral API)
- **Databases:**
  - **SQL:** [Supabase](https://supabase.com/) (PostgreSQL)
  - **Graph:** [Neo4j Aura](https://neo4j.com/cloud/aura/)
  - **Vector:** Supabase pgvector (Planned)
- **Embeddings:** BGE-M3 (State-of-the-art Multilingual support)
- **Backend:** FastAPI (Asynchronous)

---

## 🛠️ Project Structure
```text
FinShield-AgenticRAG/
├── Codes/
│   ├── Data/               # Data generation & sync scripts
│   │   ├── users.csv       # (Ignored by git)
│   │   ├── transactions.csv
│   │   └── sync_to_neo4j.py
│   ├── Agent/              # LangGraph orchestration logic
│   └── API/                # FastAPI entry points
├── .env                    # Environment variables (Ignored)
├── requirements.txt        # Project dependencies
└── README.md               