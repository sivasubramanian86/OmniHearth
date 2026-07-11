from typing import List, Dict, Any
from app.agents.specialists.base import AgentClass

def get_calendar_events(family_member: str) -> List[Dict[str, Any]]:
    """Fetch calendar schedule events for a family member."""
    return [
        {"id": "ev1", "title": "Piano Class", "time": "16:00 - 17:00", "member": "Ananya"},
        {"id": "ev2", "title": "Dentist Appointment", "time": "16:30 - 17:30", "member": "Mother"}
    ]

def get_pantry_items() -> List[Dict[str, Any]]:
    """Fetch active inventory levels of pantry stock."""
    return [
        {"item": "Milk", "quantity": 1, "unit": "Liter", "status": "Low"},
        {"item": "Apples", "quantity": 10, "unit": "pcs", "status": "Good"},
        {"item": "Rice", "quantity": 2, "unit": "kg", "status": "Medium"}
    ]

LogisticsAgent = AgentClass(
    name="LogisticsAgent",
    model="vertex-ai:gemini-2.0-flash-001",
    description="Manages family schedules, calendar conflict resolution, and pantry stock levels.",
    tools=[get_calendar_events, get_pantry_items],
    instruction="""You are the LogisticsAgent. 
    Your role is to orchestrate household operations.
    1. Detect overlaps or conflicts in family schedules (e.g. if piano class conflicts with a pickup appointment).
    2. Suggest schedule rearrangements to avoid conflict.
    3. Monitor pantry items and suggest grocery additions if items are below threshold.
    Always format outputs to return schedule corrections clearly."""
)
