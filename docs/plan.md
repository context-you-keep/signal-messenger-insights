# Signal Archive Viewer - Development Plan

## Current Implementation (Options A+B)

### Key Extraction UX Flow
1. User uploads db.sqlite + original config.json (with encryptedKey)
2. App detects encrypted format, shows instructions
3. User runs terminal command → key copied to clipboard automatically
4. User pastes into webapp textarea (Ctrl+V)
5. Frontend sends `extractedKey` with upload request
6. Backend uses pasted key, ignores config.json's encryptedKey
7. Key lives only in memory - ephemeral, gone when Docker stops

### Security Properties
- Key never persisted to disk on user's machine
- Key only exists in Docker container memory
- Key cleared when container stops/restarts
- More secure than creating config files

---

## Future Features

### Option D: Auto-Download Backup Config
**Status:** Planned / Not Implemented

After successful key extraction and paste, webapp could offer to generate and download a config.json with the plain key for the user to keep as backup.

**Pros:**
- User has backup for future use
- Standard file-based workflow option

**Cons:**
- Key persists to disk
- Extra step in flow
- Security trade-off

**Implementation Notes:**
- Add "Download decrypted config" button after successful load
- Generate JSON: `{"key": "<hex>"}`
- Use browser download API
- Optional feature - user chooses whether to save

---

## Technical Notes

### Chromium Safe Storage Encryption (used by Signal Desktop)
- Salt: `saltysalt`
- Iterations: 1 (not 1 million!)
- Key derivation: PBKDF2-HMAC-SHA1
- AES key size: 16 bytes (128-bit)
- IV: 16 spaces (`b' ' * 16`)
- Prefix: `v11` (3 bytes to skip)
- Mode: AES-CBC

Reference: `backend/app/crypto/signal.py:119-189`
