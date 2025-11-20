# Signal Archive Viewer

> A local-only desktop app to browse, search, and export your Signal Desktop history from your own machine, using the keys already stored on disk.

---

## ⚡ Overview

Signal Local Archive Viewer (SLAV) is a privacy-respecting GUI that lets you:

- Decrypt your **local** Signal Desktop database (using the key stored in `config.json`)
- Browse and search conversations in a friendly interface
- Export selected threads or messages to portable formats
- Keep everything **offline** and **on your own machine**

This project **does not** connect to Signal's servers, bypass end-to-end encryption, or give you access to accounts you don't already control. It just gives you a better interface to the data Signal Desktop already stores locally and encrypted.

---

## 🎯 Goals

- **Local-only**: No network calls required for core functionality.
- **Read-only by default**: Avoid corrupting the live Signal Desktop database.
- **Human-friendly UI**: Message list, conversation sidebar, full-text search.
- **Export tooling**: Per-conversation export to Markdown, HTML, or JSON.
- **Forensics / backup friendly**: Work over a copied profile or backup directory.
- **Cross-platform**: Linux, macOS, Windows, matching Signal Desktop's reach.

---

## 🚫 Non-Goals

- Running as a server or exposing data over the network.
- Bypassing Signal's E2E encryption or accessing other users' messages.
- Writing back into Signal's database or spoofing messages.
- Cloud sync or remote backup (out of scope; explicitly local-only).

---

## 🧱 High-Level Architecture

**Components:**

- **Backend Module**:
  - Locates the Signal Desktop directory
  - Reads `config.json` and extracts the encryption key
  - Decrypts the `db.sqlite` file into an in-memory or temporary SQLite database
  - Exposes a narrow API for queries (conversations, messages, attachments)

- **Frontend GUI**:
  - Provides a user-friendly interface for browsing conversations
  - Handles search, filtering, and export operations
  - Communicates with backend via IPC

**Data Flow**:
1. On startup, SLAV detects the Signal Desktop profile path based on OS.
2. User chooses:
   - **Live mode**: work against the live profile (read-only), or
   - **Offline mode**: point at a copied backup directory.
3. Backend:
   - Reads `config.json` → extracts base64-encoded encryption key.
   - Uses this key to decrypt `db.sqlite` into a temporary decrypted DB.
4. Frontend queries the backend for:
   - Conversation list (IDs, names, last message, unread counts)
   - Message history, with pagination
   - Attachments metadata and files

**Separation of Concerns**:
- `core/crypto`: handles key parsing and database decryption.
- `core/db`: wraps the decrypted SQLite DB and exposes typed queries.
- `api/`: thin layer exposing a local API to the GUI.
- `ui/`: all GUI components, no direct DB or crypto logic.

---

## 🔐 Security & Privacy Model

- **Local-only**:
  - No external endpoints. Network access can be disabled at the framework level.
- **No key exfiltration**:
  - The Signal encryption key is never logged, never sent, never stored outside the app's runtime memory.
- **Decrypted DB lifecycle**:
  - Use one of:
    - **In-memory SQLite** only, or
    - Temporary on-disk file with `O_EXCL`, strict perms, and secure deletion on exit.
- **Read-only semantics**:
  - Open the original encrypted DB in read-only mode.
  - Never modify `db.sqlite` or `config.json`.
  - All writes (exports, user settings) go to a separate app data directory.
- **Profile selection**:
  - Make it visually obvious whether user is in **Live** vs **Backup** mode.
- **Auditability**:
  - Optional debug log with configurable verbosity, with PII-free logging defaults.

---

## 🧭 Key Features

Planned feature set:

### Core

- Auto-detection of Signal Desktop profile location:
  - Linux: `~/.config/Signal/`
  - macOS: `~/Library/Application Support/Signal/`
  - Windows: `%AppData%\Roaming\Signal\`
- `config.json` parsing and key extraction.
- Decryption of `db.sqlite` into a temporary readable DB.
- Conversation list view:
  - Name, phone/handle (hashed/partial by default), last message snippet, last activity time.
- Message viewer:
  - Bubble view with timestamps and direction (sent/received).
  - Basic formatting for text, emojis, and quoted replies.
- Attachments:
  - Show attachment metadata and thumbnail where feasible.
  - Option to export media to a user-selected directory.

### Search & Export

- Full-text search across:
  - Messages, by keyword/phrase
  - Sender, by contact handle
- Filters:
  - By conversation, date range, or direction (sent/received).
- Export options:
  - **Conversation → Markdown** (good for second brain tools)
  - **Conversation → HTML** (printable archive)
  - **Conversation → JSON** (for further analysis or tooling)
- Optional "Export all conversations" with rate limiting and progress feedback.

### Power-User / Forensics Mode

- Ability to point SLAV at:
  - A copied `Signal` directory (offline analysis of a disk image)
  - A custom path, for unconventional setups or multiple profiles.
- Schema explorer (developer mode):
  - Inspect raw tables and run ad-hoc SQL queries on the decrypted DB.
  - Handy for advanced analysis and debugging.

---
