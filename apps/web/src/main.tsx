import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Auto-reload on stale chunk errors (after a new deployment)
window.addEventListener("error", (event) => {
  const msg = event.message ?? "";
  if (msg.includes("Failed to fetch dynamically imported module") || msg.includes("Importing a module script failed")) {
    window.location.reload();
  }
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = String(event.reason?.message ?? event.reason ?? "");
  if (reason.includes("Failed to fetch dynamically imported module") || reason.includes("Importing a module script failed")) {
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
