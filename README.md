# AI Notes App

A full-stack AI-powered notes application built using **React**, **FastAPI**, **SQLite**, and **Google Gemini AI**.

---

## Features

* JWT-based user authentication
* Create, edit, and delete notes
* AI-generated note summaries
* AI-generated note titles
* Search notes functionality

---

## Live Demo

Frontend: https://ps-1-akunth-jain-ai-notes-app.vercel.app/

Backend API Docs: https://ps1-akunth-jain-ai-notes-app.onrender.com/docs

---

## Tech Stack

### Frontend

* React
* Vite
* JavaScript

### Backend

* FastAPI
* SQLite
* JWT Authentication
* Gemini API

### Deployment

* Vercel (Frontend)
* Render (Backend)

---

## Project Structure

```text
ai-notes-app/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── notes.db
├── README.md
└── .gitignore
```

---

## Run Locally

### 1. Clone Repository

```bash
git clone https://github.com/Akunthj/PS1-Akunth_Jain-AI_Notes_App.git
cd PS1-Akunth_Jain-AI_Notes_App
```

---

# Backend Setup

### Create Virtual Environment

```bash
python -m venv myenv
```

### Activate Virtual Environment (Windows)

```powershell
myenv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r backend\requirements.txt
```

### Create `.env` File

Create a `.env` file inside the backend folder:

```env
GEMINI_API_KEY=your_api_key_here
```

### Run Backend

```bash
uvicorn backend.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

---

# Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Run Frontend

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## API Documentation

FastAPI Swagger Docs:

```text
http://127.0.0.1:8000/docs
```

---

## Environment Variables

| Variable       | Description           |
| -------------- | --------------------- |
| GEMINI_API_KEY | Google Gemini API key |

---

## Authentication

This project uses JWT-based authentication.

Protected routes require a valid access token.

---

## Future Improvements

* Markdown support
* Note categories and filters
* File/image uploads
* Collaborative notes
* Dark/light theme toggle

---

## Author

Akunth Jain
