// ============================================================
// App.jsx — Root component, now with auth state
// New additions vs original:
//   - Reads token from localStorage on load
//   - Shows AuthPage if not logged in
//   - Passes token to all fetch calls via getAuthHeaders()
//   - Logout button in sidebar header
// Everything else is identical to before.
// ============================================================

import { useState, useEffect } from "react";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";
import SearchBar from "./components/SearchBar";
import AuthPage from "./components/AuthPage";

export const API_BASE = "http://localhost:8000";

// ---- HELPER: build auth headers ----
// Every protected request needs: Authorization: Bearer <token>
// We call this function to get the headers object for fetch calls.
export function getAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,   // "Bearer" is the standard prefix for JWT tokens
  };
}

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // AUTH STATE
  // null = not logged in; object = { token, name, email }
  const [user, setUser] = useState(null);

  // On app load, check if a token is already saved in localStorage.
  // This keeps the user logged in across page refreshes.
  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    if (token && name) {
      setUser({ token, name });   // Restore session
    }
    setLoading(false);
  }, []);

  // Fetch notes whenever the user logs in (user state changes)
  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async (query = "") => {
    if (!user) return;
    try {
      const url = query
        ? `${API_BASE}/notes?q=${encodeURIComponent(query)}`
        : `${API_BASE}/notes`;
      const response = await fetch(url, {
        headers: getAuthHeaders(user.token),   // Send the token!
      });
      if (response.status === 401) {
        // Token expired or invalid — log the user out
        handleLogout();
        return;
      }
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchNotes(query);
  };

  const handleSave = async (noteData) => {
    try {
      if (isCreating) {
        const response = await fetch(`${API_BASE}/notes`, {
          method: "POST",
          headers: getAuthHeaders(user.token),
          body: JSON.stringify(noteData),
        });
        const newNote = await response.json();
        setSelectedNote(newNote);
        setIsCreating(false);
      } else {
        const response = await fetch(`${API_BASE}/notes/${selectedNote.id}`, {
          method: "PUT",
          headers: getAuthHeaders(user.token),
          body: JSON.stringify(noteData),
        });
        const updatedNote = await response.json();
        setSelectedNote(updatedNote);
      }
      fetchNotes(searchQuery);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await fetch(`${API_BASE}/notes/${noteId}`, {
        method: "DELETE",
        headers: getAuthHeaders(user.token),
      });
      setSelectedNote(null);
      fetchNotes(searchQuery);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleNewNote = () => {
    setIsCreating(true);
    setSelectedNote(null);
  };

  // Called by AuthPage when login/register succeeds
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Clear everything and go back to login screen
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setUser(null);
    setNotes([]);
    setSelectedNote(null);
    setIsCreating(false);
  };

  // Show a blank screen while we check localStorage
  if (loading) return null;

  // If not logged in, show the auth page
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Logged in — show the notes app
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">✦ Notes</h1>
          <button className="new-note-btn" onClick={handleNewNote}>+ New</button>
        </div>

        {/* USER INFO + LOGOUT */}
        <div className="user-bar">
          <span className="user-name">👤 {user.name}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        <SearchBar onSearch={handleSearch} />
        <NoteList
          notes={notes}
          selectedId={selectedNote?.id}
          onSelect={setSelectedNote}
        />
      </aside>

      <main className="editor-panel">
        {selectedNote || isCreating ? (
          <NoteEditor
            note={selectedNote}
            isNew={isCreating}
            onSave={handleSave}
            onDelete={handleDelete}
            onNoteUpdate={setSelectedNote}
            token={user.token}
          />
        ) : (
          <div className="empty-state">
            <span className="empty-icon">✦</span>
            <p>Select a note or create a new one</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
