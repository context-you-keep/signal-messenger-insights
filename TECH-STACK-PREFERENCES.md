# Tech Stack Preferences

This document should be followed for this project and only deviated from with strong justification.

---

**Project:** signal-archive-viewer

## App Type
- Local-only desktop GUI
- No network access required for core features

## Frontend

- **Framework:** Tauri
- **UI Library:** React 18
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (where useful)
- **State Management:**
  - Local React state (default)
  - Zustand (only if complex client state emerges)

## Core Backend

- **Runtime:** Rust (Tauri backend)
- **Responsibilities:**
  - Locate Signal Desktop profile directory (per OS)
  - Read and parse config.json
  - Extract and decode encryption key
  - Decrypt encrypted db.sqlite into:
    - In-memory SQLite DB (preferred), or
    - Temp on-disk SQLite with secure deletion
  - Provide a narrow IPC API to the frontend for:
    - Listing conversations
    - Fetching message pages
    - Resolving attachments to local files

## Data Storage

- **Primary:**
  - Encrypted Signal DB (read-only)
- **Working Copy:**
  - SQLite (decrypted, in-memory or temp file)
- **Local Metadata:**
  - Optional SQLite or JSON for:
    - User-defined tags
    - Export history
    - View state (favorites, filters)

## Platforms

- Windows (Signal Desktop default path)
- macOS
- Linux

## Testing

- **Rust:** cargo test (core decryption + DB access)
- **TypeScript:** Vitest for UI logic
- **E2E:** Playwright (optional, later)

## Packaging

Tauri bundling for:
- `.exe` (Windows)
- `.dmg`/`.app` (macOS)
- `.AppImage`/`.deb` (Linux)

## Tooling

- **Package Manager:** pnpm
- **Linting & Formatting:**
  - TypeScript: ESLint + Prettier
  - Rust: rustfmt + clippy
