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

class ADKWrapper:
    """Wrapper that leverages Google ADK Agent when available, falling back to mock outputs in test/offline modes."""
    def __init__(self, name: str, model: str, description: str, instruction: str, tools: list = None):
        self.name = name
        self.model = model
        self.description = description
        self.instruction = instruction
        self.tools = tools or []
        self.real_agent = None
        
        if HAS_ADK:
            try:
                self.real_agent = Agent(
                    name=name,
                    model=model,
                    description=description,
                    instruction=instruction,
                    tools=self.tools
                )
            except Exception as e:
                logger.error(f"Failed to initialize ADK Agent {name}: {e}")

    async def run(self, input_data: Any) -> Dict[str, Any]:
        if os.getenv("USE_FIREBASE_EMULATOR") == "true" or os.getenv("MOCK_AGENTS") == "true" or not self.real_agent:
            logger.info(f"Agent {self.name} running in Mock fallback mode.")
            return {
                "agent": self.name,
                "status": "completed",
                "message": f"Hello! I am {self.name}. I processed your request.",
                "output": f"Mock run execution of instruction: {self.instruction[:100]}...",
                "unified_memory_update": {},
                "confidence": 0.95
            }
        
        try:
            from google.adk.context import InvocationContext
            context = InvocationContext()
            context.state.input = input_data
            
            output_text = ""
            async for event in self.real_agent.run_async(context):
                if hasattr(event, "content") and event.content:
                    output_text += str(event.content)
                    
            return {
                "agent": self.name,
                "status": "completed",
                "message": output_text or f"{self.name} finished executing.",
                "unified_memory_update": {},
                "confidence": 0.95
            }
        except Exception as e:
            logger.error(f"Error executing ADK Agent {self.name}: {e}")
            raise e

AgentClass = ADKWrapper
