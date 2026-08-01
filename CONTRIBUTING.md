# Contributing to OmniHearth

Thank you for your interest in contributing to **OmniHearth**, the autonomous Household Operating System powered by Google ADK, FastAPI, and Next.js!

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please treat fellow community members with respect.

---

## 2. Getting Started

### Prerequisites
* **Node.js**: v18 or higher
* **Python**: v3.12 or higher
* **Git**: Installed and configured
* **Google Cloud SDK**: `gcloud` CLI authenticated (`gcloud auth application-default login`)

### Setup Local Environment
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/OmniHearth.git
   cd OmniHearth
   ```
2. Set up environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Set up the backend:
   ```bash
   cd backend
   python -m venv .venv
   # Windows: .\.venv\Scripts\Activate.ps1
   # Linux/Mac: source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Set up the frontend:
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   ```

---

## 3. Development Workflow

1. Create a feature branch off `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. Make modular, well-tested code changes.
3. Run local backend tests:
   ```bash
   backend\.venv\Scripts\python -m pytest backend/tests/
   ```
4. Run frontend build verification:
   ```bash
   cd frontend && npm run build
   ```
5. Scan for secrets before committing:
   ```bash
   gitleaks detect --source . --verbose
   ```

---

## 4. Submission Guidelines

* **Commit Messages:** Follow standard Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
* **Pull Requests:** Open a PR targeting `main`. Ensure all CI checks pass and fill out the Pull Request template.
* **Code Review:** At least one maintainer review is required prior to merging.

Thank you for helping build the future of household AI intelligence!
