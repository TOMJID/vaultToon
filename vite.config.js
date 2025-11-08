import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  server: {
    proxy: {
      "/api/manga": {
        target: "https://api.mangadex.org",
        changeOrigin: true,
        rewrite: (path) => {
          // Rewrite /api/manga to /manga and /api/manga/:id to /manga/:id
          return path.replace(/^\/api/, "");
        },
      },
      "/api/covers": {
        target: "https://uploads.mangadex.org",
        changeOrigin: true,
        rewrite: (path) => {
          // Rewrite /api/covers to /covers
          return path.replace(/^\/api/, "");
        },
      },
    },
  },
});
