import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 5173,
      host: "0.0.0.0",
      allowedHosts: ["localhost", ".vercel.app", ".up.railway.app"],
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["pwa-192x192.png", "pwa-512x512.png"],
        manifest: {
          name: "Kwinty 3D",
          short_name: "Kwinty",
          description:
            "A 3D five-in-a-row block placement game with single player and multiplayer modes.",
          theme_color: "#1a1a1a",
          background_color: "#1a1a1a",
          display: "standalone",
          orientation: "any",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,woff2}", "pwa-*.png"],
          navigateFallback: "/index.html",
          clientsClaim: true,
          skipWaiting: true,
        },
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
