// ============================================================
// main.jsx — The entry point of our React application
// This is the file that "mounts" React onto the HTML page.
// React takes over the <div id="root"> in index.html
// and renders our App component inside it.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";    // Import our global CSS styles
import App from "./App"; // Import our root component

// createRoot finds the <div id="root"> in index.html
// .render() puts our App component inside it
// StrictMode is a development tool — it highlights potential problems
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
