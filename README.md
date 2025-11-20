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
No volume mounts — just start the container and upload your files.

```bash
docker run -p 127.0.0.1:8000:8000 ghcr.io/yourname/signal-archive-viewer:latest
```

Then open:

```
http://localhost:8000
```

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

* `config.json`
* `sql/db.sqlite`, `db.sqlite-wal`, `db.sqlite-shm` (upload only `db.sqlite` — other two are optional)

---

## 🔧 Advanced: Volume Mount Mode

For power users who don't want to upload files manually.

```bash
docker run \
  -p 127.0.0.1:8000:8000 \
  -v "$HOME/.config/Signal:/signal:ro" \
  ghcr.io/yourname/signal-archive-viewer:latest
```

Now open:

```
http://localhost:8000
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

## 🛠 Development (Optional)

If you want to build the image locally:

```bash
git clone https://github.com/yourname/signal-archive-viewer.git
cd signal-archive-viewer
docker build -t sav .
docker run -p 127.0.0.1:8000:8000 sav
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
