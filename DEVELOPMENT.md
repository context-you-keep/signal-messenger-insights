# Development Guide

This guide covers setting up the development environment and working on the Signal Archive Viewer.

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Python 3.12+ (for local backend development)
- Node.js 22+ and pnpm (for local frontend development)

## Project Structure

```
signal-archive-viewer/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # REST API routes
│   │   ├── crypto/         # Signal decryption logic
│   │   ├── db/             # Database queries
│   │   ├── models/         # Pydantic models
│   │   └── main.py         # FastAPI application
│   └── pyproject.toml      # Python dependencies
├── frontend/                # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile              # Multi-stage Docker build
└── docker-compose.yml      # Docker Compose configuration
```

## Quick Start

### ⚡ FASTEST: UI Development Mode (Instant Hot Reload)

For **instant visual feedback** while developing the UI:

```bash
# Terminal 1: Start backend only
cd backend
docker compose up

# Terminal 2: Start frontend dev server (with HMR)
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

**Why this is the fastest:**
- Vite Hot Module Replacement (HMR) - changes appear in **< 1 second**
- NO container rebuild needed
- NO page refresh needed for most React changes
- Perfect for iterative UI/UX work

### Option 1: Docker (Full Stack)

Build and run the entire application:

```bash
docker-compose up --build
```

Access the app at http://localhost:8000

### Option 2: Local Development

Install dependencies:

```bash
# Backend
cd backend
pip install -e ".[dev]"

# Frontend
cd frontend
npm install  # or pnpm install
```

Run backend:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run frontend (in a separate terminal):

```bash
cd frontend
npm run dev
```

Frontend will be available at http://localhost:5173 and will proxy API requests to the backend.

## UI Development Guide

### Communicating Design Changes

When describing what you want visually, be specific:

**Good examples:**
- "Make the conversation cards more prominent with shadows"
- "Increase spacing between messages"
- "Make the upload area look like a dropzone with dashed border"
- "Use blue accent for the selected conversation"
- "Show loading skeleton while conversations are loading"
- "Add hover states to conversation list items"

**Reference tools:**
- shadcn/ui examples: https://ui.shadcn.com/
- Tailwind colors: https://tailwindcss.com/docs/customizing-colors
- Screenshots/mockups always help

### Tech Stack

- **React 18** with **TypeScript**
- **Vite** - Build tool (super fast HMR)
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component primitives
- **TanStack Query** - Server state management

### Component Structure
- `src/components/ui/` - shadcn base components (Button, Card, Input, etc.)
- `src/components/` - App-specific components (UploadForm, MessageView, etc.)
- Modify app components freely
- Extend UI components as needed

### Port Reference

- `5173` - Vite dev server (frontend development)
- `8000` - Full stack Docker (production-like)
- `3000` - Backend API (when run standalone)

## Backend Development

### Key Components

- **crypto/signal.py**: Handles Signal config.json parsing and SQLCipher decryption
- **db/queries.py**: Database query layer with typed results
- **api/routes.py**: FastAPI route handlers
- **models/schemas.py**: Pydantic request/response models

### Running Tests

```bash
cd backend
pytest
```

### Code Quality

```bash
# Linting
ruff check .

# Formatting
black .
```

## Frontend Development

### Key Components

- **components/UploadForm.tsx**: File upload interface
- **components/ConversationList.tsx**: Conversation sidebar
- **components/MessageView.tsx**: Message display with pagination
- **services/api.ts**: API client using Axios

### Running Tests

```bash
cd frontend
pnpm test
```

### Code Quality

```bash
# Linting
pnpm lint

# Formatting
pnpm format
```

## Signal Database Schema

The Signal Desktop database uses SQLCipher encryption. Key tables:

- **conversations**: Conversation metadata (id, name, type, etc.)
- **messages**: Individual messages with timestamps, body, sender info
- **Other tables**: attachments, reactions, quotes, etc.

## Security Notes

- Encryption keys are never logged or persisted beyond runtime memory
- Database decryption happens in-memory or in secure temporary files
- All endpoints are localhost-only by default
- CORS is restricted to localhost origins

## Debugging

### Backend Logs

Backend uses Python's logging module. Logs are printed to stdout.

### Frontend Dev Tools

Use browser DevTools to inspect:
- Network requests to `/api/*` endpoints
- React Query cache state
- Component renders

## Building for Production

```bash
docker build -t signal-archive-viewer .
docker run -p 127.0.0.1:8000:8000 signal-archive-viewer
```

## Common Issues

### SQLCipher Not Found

Install SQLCipher development libraries:

```bash
# Ubuntu/Debian
sudo apt-get install libsqlcipher-dev

# macOS
brew install sqlcipher
```

### Port Already in Use

Change the port in `docker-compose.yml` or when running uvicorn:

```bash
uvicorn app.main:app --port 8001
```

## Contributing

1. Follow the code style (enforced by ruff/black/prettier)
2. Add tests for new features
3. Update documentation
4. Ensure Docker build succeeds
