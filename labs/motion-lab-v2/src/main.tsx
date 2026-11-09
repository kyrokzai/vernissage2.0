import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

for (const [rel, href, cross] of [
  ["preconnect", "https://fonts.googleapis.com", false],
  ["preconnect", "https://fonts.gstatic.com", true],
  ["stylesheet", "https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wght@0,300;0,400;1,300&family=Onest:wght@300;400;500;600&display=swap", false],
] as const) {
  const l = document.createElement("link");
  l.rel = rel;
  l.href = href;
  if (cross) l.crossOrigin = "anonymous";
  document.head.appendChild(l);
}
document.documentElement.lang = "ru";
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
