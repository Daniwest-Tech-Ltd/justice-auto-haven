import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";

// Initialize theme before app renders
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
