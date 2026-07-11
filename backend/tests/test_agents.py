import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

import os
# Force mock database configuration for test suite
os.environ["USE_FIREBASE_EMULATOR"] = "true"

from app.main import app
from app.db.firebase import init_db, upsert_node, get_graph, db
from app.agents.coordinator import AgentCoordinator

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_database_mock_operations():
    # Insert node into mock database
    success = upsert_node("profile_test", "Person", {"name": "Test User", "role": "tester"})
    assert success is True
    
    # Verify retrieval
    graph = get_graph()
    assert len(graph["nodes"]) > 0
    test_node = next((n for n in graph["nodes"] if n["id"] == "profile_test"), None)
    assert test_node is not None
    assert test_node["label"] == "Person"
    assert test_node["properties"]["name"] == "Test User"

@pytest.mark.asyncio
async def test_coordinator_agent_resolution():
    coordinator = AgentCoordinator()
    
    # Test LogisticsAgent resolution
    res_logistics = await coordinator.route_and_execute(
        event_type="calendar_conflict_detected",
        payload={"piano": "16:00", "dentist": "16:30"}
    )
    assert res_logistics["status"] == "completed"
    assert res_logistics["agent"] == "LogisticsAgent"
    assert len(res_logistics["memory_update"]["nodes"]) > 0

    # Test ScholarAgent resolution
    res_scholar = await coordinator.route_and_execute(
        event_type="daily_learning_quest",
        payload={"member": "Ananya"}
    )
    assert res_scholar["status"] == "completed"
    assert res_scholar["agent"] == "ScholarAgent"

def test_trigger_event_api():
    response = client.post(
        "/v1/events/trigger",
        json={
            "event_type": "screentime_exceeded",
            "payload": {"member": "Ananya", "screentime_minutes": 150}
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "accepted"
