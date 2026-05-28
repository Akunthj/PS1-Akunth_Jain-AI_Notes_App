// ============================================================
// NoteList.jsx — Displays the list of notes in the sidebar
// This is a "presentational" component — it just shows data
// and calls functions passed to it via props.
// ============================================================

// Props are how parent components pass data DOWN to child components.
// This component receives: notes (array), selectedId (number), onSelect (function)
function NoteList({ notes, selectedId, onSelect }) {

  // If no notes exist, show a helpful message
  if (notes.length === 0) {
    return <p className="empty-list">No notes yet. Create one!</p>;
  }

  return (
    <div className="note-list">
      {/* .map() loops over the notes array and renders one NoteCard for each note */}
      {notes.map((note) => (
        // key prop is required when rendering lists — React uses it to track items efficiently
        <NoteCard
          key={note.id}
          note={note}
          isSelected={note.id === selectedId}  // Is this the currently open note?
          onClick={() => onSelect(note)}        // When clicked, tell App to select this note
        />
      ))}
    </div>
  );
}

// ---- NoteCard — a single note item in the list ----
function NoteCard({ note, isSelected, onClick }) {
  // Format the date nicely: "2026-05-26T12:00:00" → "May 26, 2026"
  const date = new Date(note.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Show a preview: take the first 80 characters of content
  const preview = note.content.slice(0, 80) + (note.content.length > 80 ? "..." : "");

  // Parse tags: "work,ideas" → ["work", "ideas"]
  const tags = note.tags ? note.tags.split(",").filter(t => t.trim()) : [];

  return (
    // isSelected adds the "selected" CSS class when this note is open
    <div
      className={`note-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <h3 className="note-card-title">{note.title}</h3>
      <p className="note-card-preview">{preview}</p>
      <div className="note-card-footer">
        <span className="note-card-date">{date}</span>
        {/* Only show tags if there are any */}
        {tags.length > 0 && (
          <div className="note-card-tags">
            {tags.slice(0, 2).map(tag => (   // Show max 2 tags in the list
              <span key={tag} className="tag-chip">{tag.trim()}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteList;
