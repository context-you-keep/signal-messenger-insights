# Signal Archive Viewer

A secure, local-only tool for exploring your **Signal Desktop** message history.
Decrypt, browse, search, and export your conversations — **without any data leaving your machine.**

This tool never connects to Signal servers, never sends analytics, and never uploads files.
Everything runs privately on **localhost** in a Docker container that you control.

---

## ⭐ Features

- 🔐 **Local-only, privacy-first** — all decryption happens on your machine
- 📁 **Two ways to load your Signal data**
  - Upload `config.json` + `db.sqlite` via the browser
  - **OR** mount your Signal Desktop directory read-only
- 💬 **Full conversation viewer**
- 🔎 **Search across messages**
- 📎 **View and export attachments**
- 📤 **Export conversations** (Markdown, HTML, JSON — coming soon)
- 🧠 **Future support for local or API-based LLM insights** (summaries, topic extraction, etc.)

---

## 🚀 Quick Start (Upload Mode)

This is the simplest way to run the viewer.
No volume mounts — just start the containers and upload your files.

```bash
docker compose up
```

Then open:

```
http://localhost:3000
```

The viewer consists of two services:
- **Frontend** (Next.js) on port 3000 - User interface
- **Backend** (FastAPI) on port 8000 - API and database decryption

You will be prompted to upload:

* Your `config.json`
* Your encrypted `db.sqlite` (from the `sql/` directory in your Signal profile)

The app decrypts the database **in-memory**, loads your conversations, and never writes data to disk unless you export intentionally.

---

## 🧠 Where to find your Signal files

### Linux

```
~/.config/Signal/
```

### macOS

```
~/Library/Application Support/Signal/
```

### Windows

```
%AppData%\Signal\
```

You will need:

* `config.json` - **See important note below about encrypted keys**
* `sql/db.sqlite`, `db.sqlite-wal`, `db.sqlite-shm` (upload only `db.sqlite` — other two are optional)

### ⚠️ Important: Encrypted Key vs Plain Key

Signal Desktop stores the database encryption key in two possible ways:

1. **Plain key** (older Signal versions): `config.json` contains a `"key"` field with the actual encryption key
2. **Encrypted key** (newer Signal versions): `config.json` contains an `"encryptedKey"` field that's encrypted using your system keyring

**If your config.json has an `encryptedKey` field**, the Docker container cannot decrypt it because it doesn't have access to your system keyring.

**Solution**: Extract the plain key on your Signal Desktop system, then create a simple config.json:

```bash
# On your Signal Desktop system, run:
./extract-signal-key.sh
```

This will output your decrypted database key. Then create a new `config.json`:

```json
{
  "key": "your-extracted-key-here"
}
```

Upload this simplified `config.json` along with your `db.sqlite`.

**Security Note**: The extracted key can decrypt your entire Signal history. Keep it secure and never share it.

---

## 🔧 Advanced: Volume Mount Mode

For power users who don't want to upload files manually, you can mount your Signal directory.

Edit `docker-compose.yml` and uncomment the volumes section for your OS:

```yaml
volumes:
  - ~/.config/Signal:/signal:ro  # Linux
```

Then run:

```bash
docker compose up
```

Now open:

```
http://localhost:3000
```

The app will auto-detect:

* `/signal/config.json`
* `/signal/sql/db.sqlite`

This mode is ideal for frequent use or automation.

---

## 🕹 How to Use the App

1. Launch the viewer (upload or volume mode)
2. Select or confirm your Signal data source
3. Browse your conversations in the sidebar
4. Click any conversation to view:

   * Messages (with pagination)
   * Timestamps
   * Attachments
5. Use the search bar to find messages by keyword
6. Export conversations as needed (HTML/Markdown/JSON)

---

## 🔒 Privacy & Security

Your privacy is the point of this project.

* The app runs entirely on `localhost`
* No internet access is required
* No telemetry, analytics, or tracking
* Your Signal files never leave your machine
* Decrypted SQLite DB is kept **in-memory** or in a secure temporary location
* Mounted directories are read-only

You control the container.
You control your data.

---

## 🛠 Development

### Local Development (without Docker)

**Backend:**
```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`

### Building with Docker

```bash
git clone https://github.com/yourname/signal-archive-viewer.git
cd signal-archive-viewer
docker compose build
docker compose up
```

---

## 🗺 Roadmap

* Conversation exports (Markdown / HTML / JSON)
* Attachment extraction tools
* LLM-assisted insights:

  * Conversation summaries
  * Topic clustering
  * Highlighting significant messages
  * Relationship mappings
* Optional offline-only mode using local LLMs (Ollama)

---

## ⚖️ Disclaimer

This tool is designed for **your own Signal Desktop data**.
Do not use it on systems or data you do not own or have explicit permission to analyze.

---

## ❤️ Contributing

Bug reports, feature requests, and PRs welcome.

---

## 📄 License

MIT
