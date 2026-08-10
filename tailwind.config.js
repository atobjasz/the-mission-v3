/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#f7f0e9',
          100: '#ead9c7',
          200: '#d4b493',
          300: '#c4a484',
          400: '#a87f56',
          500: '#8a6240',
          600: '#6b4a2e',
          700: '#4d3623',
          800: '#2e1f15',
          900: '#1a120c',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
