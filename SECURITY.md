# Security Policy & Governance

## 1. Security Overview

**OmniHearth** is committed to providing a secure, privacy-preserving Household Operating System. As an AI-powered system orchestrating family calendars, health telemetry, digital detox parameters, and educational workflows, security and data privacy are foundational architectural requirements.

---

## 2. Reporting Vulnerabilities

If you discover a potential security vulnerability within OmniHearth, please report it immediately.

### Reporting Channels
* **Private Vulnerability Disclosure:** Please send security reports via email to `security@omnihearth.io` (or submit a private disclosure on GitHub).
* **Response SLA:** We acknowledge security reports within 24 hours and aim to provide a fix or mitigation plan within 5 business days.

> [!IMPORTANT]
> **Do NOT create public GitHub issues** for security vulnerabilities or unpatched exploit vectors.

---

## 3. Secret Management & Scanner Policy

OmniHearth enforces a zero-tolerance policy for hardcoded credentials, service account keys, and API tokens.

### GitLeaks Automated Secret Auditing
* All commits and Pull Requests are scanned using **GitLeaks**.
* Custom rules defined in `.gitleaks.toml` detect leaked GCP credentials, Firebase keys, JWT tokens, and OAuth secrets.
* Pre-commit hooks should be configured locally:
  ```bash
  gitleaks detect --source . --verbose
  ```

---

## 4. Cloud Infrastructure & Least Privilege IAM

* **GCP Cloud Run Execution:** Backend containers run with restricted service accounts holding minimal IAM permissions (`roles/logging.logWriter`, `roles/datastore.user`).
* **Firestore Security Rules:** Access control matrix enforces strict user boundary checks (`request.auth.uid == resource.data.ownerId`).
* **Environment Variables:** API keys and sensitive runtime settings must be injected via Secret Manager or environment variables (`.env`).

---

## 5. Security Checklist for Contributors

Before submitting any Pull Request:
- [ ] Run `gitleaks detect --source .` to ensure no secrets are staged.
- [ ] Confirm no `.env` or production credentials are committed.
- [ ] Verify that all user inputs to agents pass sanitization and bounds checking.
- [ ] Ensure pytest suite passes with zero security regressions.
