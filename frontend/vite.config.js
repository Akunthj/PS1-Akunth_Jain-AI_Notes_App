// vite.config.js
// Vite is our build tool and development server for React.
// This config tells Vite to use the React plugin (which enables JSX support).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The dev server runs on port 5173 by default
  // You can change it here if needed
});
