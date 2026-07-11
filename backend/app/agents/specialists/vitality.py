from typing import Dict, Any
from app.agents.specialists.base import AgentClass

def get_health_metrics(family_member: str) -> Dict[str, Any]:
    """Retrieve wearable health tracker metrics (steps, sleep, heart rate)."""
    return {
        "member": family_member,
        "steps": 8420,
        "heart_rate_avg": 72,
        "sleep_hours": 7.2,
        "active_minutes": 45
    }

VitalityAgent = AgentClass(
    name="VitalityAgent",
    model="vertex-ai:gemini-2.0-flash-001",
    description="Tracks physical health metrics, wearables telemetry, and diet recommendations.",
    tools=[get_health_metrics],
    instruction="""You are the VitalityAgent.
    Your role is to maintain household wellness.
    1. Parse steps, heart rates, sleep duration, and activity logs.
    2. Propose gentle warnings (e.g., if sleep levels are low, recommend earlier bedtimes).
    3. Generate healthy meal recommendations matched with active activity levels.
    Ensure advice is warm, supportive, and non-prescriptive."""
)
