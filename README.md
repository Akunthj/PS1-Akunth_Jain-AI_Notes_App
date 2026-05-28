# ✦ AI Notes App

A full-stack notes application with AI-powered summarization and title generation.

**Live Demo:** [your-url-here]  
**Backend:** FastAPI (Python) · **Frontend:** React + Vite · **Database:** SQLite  
**AI:** Anthropic Claude API

---

## What it does

| Feature | Description |
|---|---|
| Create / Edit / Delete notes | Full CRUD — create, read, update, delete |
| Search | Search across title, content, and tags in real-time |
| Tags | Comma-separated tags on every note |
| AI Summary | Sends your note to Gemini, gets a 2-3 sentence summary |
| AI Title Generator | Writes your note content, click to auto-suggest a title |

---

## Project Structure

```
ai-notes-app/
├── backend/
│   ├── main.py           # All backend code (FastAPI routes + database + AI)
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Template for environment variables
│
└── frontend/
    ├── src/
    │   ├── App.jsx                     # Root component + state management
    │   ├── main.jsx                    # React entry point
    │   ├── index.css                   # All styles
    │   └── components/
    │       ├── NoteList.jsx            # Left sidebar note list
    │       ├── NoteEditor.jsx          # Right panel editor + AI buttons
    │       └── SearchBar.jsx           # Search input
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

---

## API Endpoints

| Method | URL | What it does |
|---|---|---|
| GET | `/` | Health check |
| GET | `/notes` | Get all notes |
| GET | `/notes?q=python` | Search notes |
| GET | `/notes/{id}` | Get one note |
| POST | `/notes` | Create a note |
| PUT | `/notes/{id}` | Update a note |
| DELETE | `/notes/{id}` | Delete a note |
| POST | `/notes/{id}/summarize` | AI: generate summary |
| POST | `/ai/generate-title` | AI: suggest a title |


---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI (Python) | Fast, modern, auto-generates API docs |
| Database | SQLite | Zero setup — stored in a single file |
| Frontend | React + Vite | Component-based UI, fast dev server |
| AI | Anthropic Claude API | Best-in-class text understanding |
| Deployment | Railway (backend) + Vercel (frontend) | Free tier, easy to deploy |

---

## Deployment

### Backend → Railway

1. Push code to GitHub
2. Create a new project at [railway.app](https://railway.app)
3. Connect your GitHub repo, select the `/backend` directory
4. Add environment variable: `ANTHROPIC_API_KEY=your_key`
5. Railway auto-detects FastAPI and deploys it
6. Copy the deployed URL (e.g. `https://ai-notes-backend.up.railway.app`)

### Frontend → Vercel

1. Open `frontend/src/App.jsx`
2. Change `API_BASE` to your Railway backend URL
3. Push to GitHub
4. Create a new project at [vercel.com](https://vercel.com)
5. Connect your repo, set Root Directory to `frontend`
6. Deploy — Vercel handles the rest

---

## Screenshots

*(Add screenshots after deployment)*

---

## Author

Your Name — BITS Pilani, PS-I 2026 @ KVGAI Tech Pvt. Ltd.
