import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-plex-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        ink: "#16202b",
        subtle: "#4a5a6b",
        brand: {
          DEFAULT: "#1450a3",
          dark: "#0e3b76",
          light: "#e8f0fb",
        },
        ok: "#186a3b",
        warn: "#8a5a00",
      },
    },
  },
  plugins: [],
};

export default config;
