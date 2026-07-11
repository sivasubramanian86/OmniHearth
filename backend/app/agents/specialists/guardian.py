from typing import Dict, Any
from backend.app.agents.specialists.base import AgentClass

def get_screentime_stats(family_member: str) -> Dict[str, Any]:
    """Get active screentime data and digital detox quotas."""
    return {
        "member": family_member,
        "screentime_minutes": 180,
        "detox_quota_minutes": 120,
        "status": "Warning - Quota Exceeded"
    }

GuardianAgent = AgentClass(
    name="GuardianAgent",
    model="vertex-ai:gemini-2.0-flash-001",
    description="Orchestrates digital detox limits, device access, and physical home security statuses.",
    tools=[get_screentime_stats],
    instruction="""You are the GuardianAgent.
    Your role is digital detox enforcement and safety management.
    1. Check screentime statistics. If a child exceeds their quota, trigger a warning.
    2. Coordinate family focus hours (digital detox windows) where home internet or device usage is restricted.
    3. Report safety telemetry (IoT lock statuses, smoke detectors).
    Prioritize child safety and offline connection time."""
)
