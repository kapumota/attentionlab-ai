import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Base relativa para que los assets funcionen bien en Hugging Face Spaces,
  // GitHub Pages y otros hostings estáticos con rutas anidadas.
  base: "./",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // En desarrollo local, el frontend corre en :5173 y FastAPI en :8000.
      // Así el cliente puede llamar /api/* sin configurar VITE_API_BASE_URL.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: "0.0.0.0"
  }
});
