import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const plugins = [react()];

  return {
    plugins,
    server: {
      host: "localhost",
      port: 5175,
      strictPort: true,
      // basicSsl is available via: VITE_USE_SSL=true npm run dev
      // For local HTTPS, run: npx vite --https
    },
    preview: {
      host: "localhost",
      port: 5175,
      strictPort: true,
    },
  };
});

