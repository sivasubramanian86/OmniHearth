import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("omnihearth.db")

# Initialize Firestore Client
db = None
is_mock = False

class MemoryGraphMock:
    """Fallback in-memory graph database when Firebase is unavailable."""
    def __init__(self):
        self.nodes = {}
        self.edges = {}
        logger.warning("Initializing Local In-Memory Graph Mock database.")

    def collection(self, name: str):
        class MockCollection:
            def __init__(self, name, parent):
                self.name = name
                self.parent = parent

            def document(self, doc_id: str):
                class MockDocument:
                    def __init__(self, doc_id, collection):
                        self.doc_id = doc_id
                        self.collection = collection

                    def set(self, data: dict):
                        if self.collection.name == "nodes":
                            self.collection.parent.nodes[self.doc_id] = data
                        elif self.collection.name == "edges":
                            self.collection.parent.edges[self.doc_id] = data
                        return True

                    def get(self):
                        class MockSnap:
                            def __init__(self, exists, data):
                                self.exists = exists
                                self._data = data
                            def to_dict(self):
                                return self._data
                        
                        if self.collection.name == "nodes":
                            exists = self.doc_id in self.collection.parent.nodes
                            data = self.collection.parent.nodes.get(self.doc_id, {})
                        else:
                            exists = self.doc_id in self.collection.parent.edges
                            data = self.collection.parent.edges.get(self.doc_id, {})
                        return MockSnap(exists, data)

                    def delete(self):
                        if self.collection.name == "nodes":
                            self.collection.parent.nodes.pop(self.doc_id, None)
                        elif self.collection.name == "edges":
                            self.collection.parent.edges.pop(self.doc_id, None)
                        return True

                return MockDocument(doc_id, self)

            def stream(self):
                class MockDocRef:
                    def __init__(self, doc_id, data):
                        self.id = doc_id
                        self._data = data
                    def to_dict(self):
                        return self._data
                
                source = self.parent.nodes if self.name == "nodes" else self.parent.edges
                return [MockDocRef(k, v) for k, v in source.items()]

        return MockCollection(name, self)

def init_db():
    global db, is_mock
    
    use_emulator = os.getenv("USE_FIREBASE_EMULATOR", "false").lower() == "true"
    project_id = os.getenv("FIREBASE_PROJECT_ID", "omnihearth-dev")

    if use_emulator:
        os.environ["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:8080"
        os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
        logger.info("Configured Firestore client to use Local Emulator at 127.0.0.1:8080")

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Check if already initialized
        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred, {"projectId": project_id})
                logger.info(f"Initialized Firebase Admin SDK from Certificate: {cred_path}")
            else:
                # Initialize using default credentials or emulator configuration
                firebase_admin.initialize_app(options={"projectId": project_id})
                logger.info(f"Initialized Firebase Admin SDK using Application Default Credentials (ADC) or Emulator config.")
        
        db = firestore.client()
        is_mock = False
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}. Falling back to Memory Graph Mock.")
        db = MemoryGraphMock()
        is_mock = True

# Helper database operations
def upsert_node(node_id: str, label: str, properties: dict) -> bool:
    try:
        doc_ref = db.collection("nodes").document(node_id)
        doc_ref.set({
            "id": node_id,
            "label": label,
            "properties": properties,
            "updated_at": firestore_timestamp() if not is_mock else "timestamp"
        })
        return True
    except Exception as e:
        logger.error(f"Error upserting node {node_id}: {e}")
        return False

def upsert_edge(edge_id: str, from_node: str, to_node: str, type_label: str, properties: dict = None) -> bool:
    try:
        doc_ref = db.collection("edges").document(edge_id)
        doc_ref.set({
            "id": edge_id,
            "from_node": from_node,
            "to_node": to_node,
            "type": type_label,
            "properties": properties or {},
            "updated_at": firestore_timestamp() if not is_mock else "timestamp"
        })
        return True
    except Exception as e:
        logger.error(f"Error upserting edge {edge_id}: {e}")
        return False

def get_graph() -> Dict[str, List[Any]]:
    try:
        nodes = [doc.to_dict() for doc in db.collection("nodes").stream()]
        edges = [doc.to_dict() for doc in db.collection("edges").stream()]
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        logger.error(f"Error fetching memory graph: {e}")
        return {"nodes": [], "edges": []}

def firestore_timestamp():
    try:
        from google.cloud import firestore
        return firestore.SERVER_TIMESTAMP
    except ImportError:
        import datetime
        return datetime.datetime.utcnow().isoformat()
