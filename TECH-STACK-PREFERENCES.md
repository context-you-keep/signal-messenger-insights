# Tech Stack Preferences

This document should be followed for this project and only deviated from with strong justification.

---

**Project:** signal-archive-viewer

## Runtime Model

- Single Docker container
- Local-only web UI on http://localhost:<port>
- User mounts Signal Desktop directory as a volume OR uploads files via UI

## Backend

- **Language:** Python 3.12
- **Framework:** FastAPI
- **Server:** uvicorn
- **Responsibilities:**
  - Accept filesystem paths from mounted volume (e.g. /signal/)
  - OR accept uploaded config.json + db.sqlite
  - Parse config.json and extract/decode encryption key
  - Decrypt encrypted db.sqlite into:
    - In-memory SQLite (preferred) or
    - Temp on-disk SQLite file in /tmp with secure deletion
  - Provide REST/JSON APIs:
    - GET /conversations
    - GET /conversations/{id}/messages (pagination)
    - GET /attachments/{id}
    - POST /search
    - (future) POST /llm/insights

## Storage

- **Read-only Source:**
  - Mounted volume: /signal → host: Signal profile dir
- **Working Copy:**
  - SQLite decrypted DB (in-memory or temp file)
- **App Metadata:**
  - SQLite file in /data (tags, exports, settings)

## Frontend

- **Framework:** React 18
- **Bundler:** Vite
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State Management:**
  - React Query (server state)
  - Local React state for UI controls
- **Build Output:**
  - Static assets built to /app/frontend/dist
  - Served by FastAPI via StaticFiles at / (root)

## LLM Integration (Future)

- **Options:**
  - Local: Ollama or similar on host (backend calls http://host.docker.internal:11434)
  - Remote: OpenAI / Anthropic / other HTTP APIs
- **Adapter Layer:**
  - Python service module llm_client.py
  - Config via environment variables (API keys, base URLs)

## Docker

- **Base Image:** python:3.12-slim
- **Pattern:** multi-stage build
- **Stages:**
  - **frontend-build:**
    - Image: node:22-alpine
    - Tools: pnpm
    - Output: frontend/dist
  - **backend-runtime:**
    - Image: python:3.12-slim
    - Copies:
      - FastAPI app
      - Built frontend/dist → /app/static
- **Ports:**
  - Container: 8000
  - Host: 127.0.0.1:8000
- **Volumes Example:**
  - Host: ~/.config/Signal
  - Container: /signal

## Tooling

- **Package Manager (Frontend):** pnpm
- **Package Manager (Backend):** uv (or pip + uvlock)
- **Linting & Formatting:**
  - Python: ruff + black
  - TypeScript: ESLint + Prettier
- **Testing:**
  - Backend: pytest
  - Frontend: Vitest + Testing Library
  - E2E (optional later): Playwright against http://localhost:8000

## Entrypoint

- Start uvicorn app: app.main:app on 0.0.0.0:8000
