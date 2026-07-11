🧠 MEMORY HYDRATION REPORT — OmniHearth
Session Start: 2026-07-11T15:44:12+05:30

📐 ARCHITECTURE
  • Multi-agent background orchestration using Google ADK and Interactions API.
  • Backend: Python/FastAPI acting as the central event router and WebSockets/SSE publisher.
  • Frontend: Next.js 15 (App Router), Tailwind CSS, Framer Motion, with Warm Neumorphic design system, masonry grid, and sidebar routing states.
  • Database: Memory graph of family events, dependencies, and relationships (Firebase/SQLite Graph).

☁️ CLOUD / INFRA
  • Provider: GCP (Cloud Run, Secret Manager, Cloud Logging)
  • Compute: Cloud Run serverless container (Backend), Vercel/Cloud Run (Frontend)

🔑 API INTEGRATIONS (names only)
  • GEMINI_API_KEY (Google AI Studio / Vertex AI)
  • External Calendar/IoT API connections via MCP

🧱 TECH STACK
  • Next.js 15 (App Router, Tailwind CSS, Framer Motion)
  • Python 3.12, FastAPI, google-adk
  • Firebase SDK / Firestore (for rapid auth/DB deployment and live sync)

⚠️ OPEN DECISIONS / UNRESOLVED
  • Choice of graph structure (Firebase collection references vs. custom SQLite graph)
  • Live audio/vision streaming details (Live API integration scope)

📌 ACTIVE CONSTRAINTS
  • Stitch-fidelity Warm Neumorphic styling tokens (Quicksand, Nunito Sans, terracotta/sage palette)
  • No hardcoded keys/secrets; strict IAM least-privilege
