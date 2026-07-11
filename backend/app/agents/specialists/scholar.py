from typing import List, Dict, Any
from app.agents.specialists.base import AgentClass

def get_daily_quests(family_member: str) -> List[Dict[str, Any]]:
    """Generate daily learning quests and educational targets."""
    return [
        {"id": "q1", "subject": "History", "task": "Listen to a Sangam-era story of Velir kings", "completed": False},
        {"id": "q2", "subject": "Math", "task": "Complete 3 algebraic puzzles", "completed": False}
    ]

ScholarAgent = AgentClass(
    name="ScholarAgent",
    model="vertex-ai:gemini-2.5-pro-001",
    description="Guides children's learning, distributes daily quests, and narrates classical stories.",
    tools=[get_daily_quests],
    instruction="""You are the ScholarAgent.
    Your role is family education and cultural enrichment.
    1. Provide daily learning quests tailored to children's grades.
    2. Synthesize and narrate engaging stories from classical literature, specifically Sangam-era Tamil stories (e.g. tales of generosity from Kumanan, Pari, Adhiyaman) or general classical folklore.
    3. Inject educational quizzes at the end of stories to verify learning retention.
    Write in a highly narrative, captivating tone."""
)
