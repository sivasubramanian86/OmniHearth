import os
import asyncio
import json
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.app.db.firebase import init_db, get_graph
from backend.app.agents.coordinator import AgentCoordinator

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("omnihearth.api")

app = FastAPI(
    title="OmniHearth API",
    description="Central Event Router and Multi-Agent Orchestrator for Household OS.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://genai-apac-2026.web.app",
        "https://genai-apac-2026.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active SSE subscriber queues
sse_queues: List[asyncio.Queue] = []

# Instantiate coordinator
coordinator = AgentCoordinator()

@app.on_event("startup")
async def startup_event():
    # Hydrate configuration and initialize Database
    logger.info("Starting OmniHearth API server...")
    init_db()

class EventTriggerRequest(BaseModel):
    event_type: str
    payload: Dict[str, Any]

async def broadcast_event(data: dict):
    """Sends events to all active SSE subscribers."""
    message = json.dumps(data)
    logger.info(f"Broadcasting event to {len(sse_queues)} active SSE client(s).")
    for queue in sse_queues:
        await queue.put(message)

async def run_agent_workflow(event_type: str, payload: dict):
    """Background workflow running agent logic and broadcasting updates."""
    # 1. Broadcast that agent is executing
    await broadcast_event({
        "type": "agent_state",
        "agent": "Coordinator",
        "state": "active",
        "message": f"Orchestrating agent for event '{event_type}'..."
    })

    # 2. Run coordinator routing
    result = await coordinator.route_and_execute(event_type, payload)

    # 3. Broadcast execution results and memory update
    await broadcast_event({
        "type": "agent_state",
        "agent": result["agent"],
        "state": "done" if result["status"] == "completed" else "error",
        "message": result["message"]
    })

    # 4. Broadcast the new graph updates
    graph_data = get_graph()
    await broadcast_event({
        "type": "graph_update",
        "graph": graph_data,
        "timestamp": result["timestamp"]
    })

@app.post("/v1/events/trigger")
async def trigger_event(request: EventTriggerRequest, background_tasks: BackgroundTasks):
    """Receives external events (IoT/User UI clicks) and dispatches them to background agents."""
    try:
        # Run agent lifecycle asynchronously in background to prevent request hanging
        background_tasks.add_task(run_agent_workflow, request.event_type, request.payload)
        return {"status": "accepted", "message": "Event queued for agent routing."}
    except Exception as e:
        logger.error(f"Error triggering event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/graph")
async def get_memory_graph():
    """Retrieve the unified memory graph data (nodes and edges)."""
    try:
        return get_graph()
    except Exception as e:
        logger.error(f"Error fetching memory graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/events")
async def sse_events(request: Request):
    """Server-Sent Events endpoint for real-time frontend notifications."""
    async def event_generator():
        queue = asyncio.Queue()
        sse_queues.append(queue)
        logger.info(f"New SSE client connected. Active connections: {len(sse_queues)}")
        
        # Send initial graph on connection
        try:
            initial_graph = get_graph()
            yield f"data: {json.dumps({'type': 'connection_established', 'graph': initial_graph})}\n\n"
        except Exception as e:
            logger.error(f"Error sending initial connection event: {e}")

        try:
            while True:
                # Check for client disconnect
                if await request.is_disconnected():
                    logger.info("SSE client disconnected.")
                    break
                
                # Fetch message from queue (timeout allows checking disconnect status)
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=2.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat to keep connection alive
                    yield "data: {\"type\": \"heartbeat\"}\n\n"
        finally:
            sse_queues.remove(queue)
            logger.info(f"SSE connection cleaned up. Active connections: {len(sse_queues)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/health")
def health_check():
    return {"status": "healthy", "database_mock": os.getenv("USE_FIREBASE_EMULATOR") == "true"}
