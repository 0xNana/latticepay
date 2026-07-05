import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function extractHost(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).host;
  } catch {
    return null;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appHost = extractHost(env.VITE_APP_URL);
  const allowedHosts = [
    "localhost",
    "127.0.0.1",
    ...(appHost ? [appHost] : []),
    ...(env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(",").map((x) => x.trim()).filter(Boolean) : [])
  ];

  return {
    plugins: [react()],
    server: {
      allowedHosts,
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp"
      }
    }
  };
});
