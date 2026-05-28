# ============================================================
# main.py — AI Notes App Backend WITH Authentication
# New additions vs original:
#   - users table in the database
#   - /auth/register and /auth/login endpoints
#   - JWT tokens for sessions
#   - All note endpoints now require login
#   - Each user only sees their own notes
# Everything else is identical to before.
# ============================================================

from fastapi import FastAPI, HTTPException, Depends   # Depends = dependency injection (explained below)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  # Reads the token from request headers
from pydantic import BaseModel
from typing import Optional
import sqlite3
import os
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime, timedelta  # timedelta = "a duration of time" e.g. 7 days

# NEW AUTH IMPORTS
from jose import JWTError, jwt            # jose creates and verifies JWT tokens
from passlib.context import CryptContext  # passlib hashes passwords safely

app = FastAPI(title="AI Notes App", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# PASSWORD HASHING SETUP
# We NEVER store passwords as plain text.
# bcrypt turns "mypassword123" into something like "$2b$12$xH..."
# It's a one-way process — you can't reverse it.
# To check a login: hash the attempt and compare with the stored hash.
# ============================================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Turns a plain password into a bcrypt hash."""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Returns True if the plain password matches the stored hash."""
    return pwd_context.verify(plain, hashed)

# ============================================================
# JWT TOKEN SETUP
# JWT = JSON Web Token. It's a signed string that proves identity.
# When a user logs in, we give them a token like:
#   "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.abc123"
# The frontend stores this and sends it with every request.
# We verify the token to know WHO is making the request.
# SECRET_KEY is used to sign tokens — keep it secret in production!
# ============================================================
SECRET_KEY = os.environ.get("SECRET_KEY", "changeme-use-a-long-random-string-in-production")
ALGORITHM = "HS256"           # The signing algorithm
TOKEN_EXPIRE_DAYS = 7         # Tokens are valid for 7 days

def create_token(user_id: int) -> str:
    """
    Creates a JWT token for a user.
    The token contains: user_id + expiry time.
    It's signed with SECRET_KEY so we can verify it wasn't tampered with.
    """
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)  # Expiry time
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> int:
    """
    Decodes a JWT token and returns the user_id inside it.
    Raises an exception if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ============================================================
# AUTH DEPENDENCY
# FastAPI "dependencies" are functions that run before a route handler.
# By adding `user_id: int = Depends(get_current_user)` to any route,
# FastAPI will automatically:
#   1. Extract the token from the Authorization header
#   2. Decode it and get the user_id
#   3. Pass user_id into our route function
# If the token is missing/invalid, it returns a 401 error automatically.
# This is how we "protect" routes — require login.
# ============================================================
bearer_scheme = HTTPBearer()  # Reads "Authorization: Bearer <token>" from the request header

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> int:
    """
    This is our auth dependency.
    It reads the token from the request header and returns the user_id.
    Add `user_id: int = Depends(get_current_user)` to any route to protect it.
    """
    return decode_token(credentials.credentials)

# ============================================================
# DATABASE SETUP
# Same as before, but now we also create a `users` table.
# Notes table gets an `owner_id` column linking each note to a user.
# ============================================================
DB_FILE = "notes.db"

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()

    # USERS TABLE — stores registered accounts
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT UNIQUE NOT NULL,   -- UNIQUE means no two users can have the same email
            password_hash TEXT NOT NULL,           -- bcrypt hash, never the real password
            name          TEXT NOT NULL,
            created_at    TEXT NOT NULL
        )
    """)

    # NOTES TABLE — same as before but with owner_id
    # REFERENCES users(id) = foreign key: owner_id must be a valid user id
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id    INTEGER NOT NULL REFERENCES users(id),
            title       TEXT NOT NULL,
            content     TEXT NOT NULL,
            tags        TEXT DEFAULT '',
            summary     TEXT DEFAULT '',
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

init_db()

# ============================================================
# DATA MODELS
# ============================================================

class RegisterRequest(BaseModel):
    """Data the frontend sends when a user signs up."""
    name: str
    email: str
    password: str       # Plain text — we hash it before storing

class LoginRequest(BaseModel):
    """Data the frontend sends when a user logs in."""
    email: str
    password: str

class NoteCreate(BaseModel):
    title: str
    content: str
    tags: Optional[str] = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None

def row_to_dict(row):
    return dict(row)

# ============================================================
# AUTH ROUTES
# ============================================================

@app.get("/")
def read_root():
    return {"message": "AI Notes App backend is running!"}


@app.post("/auth/register")
def register(data: RegisterRequest):
    """
    POST /auth/register
    Creates a new user account.
    Returns a JWT token so the user is immediately logged in after registering.
    """
    conn = get_db()

    # Check if email is already taken
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (data.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password before storing
    hashed = hash_password(data.password)
    now = datetime.utcnow().isoformat()

    cursor = conn.execute(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
        (data.email, hashed, data.name, now)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    # Create and return a token — user is now "logged in"
    token = create_token(user_id)
    return {"token": token, "name": data.name, "email": data.email}


@app.post("/auth/login")
def login(data: LoginRequest):
    """
    POST /auth/login
    Checks email + password, returns a JWT token if correct.
    """
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email,)).fetchone()
    conn.close()

    # Check user exists AND password is correct
    # We do both checks together to avoid leaking whether an email exists
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"])
    return {"token": token, "name": user["name"], "email": user["email"]}


@app.get("/auth/me")
def get_me(user_id: int = Depends(get_current_user)):
    """
    GET /auth/me
    Returns info about the currently logged-in user.
    Protected — requires a valid token.
    The `Depends(get_current_user)` part handles token verification automatically.
    """
    conn = get_db()
    user = conn.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return row_to_dict(user)

# NOTE ROUTES 


@app.get("/notes")
def get_all_notes(q: Optional[str] = None, user_id: int = Depends(get_current_user)):
    # user_id comes from the JWT token — tells us who is asking
    conn = get_db()
    if q:
        rows = conn.execute(
            "SELECT * FROM notes WHERE owner_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY updated_at DESC",
            (user_id, f"%{q}%", f"%{q}%", f"%{q}%")
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM notes WHERE owner_id = ? ORDER BY updated_at DESC",
            (user_id,)     # Only return THIS user's notes
        ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@app.get("/notes/{note_id}")
def get_note(note_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM notes WHERE id = ? AND owner_id = ?",
        (note_id, user_id)   # AND owner_id = ? prevents users from accessing other users' notes
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return row_to_dict(row)


@app.post("/notes")
def create_note(note: NoteCreate, user_id: int = Depends(get_current_user)):
    now = datetime.utcnow().isoformat()
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO notes (owner_id, title, content, tags, summary, created_at, updated_at) VALUES (?, ?, ?, ?, '', ?, ?)",
        (user_id, note.title, note.content, note.tags, now, now)
        # owner_id = user_id from the token — note is owned by the logged-in user
    )
    conn.commit()
    row = conn.execute("SELECT * FROM notes WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.put("/notes/{note_id}")
def update_note(note_id: int, note: NoteUpdate, user_id: int = Depends(get_current_user)):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM notes WHERE id = ? AND owner_id = ?", (note_id, user_id)
    ).fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Note not found")

    fields, values = [], []
    if note.title is not None:
        fields.append("title = ?"); values.append(note.title)
    if note.content is not None:
        fields.append("content = ?"); values.append(note.content)
    if note.tags is not None:
        fields.append("tags = ?"); values.append(note.tags)
    fields.append("updated_at = ?"); values.append(datetime.utcnow().isoformat())
    values.append(note_id)

    conn.execute(f"UPDATE notes SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/notes/{note_id}")
def delete_note(note_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM notes WHERE id = ? AND owner_id = ?", (note_id, user_id)
    ).fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Note not found")
    conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return {"message": f"Note {note_id} deleted"}


# AI ROUTES

load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

async def call_claude(prompt: str) -> str:
    if not GEMINI_API_KEY:
        return "API key not configured. Set the GEMINI_API_KEY environment variable."

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI error: {str(e)}"

@app.post("/notes/{note_id}/summarize")
async def summarize_note(note_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM notes WHERE id = ? AND owner_id = ?", (note_id, user_id)
    ).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Note not found")
    note = row_to_dict(row)
    prompt = f"""Summarize the following note in 2-3 sentences. Be concise and capture the key points.

Title: {note['title']}
Content: {note['content']}

Summary:"""
    summary = await call_claude(prompt)
    conn.execute(
        "UPDATE notes SET summary = ?, updated_at = ? WHERE id = ?",
        (summary, datetime.utcnow().isoformat(), note_id)
    )
    conn.commit()
    conn.close()
    return {"summary": summary}


@app.post("/ai/generate-title")
async def generate_title(data: dict, user_id: int = Depends(get_current_user)):
    content = data.get("content", "")
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content is required")
    prompt = f"""Suggest a short, catchy title (5 words or less) for this note. Reply with ONLY the title, nothing else.

Note content:
{content[:500]}"""
    title = await call_claude(prompt)
    return {"title": title.strip()}
