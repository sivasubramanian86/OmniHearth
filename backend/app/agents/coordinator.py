import logging
from typing import Dict, Any, Optional
import uuid
import datetime

from backend.app.agents.specialists import (
    LogisticsAgent,
    VitalityAgent,
    GuardianAgent,
    ScholarAgent,
    HAS_ADK
)
from backend.app.db.firebase import upsert_node, upsert_edge

logger = logging.getLogger("omnihearth.coordinator")

class AgentCoordinator:
    """Orchestrates events and dispatches them to specialized agents."""
    
    def __init__(self):
        self.agents = {
            "logistics": LogisticsAgent,
            "vitality": VitalityAgent,
            "guardian": GuardianAgent,
            "scholar": ScholarAgent
        }

    async def route_and_execute(self, event_type: str, payload: dict) -> Dict[str, Any]:
        """Routes a system event or user query to the appropriate agent."""
        task_id = str(uuid.uuid4())
        logger.info(f"Coordinating event: {event_type} (task_id: {task_id})")

        # Map event types to agents
        agent_key = self._resolve_agent(event_type, payload)
        agent = self.agents.get(agent_key, LogisticsAgent)  # Default to logistics

        # Run the agent
        # For our mock fallback or ADK run, we await the agent run
        try:
            # Prepare task prompt based on event
            task_description = self._build_prompt(event_type, payload)
            
            # Execute agent call
            result = await agent.run(task_description)
            
            # Extract updates
            memory_update = result.get("unified_memory_update", {})
            if not memory_update:
                memory_update = self._generate_default_memory_update(agent.name, event_type, payload)

            # Persist to unified memory graph (Firebase)
            self._persist_memory_update(task_id, agent.name, memory_update)

            return {
                "task_id": task_id,
                "agent": agent.name,
                "status": "completed",
                "message": result.get("message") or f"{agent.name} processed successfully.",
                "memory_update": memory_update,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error executing agent {agent.name}: {e}")
            return {
                "task_id": task_id,
                "agent": agent.name,
                "status": "failed",
                "message": f"Error occurred: {str(e)}",
                "memory_update": {},
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

    def _resolve_agent(self, event_type: str, payload: dict) -> str:
        event_lower = event_type.lower()
        if "calendar" in event_lower or "schedule" in event_lower or "pantry" in event_lower or "grocery" in event_lower:
            return "logistics"
        elif "health" in event_lower or "wearable" in event_lower or "heart" in event_lower or "sleep" in event_lower:
            return "vitality"
        elif "detox" in event_lower or "screentime" in event_lower or "lock" in event_lower or "security" in event_lower:
            return "guardian"
        elif "story" in event_lower or "quest" in event_lower or "learn" in event_lower or "quiz" in event_lower:
            return "scholar"
        return "logistics"  # Default fallback

    def _build_prompt(self, event_type: str, payload: dict) -> str:
        return f"Process household event '{event_type}' with payload: {payload}. Resolve any conflicts or action items."

    def _generate_default_memory_update(self, agent_name: str, event_type: str, payload: dict) -> dict:
        """Create structured node/edge graph data based on processed event."""
        # Simple dynamic heuristics to simulate graph generation
        now = datetime.datetime.utcnow().isoformat()
        
        if agent_name == "LogisticsAgent":
            conflict_detected = "piano" in str(payload).lower() and "dentist" in str(payload).lower()
            return {
                "nodes": [
                    {
                        "id": "event_piano",
                        "label": "Event",
                        "properties": {"title": "Piano Class", "time": "16:00", "member": "Ananya", "status": "Rescheduled" if conflict_detected else "Confirmed"}
                    },
                    {
                        "id": "event_dentist",
                        "label": "Event",
                        "properties": {"title": "Dentist Appointment", "time": "16:30", "member": "Mother", "status": "Confirmed"}
                    }
                ],
                "edges": [
                    {
                        "id": "piano_conflict_dentist",
                        "from_node": "event_piano",
                        "to_node": "event_dentist",
                        "type": "CONFLICTS_WITH" if conflict_detected else "FOLLOWS",
                        "properties": {"severity": "High" if conflict_detected else "None", "resolution": "Rescheduled Piano to 18:00" if conflict_detected else ""}
                    }
                ]
            }
            
        elif agent_name == "VitalityAgent":
            return {
                "nodes": [
                    {
                        "id": f"health_{payload.get('member', 'Ananya').lower()}",
                        "label": "HealthLog",
                        "properties": {
                            "member": payload.get("member", "Ananya"),
                            "steps": payload.get("steps", 8420),
                            "sleep_hours": payload.get("sleep_hours", 6.2),
                            "date": now[:10]
                        }
                    }
                ],
                "edges": []
            }
            
        elif agent_name == "GuardianAgent":
            screentime = payload.get("screentime_minutes", 150)
            quota = payload.get("detox_quota_minutes", 120)
            limit_exceeded = screentime > quota
            return {
                "nodes": [
                    {
                        "id": f"device_{payload.get('member', 'Ananya').lower()}",
                        "label": "DeviceStatus",
                        "properties": {
                            "member": payload.get("member", "Ananya"),
                            "screentime_minutes": screentime,
                            "detox_active": limit_exceeded,
                            "warning_triggered": limit_exceeded
                        }
                    }
                ],
                "edges": []
            }
            
        elif agent_name == "ScholarAgent":
            return {
                "nodes": [
                    {
                        "id": "scholar_quest_active",
                        "label": "LearningQuest",
                        "properties": {
                            "quest_title": "Velir Generosity Quest",
                            "subject": "Classical Tamil Literature",
                            "assigned_to": payload.get("member", "Ananya"),
                            "status": "Assigned"
                        }
                    }
                ],
                "edges": [
                    {
                        "id": "quest_assigned_to_member",
                        "from_node": "scholar_quest_active",
                        "to_node": f"profile_{payload.get('member', 'Ananya').lower()}",
                        "type": "ASSIGNED_TO"
                    }
                ]
            }
            
        return {"nodes": [], "edges": []}

    def _persist_memory_update(self, task_id: str, agent_name: str, memory_update: dict):
        """Writes graph nodes and edges to the Firestore layer."""
        nodes = memory_update.get("nodes", [])
        edges = memory_update.get("edges", [])

        # Upsert Nodes
        for node in nodes:
            node_id = node.get("id")
            label = node.get("label")
            props = node.get("properties", {})
            upsert_node(node_id, label, props)

        # Upsert Edges
        for edge in edges:
            edge_id = edge.get("id")
            from_node = edge.get("from_node")
            to_node = edge.get("to_node")
            type_lbl = edge.get("type")
            props = edge.get("properties", {})
            upsert_edge(edge_id, from_node, to_node, type_lbl, props)

        # Create audit trace node
        upsert_node(
            node_id=f"audit_{task_id}",
            label="AuditTrace",
            properties={
                "task_id": task_id,
                "agent": agent_name,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "node_count": len(nodes),
                "edge_count": len(edges)
            }
        )
