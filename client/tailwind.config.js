/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--sig)",
        background: "var(--bg)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--pine)",
          foreground: "var(--onp)",
        },
        secondary: {
          DEFAULT: "var(--card)",
          foreground: "var(--ink)",
        },
        destructive: {
          DEFAULT: "var(--err)",
          foreground: "var(--bg)",
        },
        muted: {
          DEFAULT: "var(--line)",
          foreground: "var(--mut)",
        },
        accent: {
          DEFAULT: "var(--sig)",
          foreground: "var(--bg)",
        },
        popover: {
          DEFAULT: "var(--card)",
          foreground: "var(--ink)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--ink)",
        },
      },
      borderRadius: {
        lg: "6px",
        md: "4px",
        sm: "2px",
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', "'Times New Roman'", 'serif'],
        mono: ['ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}