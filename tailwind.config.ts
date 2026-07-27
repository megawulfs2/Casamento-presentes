import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ivory: "#FBF8F4",
        blush: "#F3E7E4",
        wine: "#6E2A3A",
        wineDark: "#511E2A",
        gold: "#B8945F",
        ink: "#2B2320",
        stone: "#8A7F79",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(43,35,32,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
