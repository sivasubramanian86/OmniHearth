# System Architecture: OmniHearth

This document outlines the production-ready system architecture, component topologies, data models, and trade-off matrices for **OmniHearth**, an autonomous Household Operating System.

---

## 1. System Topology Sketch

```
[ Family Browsers / Tablets ]
             │
             ▼ (HTTPS / WebSockets / WAF)
   ┌─────────────────────────────────────────────────────────────┐
   │                    NEXT.JS FRONTEND (PORT 3000)             │
   │   • View Transitions & Framer Motion (Warm Neumorphic UI)   │
   │   • SSE / WebSocket Real-Time Intervention Listener         │
   │   • Family Profile Sidebar Router (React State Manager)     │
   └─────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼ (mTLS / Internal REST + WS)
   ┌─────────────────────────────────────────────────────────────┐
   │                    FASTAPI EVENT ROUTER (PORT 8000)          │
   │   • Event Bus & SSE Broadcaster                             │
   │   • Google ADK Orchestrator & Tool Routing Dispatcher       │
   │   • Secret Manager / IAM Authenticator                     │
   └───────────────┬───────────────────────────────┬─────────────┘
                   │                               │
                   ▼ (Vector RAG / Cypher API)     ▼ (ADK Orchestrator / SSE)
   ┌────────────────────────────────┐    ┌─────────────────────────────────┐
   │        PERSISTENCE LAYER       │    │      AUTONOMOUS AGENT MESH      │
   │ • Neo4j / Firebase Memory Graph│    │ • LogisticsAgent (Pantry/Sched) │
   │ • Unified Entity Index         │    │ • VitalityAgent (Health/Wear)   │
   │ • Relationship Dependencies    │    │ • GuardianAgent (Detox/Safe)    │
   │                                │    │ • ScholarAgent (Lore/Quests)    │
   └───────────────┬────────────────┘    └────────────────┬────────────────┘
                   │                                      │
                   │                                      ▼ (Function Calling)
                   │                             ┌─────────────────────────┐
                   │                             │       EXTERNAL APIs     │
                   └──────────────(IAM)─────────►│ • Calendar, Weather, IoT│
                                                 │ • Gemini 2.5 Pro (Model)│
                                                 └─────────────────────────┘
```

---

## 2. Decision & Trade-off Matrices

### 2.1 Backend Environment Selection

| Criterion | Option A: Node.js (Express / NestJS) | Option B: Python (FastAPI) (RECOMMENDED) |
| :--- | :--- | :--- |
| **Google ADK Integration** | Heavy SDK translation layers; requires custom bindings. | **Native Support:** Google ADK is built in Python, enabling direct imports and type-safety. |
| **Agent / ML Libraries** | Node agent libraries are mostly wrappers around APIs. | Access to numpy, pandas, and data tools for the wearable tracking components. |
| **Concurrency / Latency** | Event-loop based; good for WebSockets, lower cold starts. | Asynchronous `asyncio` loop matches Node's performance with native uvicorn. |
| **Best For** | Heavy JavaScript-only developer teams. | **AI/ML multi-agent systems and ADK orchestration.** |

**Recommendation:** Implement the backend using **Python / FastAPI**. The absolute requirement to implement the four Google ADK agents and orchestrate them securely makes Python the primary architecture choice.

### 2.2 Memory Graph Database Selection

| Criterion | Option A: Neo4j (Graph Database) | Option B: Firebase Firestore (Memory Graph Model) (RECOMMENDED) |
| :--- | :--- | :--- |
| **Auth & Sync Speed** | Requires separate auth setup and polling / client synchronization. | **Real-Time Synchronisation:** Firebase provides native real-time subscriptions (listeners) out-of-the-box. |
| **Graph Modeling** | Native Cypher queries; best for deep multi-degree queries. | Can model a graph structure using reference lists (nodes and edges collections). |
| **Deployment Time** | Complex hosting / managed pricing in production. | **Instant Deployment:** Zero-infrastructure provisioning via Firebase MCP. |
| **Best For** | Highly complex networks with >3 degrees of search. | **Rapid hackathon prototyping and real-time frontend syncing.** |

**Recommendation:** Implement the unified memory graph using **Firebase Firestore** (modeling nodes and edges in separate collections) to leverage native real-time listeners for instant frontend state updates.

---

## 3. Autonomous Agent Topology & Contracts

The four background agents communicate through structured payloads to maintain memory consistency.

```
                      ┌───────────────┐
                      │  FastAPI Bus  │
                      └───────┬───────┘
                              │ (Event Dispatched)
                              ▼
           ┌─────────────────────────────────────┐
           │     Google ADK Agent Coordinator    │
           └──────────────────┬──────────────────┘
                              │
         ┌────────────┬───────┴──────┬────────────┐
         ▼            ▼              ▼            ▼
   [Logistics]   [Vitality]     [Guardian]    [Scholar]
```

### 3.1 Inter-Agent Communication Schemas (Pydantic Contract)

Every agent must accept and emit payloads conforming to the `AgentHandoffPayload` model to prevent unstructured data corruption.

```python
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

class AgentHandoffPayload(BaseModel):
    task_id: str = Field(..., description="Unique UUID for tracing execution chain")
    source_agent: Literal["LogisticsAgent", "VitalityAgent", "GuardianAgent", "ScholarAgent"]
    target_agent: Optional[Literal["LogisticsAgent", "VitalityAgent", "GuardianAgent", "ScholarAgent"]] = None
    status: Literal["completed", "pending_input", "escalated", "failed"]
    unified_memory_update: Dict = Field(default_factory=dict, description="Key-value pairs to write to Firestore unified graph")
    action_items: List[str] = Field(default_factory=list, description="Actions required by other agents or users")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
```

---

## 4. Security & Governance Policy (IAM & Secret Management)

To satisfy the non-negotiable security requirements:
1.  **Secret Store Configuration:** No API keys are written to source files. The FastAPI app uses `google-cloud-secret-manager` (or env injection from safe environment templates) to retrieve the `GEMINI_API_KEY` and Firebase service account credentials at startup.
2.  **Least-Privilege Services:**
    *   The Backend container runs under a custom Service Account `omnihearth-backend-sa`.
    *   This service account is granted only:
        *   `roles/secretmanager.secretAccessor` (access to keys)
        *   `roles/datastore.user` (Firebase/Firestore CRUD)
3.  **Authentication and CORS:** Next.js and FastAPI enforce strict Origin headers with dynamic authentication checking.
