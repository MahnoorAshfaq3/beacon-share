import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api and /socket.io to the backend during local development so the
// client can be started with a single `npm run dev` and no CORS fuss.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
