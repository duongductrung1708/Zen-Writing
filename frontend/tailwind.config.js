/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F9F8F4',
        charcoal: '#1A1A1A',
      },
      fontFamily: {
        serif: ['EB Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}

