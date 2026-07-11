# OmniHearth: Autonomous Household Operating System

OmniHearth is an autonomous Household Operating System designed to orchestrate schedules, track family wellness, enforce digital detox policies, and enrich family education through modular, specialized AI agents operating over a unified memory graph.

The frontend implements a high-fidelity **Warm Neumorphic** user experience modeled directly from designs ingested from Google Stitch. The backend dispatches system events to four background agents using the **Google Agent Development Kit (ADK)**.

---

## 1. Project Directory Structure

```
OmniHearth/
│
├── ARCHITECTURE.md              # Technical system architecture and database design
├── DESIGN.md                    # Styling tokens, typography, and elevation rules
├── README.md                    # Overall project manual and setup guidelines
├── download_design_screens.py   # Utility script to fetch Google Stitch screenshots
│
├── design_screens/              # Downloaded high-fidelity Stitch screenshots
│   ├── dashboard.png            # Main Parent / Admin overview
│   ├── child_mode.png           # Ananya's Child Mode view
│   ├── logistics.png            # Timeline schedule view
│   ├── health_inventory.png     # Circle progress and pantry stocks
│   ├── legacy_vault.png         # Memories photo journal
│   ├── faq_support.png          # System FAQ guidelines
│   ├── about_mission.png        # Product conceptual overview
│   ├── settings_hub.png         # Hardware config settings panel
│
├── scripts/                     # Local Utilities & Deployments
│   ├── download_design_screens.py # Downloads Stitch screen screenshots to design_screens/
│   ├── run_local.ps1            # Starts both FastAPI and Next.js dev servers
│   ├── run_local.bat            # Batch file wrapper to launch run_local.ps1
│   └── deploy.ps1               # Automates Cloud Run backend packaging and deployment
│
├── backend/                     # Python/FastAPI Event Router
│   ├── requirements.txt         # Core backend python package requirements
│   ├── tests/                   # Verification test suite
│   │   └── test_agents.py
│   └── app/
│       ├── main.py              # Main FastAPI app exposing REST & SSE streaming
│       ├── db/
│       │   └── firebase.py      # Firestore memory graph driver & local mock database
│       └── agents/              # Multi-agent coordination layer
│           ├── coordinator.py   # Event router and memory persistence dispatcher
│           └── specialists/     # Modular specialist agent packages
│               ├── __init__.py  # Exposes the specialists package symbols
│               ├── base.py      # Fallback mock agent definition
│               ├── logistics.py # LogisticsAgent (Calendar & Pantry)
│               ├── vitality.py  # VitalityAgent (Wearables & Health)
│               ├── guardian.py  # GuardianAgent (Detox & Security)
│               └── scholar.py   # ScholarAgent (Education & Storytelling)
│
└── frontend/                    # Next.js 15 Web Application
    ├── package.json             # Frontend package requirements (framer-motion, lucide-react)
    ├── tsconfig.json            # TypeScript configuration
    └── src/
        └── app/
            ├── layout.tsx       # Root layout preloading Quicksand/Nunito Sans Fonts
            ├── globals.css      # OKLCH design variables and neumorphic elevations CSS
            └── page.tsx         # Dashboard UI, SSE client stream reader, and Profile router
```

---

## 2. Technical Scaffolding

### 2.1 Backend Component
*   **FastAPI main server:** Handled in `backend/app/main.py` routing triggers, fetching memory graphs, and streaming Server-Sent Events (SSE).
*   **Modular Specialists:** Located in `backend/app/agents/specialists/` containing isolated classes and tools for each autonomous background agent.
*   **Memory Graph Database:** Structured in `backend/app/db/firebase.py` representing relations (nodes and edges collections) inside Firestore with an automatic local in-memory fallback.

### 2.2 Frontend Component
*   **Design system tokens:** Custom OKLCH color variables and neumorphic elevations declared in `frontend/src/app/globals.css`.
*   **Interactive layouts:** Fully state-managed component in `frontend/src/app/page.tsx` integrating live SSE graphs, profile switching navigation, and simulation sandbox buttons.

---

## 3. Local Installation & Configuration

### Prerequisites
*   Node.js (version 18+)
*   Python 3.12+

### Step 1: Configure Environment Variables
Copy `.env.example` in the root directory to `.env`:
```bash
cp .env.example .env
```
Customize the settings (e.g. `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`). By default, the app is configured to use the local memory graph fallback for sandbox runs (`USE_FIREBASE_EMULATOR=true`). Ensure your system is authenticated to Google Cloud via:
```bash
gcloud auth application-default login
```

### Step 2: Configure the Backend Environment
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   *   **Windows (PowerShell):** `.\.venv\Scripts\Activate.ps1`
   *   **Linux/macOS:** `source .venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Step 3: Configure the Frontend Environment
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

---

## 4. Running the Applications Locally

You can launch both the frontend and backend servers concurrently using the provided local execution scripts:

### Option A: PowerShell Launcher (Recommended)
Run the PowerShell launcher script from the workspace root:
```powershell
.\scripts\run_local.ps1
```
*(This script verifies virtual environments, starts FastAPI on port 8000, starts Next.js on port 3000, and opens your default browser automatically).*

### Option B: Batch Launcher
Double-click or run the batch wrapper from the terminal:
```cmd
.\scripts\run_local.bat
```

### Option C: Manual Launch (Separate Terminals)
If you prefer running them individually in separate terminals:

1.  **Terminal 1 (Backend FastAPI):**
    ```bash
    cd backend
    .\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --port 8000
    ```
2.  **Terminal 2 (Frontend Next.js):**
    ```bash
    cd frontend
    npm run dev
    ```


---

## 5. Verification & Testing

### 5.1 Run Automated Tests
Verify python module imports, endpoints, and mock database operations:
```bash
backend\.venv\Scripts\python -m pytest backend/tests/
```

### 5.2 Interactive Sandbox Runs
1.  Open your browser to `http://localhost:3000`.
2.  Switch profiles (Parent Mode, Child Mode, Grandpa Mode) to verify responsive grids.
3.  Scroll to the bottom-right and click **Trigger Schedule Conflict**.
4.  Observe the logs panel printing the *LogisticsAgent* routing flow, and the layout rendering the rescheduled event card instantly.
