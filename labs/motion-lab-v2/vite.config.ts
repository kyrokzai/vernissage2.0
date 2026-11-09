import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Две независимые страницы лаборатории: сцены V2 (index.html) и модуль M3.1 (m31.html)
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        m31: path.resolve(__dirname, "m31.html"),
      },
    },
  },
});
