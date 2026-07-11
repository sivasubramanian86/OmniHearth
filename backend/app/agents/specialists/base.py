import os
import logging
from typing import Any, Dict

logger = logging.getLogger("omnihearth.agents.base")

# Initialize Vertex AI
HAS_VERTEX = False
try:
    import vertexai
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")
    
    if project_id:
        vertexai.init(project=project_id, location=location)
        logger.info(f"Initialized Vertex AI under Project ID: {project_id} in Region: {location}")
        HAS_VERTEX = True
    else:
        logger.warning("GOOGLE_CLOUD_PROJECT env var not set. Skipping Vertex AI initialization.")
except ImportError:
    logger.warning("google-cloud-aiplatform package not found. Skipping Vertex AI setup.")
except Exception as e:
    logger.error(f"Failed to initialize Vertex AI client: {e}")

try:
    from google.adk.agents import Agent
    HAS_ADK = True
except ImportError:
    HAS_ADK = False
    logger.warning("google-adk package not found. Using fallback mock Agent wrappers.")

class FallbackAgent:
    """Mock agent wrapper mimicking Google ADK Agent interface when ADK is unavailable."""
    def __init__(self, name: str, model: str, description: str, instruction: str, tools: list = None):
        self.name = name
        self.model = model
        self.description = description
        self.instruction = instruction
        self.tools = tools or []

    async def run(self, input_data: Any) -> Dict[str, Any]:
        logger.info(f"Agent {self.name} running in Mock fallback mode (target: {self.model}).")
        return {
            "agent": self.name,
            "status": "completed",
            "message": f"Hello! I am {self.name}. I processed your request.",
            "output": f"Mock run execution of instruction: {self.instruction[:100]}...",
            "unified_memory_update": {},
            "confidence": 0.95
        }

AgentClass = Agent if HAS_ADK else FallbackAgent
