// ============================================================
// NoteEditor.jsx — The main editor panel (right side of the screen)
// This is where users write notes and trigger AI features.
// ============================================================

import { useState, useEffect } from "react";
import { API_BASE, getAuthHeaders } from "../App";  // Import the API URL from App.jsx

// Props received from App.jsx:
// note      — the note object being edited (null if creating new)
// isNew     — boolean, true if creating a new note
// onSave    — function to call when saving
// onDelete  — function to call when deleting
// onNoteUpdate — function to update the note in App's state after AI ops
function NoteEditor({ note, isNew, onSave, onDelete, onNoteUpdate, token }) {

  // Local state for the form fields
  // These are separate from the note in App — the user can type without
  // auto-saving every keystroke
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [summary, setSummary] = useState("");

  // UI state
  const [aiLoading, setAiLoading] = useState(false);   // Is an AI request in progress?
  const [aiMessage, setAiMessage] = useState("");       // Status message to show user
  const [saved, setSaved] = useState(false);            // Did we just save?

  // useEffect with [note] dependency = "run this whenever the `note` prop changes"
  // This loads the note's data into the form fields when a different note is selected
  useEffect(() => {
    if (note) {
      // Populate form with existing note data
      setTitle(note.title || "");
      setContent(note.content || "");
      setTags(note.tags || "");
      setSummary(note.summary || "");
    } else {
      // Clear the form for a new note
      setTitle("");
      setContent("");
      setTags("");
      setSummary("");
    }
    setAiMessage("");   // Clear any AI messages when switching notes
  }, [note]);           // This effect re-runs every time `note` changes

  // ---- SAVE HANDLER ----
  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required!");
      return;
    }
    // Call the onSave function from App.jsx, passing the current form data
    onSave({ title: title.trim(), content: content.trim(), tags: tags.trim() });
    setSaved(true);
    // After 2 seconds, hide the "saved" indicator
    setTimeout(() => setSaved(false), 2000);
  };

  // ---- AI SUMMARY ----
  const handleSummarize = async () => {
    if (!note || isNew) {
      alert("Please save the note first before generating a summary.");
      return;
    }
    setAiLoading(true);
    setAiMessage("Generating summary...");
    try {
      // POST to our backend's summarize endpoint
      const response = await fetch(`${API_BASE}/notes/${note.id}/summarize`, {
        method: "POST",
        headers: getAuthHeaders(token),   // Send token — this endpoint is now protected
      });
      const data = await response.json();
      setSummary(data.summary);   // Update the summary display
      setAiMessage("✓ Summary generated!");
      // Update the note in App's state so the summary persists
      onNoteUpdate({ ...note, summary: data.summary });
    } catch (error) {
      setAiMessage("Failed to generate summary. Is the API key set?");
    } finally {
      setAiLoading(false);
    }
  };

  // ---- AI TITLE GENERATOR ----
  const handleGenerateTitle = async () => {
    if (!content.trim()) {
      alert("Write some content first!");
      return;
    }
    setAiLoading(true);
    setAiMessage("Generating title...");
    try {
      const response = await fetch(`${API_BASE}/ai/generate-title`, {
        method: "POST",
        headers: getAuthHeaders(token),    // Send token — this endpoint is now protected
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      setTitle(data.title);   // Auto-fill the title field
      setAiMessage("✓ Title generated!");
    } catch (error) {
      setAiMessage("Failed to generate title.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="note-editor">
      {/* EDITOR HEADER */}
      <div className="editor-header">
        <span className="editor-status">
          {isNew ? "New Note" : `Last saved: ${note ? new Date(note.updated_at).toLocaleString() : ""}`}
          {saved && <span className="saved-badge"> · Saved ✓</span>}
        </span>
        <div className="editor-actions">
          {/* Disable buttons while AI is loading */}
          <button
            className="btn btn-ai"
            onClick={handleGenerateTitle}
            disabled={aiLoading}
          >
            ✦ Gen Title
          </button>
          <button
            className="btn btn-ai"
            onClick={handleSummarize}
            disabled={aiLoading || isNew}
          >
            ✦ Summarize
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save
          </button>
          {/* Only show Delete button when editing an existing note */}
          {!isNew && note && (
            <button
              className="btn btn-danger"
              onClick={() => onDelete(note.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* AI STATUS MESSAGE */}
      {aiMessage && (
        <div className={`ai-message ${aiLoading ? "loading" : ""}`}>
          {aiLoading && <span className="spinner" />}
          {aiMessage}
        </div>
      )}

      {/* TITLE INPUT */}
      <input
        className="title-input"
        type="text"
        placeholder="Note title..."
        value={title}
        // onChange fires every time the user types a character
        // e.target.value is the current text in the input field
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* TAGS INPUT */}
      <input
        className="tags-input"
        type="text"
        placeholder="Tags (comma-separated): work, ideas, personal"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {/* CONTENT TEXTAREA */}
      <textarea
        className="content-textarea"
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* AI SUMMARY — shown only if a summary exists */}
      {summary && (
        <div className="summary-box">
          <h4 className="summary-title">✦ AI Summary</h4>
          <p className="summary-text">{summary}</p>
        </div>
      )}
    </div>
  );
}

export default NoteEditor;
