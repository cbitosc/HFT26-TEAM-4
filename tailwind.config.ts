import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom palette for Warm Luxury / Executive aesthetic
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        peach: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        bronze: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },
        // Linear / Vercel Layered Obsidian Surfaces
        obsidian: {
          950: "#08090d", // Root deepest background
          900: "#0e111a", // Panel & sheet backing
          850: "#141824", // Elevated card surfaces
          800: "#1c2233", // Hover surfaces / active items
          750: "#252d43", // Borders & separators
          700: "#323c57",
        },
      },
      boxShadow: {
        "glow-emerald": "0 0 24px rgba(16, 185, 129, 0.14), 0 0 48px rgba(16, 185, 129, 0.04)",
        "glow-amber": "0 0 24px rgba(245, 158, 11, 0.14), 0 0 48px rgba(245, 158, 11, 0.04)",
        "glow-cyan": "0 0 24px rgba(6, 182, 212, 0.14), 0 0 48px rgba(6, 182, 212, 0.04)",
        "sheet-ambient": "0 24px 64px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        "glass-elevated": "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;

