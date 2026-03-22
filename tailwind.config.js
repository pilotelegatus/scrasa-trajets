/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scrasa: {
          green:     '#4aab4e',
          'green-dark': '#357a38',
          'green-light': '#edf3ed',
          gray:      '#555555',
          'gray-light': '#f4f6f4',
          border:    '#d4e4d4',
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['Barlow', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      }
    }
  },
  plugins: []
}
