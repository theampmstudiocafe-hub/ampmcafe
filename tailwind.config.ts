import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        studio: {
          terracotta: {
            DEFAULT: "#C86D51",
            hover: "#B65A3E",
            light: "#F7ECE8",
          },
          sage: {
            DEFAULT: "#657E6B",
            hover: "#536A58",
            light: "#EFF4F0",
          },
          linen: {
            DEFAULT: "#F9F6F0",
            dark: "#EDE8DD",
          },
          slate: {
            DEFAULT: "#1E2421",
            light: "#343E38",
          },
          clay: {
            DEFAULT: "#D4A373",
            light: "#FAEDCD",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
