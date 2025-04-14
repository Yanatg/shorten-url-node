// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Scan all relevant files in src
  ],
  theme: {
    extend: {}, // Add custom theme settings here if needed
  },
  plugins: [], // Add Tailwind plugins here if needed
}