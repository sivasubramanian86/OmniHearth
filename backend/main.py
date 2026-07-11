# backend/main.py
# Firebase Cloud Functions (Gen 2) entry point for FastAPI backend.

from firebase_functions import https_fn
from app.main import app as fastapi_app

# Export the FastAPI app as a Firebase Cloud Function named 'api'
api = https_fn.on_request(fastapi_app)
