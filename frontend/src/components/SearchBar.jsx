// ============================================================
// SearchBar.jsx — Simple search input component
// ============================================================

import { useState } from "react";

// onSearch is a function passed from App.jsx
// When the user submits a search, we call it with the query
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    // e.preventDefault() stops the form from doing a page reload (default browser behavior)
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");   // Search with empty string = show all notes
  };

  return (
    // We use a <form> so pressing Enter triggers the search
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="search-input"
        placeholder="Search notes..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // Live search: search as the user types (debouncing would be an improvement)
          onSearch(e.target.value);
        }}
      />
      {/* Show clear button only if there's something in the search box */}
      {query && (
        <button type="button" className="search-clear" onClick={handleClear}>
          ×
        </button>
      )}
    </form>
  );
}

export default SearchBar;
