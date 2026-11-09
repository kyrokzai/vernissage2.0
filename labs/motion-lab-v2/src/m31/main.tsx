import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./m31.css";
import { KitchenAssembly } from "./KitchenAssembly";

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

/** Корень с возможностью пересоздать модуль — для проверки очистки слушателей при повторном монтировании. */
function Root() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    (window as unknown as { __m31?: { remount: () => void } }).__m31 = { remount: () => setKey((k) => k + 1) };
  }, []);
  return <KitchenAssembly key={key} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
