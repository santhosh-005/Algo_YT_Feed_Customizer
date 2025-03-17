import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),  
    tailwindcss(),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "./public/background.js"),
        content: resolve(__dirname, "./public/content.js"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
