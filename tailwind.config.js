/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "darkBlue": "#131e57",
        "darkText": "#19243b",
        "grayText": "#475062",
        "lightgrayText": "#6c7381",
        "primary": "#1b2563",
        "background": "#f5f9fe",
      },
    },
  },
  plugins: [],
}

