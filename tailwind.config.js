/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: "#0B1020",
          bg2: "#141C2E",
          surface: "#FFFFFF",
          text: "#172033",
          muted: "#7B8495",
        },
        gold: {
          DEFAULT: "#D6A84F",
          soft: "#E9C987",
          deep: "#A97F2C",
        },
        steel: {
          DEFAULT: "#4D8DCE",
          soft: "#8FB8E4",
          deep: "#2F6396",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 8px 24px -12px rgba(16,24,40,.18)",
        lift: "0 12px 32px -12px rgba(16,24,40,.28)",
      },
    },
  },
  plugins: [],
};
