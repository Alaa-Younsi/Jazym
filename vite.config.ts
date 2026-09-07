import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    cssTarget: "chrome100",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-dom") ||
              id.includes("react-router") ||
              /[\\/]react[\\/]/.test(id)
            )
              return "react-vendor";
            if (id.includes("@tanstack")) return "query-vendor";
            if (id.includes("framer-motion")) return "motion-vendor";
            if (id.includes("@supabase")) return "supabase-vendor";
          }
        },
      },
    },
  },
});
