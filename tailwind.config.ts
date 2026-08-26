import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-void": "#09090B",
        "amethyst-glow": "#8B5CF6",
        "neon-cyan": "#06B6D4",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
