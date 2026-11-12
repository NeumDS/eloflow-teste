
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: process.env.NITRO_PRESET || "vercel",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
