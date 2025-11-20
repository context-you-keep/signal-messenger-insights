# Quick Start Guide

## TL;DR - Fastest Path to Success

### On Your Signal Desktop System

1. **Extract your database key** (one-time setup):
   ```bash
   cd signal-archive-viewer
   ./extract-signal-key.sh
   ```

   This will output something like:
   ```
   🔑 Your Signal Database Key:
   99fab65b512501f9df1e325d74fde937add2fa555aa19f55a2ba604d2a6fda88
   ```

2. **Create a simple config.json**:
   ```bash
   echo '{
     "key": "99fab65b512501f9df1e325d74fde937add2fa555aa19f55a2ba604d2a6fda88"
   }' > signal-config-plain.json
   ```
   (Replace with your actual key from step 1)

3. **Copy your database**:
   ```bash
   cp ~/.config/Signal/sql/db.sqlite signal-db.sqlite
   ```

4. **Transfer both files** to the system running Signal Archive Viewer:
   - `signal-config-plain.json` (your extracted key)
   - `signal-db.sqlite` (your message database)

### On Your Viewer System

1. **Start the viewer**:
   ```bash
   docker compose up --build
   ```

2. **Open browser**:
   ```
   http://localhost:3000
   ```

   The viewer runs two services:
   - Frontend (Next.js) on port 3000
   - Backend (FastAPI) on port 8000

3. **Upload files**:
   - Upload `signal-config-plain.json` as config.json
   - Upload `signal-db.sqlite` as db.sqlite

4. **Browse your messages!** 🎉

---

## Why Do I Need to Extract the Key?

Modern Signal Desktop encrypts the database key using your system keyring (GNOME Keyring, macOS Keychain, Windows Credential Manager).

The Docker container running Signal Archive Viewer:
- ❌ Cannot access your host system's keyring
- ❌ Cannot decrypt the `encryptedKey` field in config.json
- ✅ CAN use a plain `key` field directly

So we extract the key once on your Signal system (where you have keyring access), then create a simplified config that works anywhere.

---

## Troubleshooting

### "Failed to get password from gnome_libsecret"

**Problem**: You uploaded a config.json with `encryptedKey` instead of plain `key`.

**Solution**: Follow the extraction steps above to create a config with plain `key`.

### "secret-tool: command not found"

**Problem**: The extraction script needs libsecret-tools.

**Solution**: Install it:
```bash
# Ubuntu/Debian
sudo apt install libsecret-tools

# Fedora/RHEL
sudo dnf install libsecret

# Arch
sudo pacman -S libsecret
```

### "Could not retrieve Signal encryption password from keyring"

**Problem**:
- Signal Desktop hasn't been run on this system, OR
- You're running as a different user than the one who runs Signal

**Solution**:
1. Open Signal Desktop and make sure it's unlocked
2. Run the extraction script as the same user who runs Signal:
   ```bash
   # If Signal runs as user 'alice':
   sudo -u alice ./extract-signal-key.sh
   ```

### "file is not a database"

**Problem**: Wrong database key or corrupted database file.

**Solution**:
1. Make sure you copied the COMPLETE output from extract-signal-key.sh
2. Verify db.sqlite is from `~/.config/Signal/sql/db.sqlite` (not a different path)
3. Make sure db.sqlite wasn't corrupted during transfer

---

## Alternative: Use the Key We Already Extracted

During our testing session, we extracted your key:

```
99fab65b512501f9df1e325d74fde937add2fa555aa19f55a2ba604d2a6fda88
```

If this is still your current Signal key (hasn't been re-encrypted), you can use it directly:

1. Create `config.json`:
   ```json
   {
     "key": "99fab65b512501f9df1e325d74fde937add2fa555aa19f55a2ba604d2a6fda88"
   }
   ```

2. Copy your current `~/.config/Signal/sql/db.sqlite`

3. Upload both to http://localhost:3000

**Note**: This only works if Signal hasn't regenerated the encryption key since our testing session.

---

## Security Reminder

⚠️ The extracted database key can decrypt your **entire Signal message history**.

**Keep it secure**:
- Don't commit it to git repositories
- Don't share it via unsecured channels
- Store it in a password manager if needed
- Delete temporary files after successful upload

The Signal Archive Viewer processes everything locally and never sends data over the network, but you still want to protect the key itself.
