/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        roku: {
          purple: '#662D91',
          darkBg: '#100c19',
          cardBg: '#1e182e',
          cardHover: '#2d2442',
          accent: '#8034be',
          lightAccent: '#9e46ea',
          gray: '#8a829e',
          text: '#f1eff7'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Gothic A1"', '"Inter"', 'sans-serif']
      }
    },
  },
  plugins: [],
};
