import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070b12",
        card: "#111827",
        border: "#1f2937",
      },
      boxShadow: {
        terminal: "0 10px 30px -15px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
