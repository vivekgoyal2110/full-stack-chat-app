/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#4f46e5",
          secondary: "#9333ea",
          accent: "#10b981",
        },
        fontFamily: {
          sans: ["Inter", "sans-serif"],
        },
      },
    },
    plugins: [require('daisyui')],
    daisyui: {
      themes: ["light", "dark"], // optional
    },
  };
  