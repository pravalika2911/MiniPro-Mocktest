/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Deep Navy / Slate 900
        primary: "#3b82f6", // Bright Blue Action
        success: "#10b981", // Neon Green Verified
        critical: "#e11d48", // Crimson Red Breach
        surface: "#1f2937", // Slate 800 Surface
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
