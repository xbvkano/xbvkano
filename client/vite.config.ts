import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function siteBase(): string {
  const raw = process.env.VITE_BASE_PATH ?? "";
  if (!raw || raw === "/") {
    return "/";
  }
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig({
  base: siteBase(),
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/media": "http://localhost:3001",
    },
  },
});
